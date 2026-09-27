import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { AnnotationEvent, LabelBatch, LabelTask } from './types.js';

let db: Database.Database | null = null;

export function openDb(dbPath: string): Database.Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  const instance = new Database(dbPath);
  instance.pragma('journal_mode = WAL');
  instance.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      question TEXT NOT NULL,
      schema_version INTEGER NOT NULL,
      config_json TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'AVAILABLE',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      position INTEGER NOT NULL,
      state TEXT NOT NULL DEFAULT 'AVAILABLE',
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_cursors (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_created_at TEXT
    );

    INSERT OR IGNORE INTO sync_cursors (id, last_created_at) VALUES (1, NULL);
  `);
  db = instance;
  return instance;
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function upsertBatch(batch: LabelBatch): void {
  const database = getDb();
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO batches (id, experiment_id, mode, question, schema_version, config_json, state, created_at)
       VALUES (@id, @experiment_id, @mode, @question, @schema_version, @config_json, 'AVAILABLE', @created_at)
       ON CONFLICT(id) DO UPDATE SET
         experiment_id = excluded.experiment_id,
         mode = excluded.mode,
         question = excluded.question,
         schema_version = excluded.schema_version,
         config_json = excluded.config_json`,
    )
    .run({
      id: batch.id,
      experiment_id: batch.experimentId,
      mode: batch.mode,
      question: batch.question,
      schema_version: batch.schemaVersion,
      config_json: JSON.stringify(batch.config),
      created_at: now,
    });

  const insertTask = database.prepare(
    `INSERT INTO tasks (id, batch_id, payload_json, position, state)
     VALUES (@id, @batch_id, @payload_json, @position, 'AVAILABLE')
     ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json`,
  );

  batch.tasks.forEach((task, index) => {
    insertTask.run({
      id: task.id,
      batch_id: batch.id,
      payload_json: JSON.stringify({ ...task, batchId: batch.id }),
      position: index,
    });
  });
}

export function listBatches(): LabelBatch[] {
  const database = getDb();
  const batchRows = database
    .prepare(
      `SELECT id, experiment_id, mode, question, schema_version, config_json
       FROM batches ORDER BY created_at DESC`,
    )
    .all() as Array<{
    id: string;
    experiment_id: string;
    mode: string;
    question: string;
    schema_version: number;
    config_json: string;
  }>;

  const taskStmt = database.prepare(
    `SELECT payload_json FROM tasks WHERE batch_id = ? ORDER BY position ASC`,
  );

  return batchRows.map((row) => {
    const tasks = taskStmt.all(row.id) as Array<{ payload_json: string }>;
    return {
      id: row.id,
      experimentId: row.experiment_id,
      mode: row.mode as LabelBatch['mode'],
      question: row.question,
      schemaVersion: row.schema_version,
      config: JSON.parse(row.config_json),
      tasks: tasks.map((t) => JSON.parse(t.payload_json) as LabelTask),
    };
  });
}

export function leaseTasks(
  batchId: string,
  limit: number,
): { assignmentId: string; leaseExpiresAt: string; tasks: LabelTask[] } | null {
  const database = getDb();
  const batch = database.prepare(`SELECT id FROM batches WHERE id = ?`).get(batchId) as
    | { id: string }
    | undefined;
  if (!batch) {
    return null;
  }

  const assignmentId = crypto.randomUUID();
  const leaseExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const rows = database
    .prepare(
      `SELECT id, payload_json FROM tasks
       WHERE batch_id = ? AND state = 'AVAILABLE'
       ORDER BY position ASC LIMIT ?`,
    )
    .all(batchId, limit) as Array<{ id: string; payload_json: string }>;

  const markLeased = database.prepare(`UPDATE tasks SET state = 'LEASED' WHERE id = ?`);
  const tasks: LabelTask[] = [];
  for (const row of rows) {
    markLeased.run(row.id);
    tasks.push(JSON.parse(row.payload_json) as LabelTask);
  }

  return { assignmentId, leaseExpiresAt, tasks };
}

export function storeAnnotations(events: AnnotationEvent[]): { inserted: number; duplicate: number } {
  const database = getDb();
  const insert = database.prepare(
    `INSERT OR IGNORE INTO annotations (id, task_id, batch_id, payload_json, created_at)
     VALUES (@id, @task_id, @batch_id, @payload_json, @created_at)`,
  );
  const completeTask = database.prepare(`UPDATE tasks SET state = 'COMPLETED' WHERE id = ?`);

  let inserted = 0;
  let duplicate = 0;

  const tx = database.transaction((items: AnnotationEvent[]) => {
    for (const event of items) {
      const batchRow = database
        .prepare(`SELECT batch_id FROM tasks WHERE id = ?`)
        .get(event.taskId) as { batch_id: string } | undefined;
      const batchId = batchRow?.batch_id ?? 'unknown';
      const result = insert.run({
        id: event.annotationId,
        task_id: event.taskId,
        batch_id: batchId,
        payload_json: JSON.stringify(event),
        created_at: event.createdAt,
      });
      if (result.changes > 0) {
        inserted += 1;
        completeTask.run(event.taskId);
      } else {
        duplicate += 1;
      }
    }
  });

  tx(events);
  return { inserted, duplicate };
}

export function listAnnotationsSince(since: string | null): AnnotationEvent[] {
  const database = getDb();
  const rows = since
    ? (database
        .prepare(
          `SELECT payload_json FROM annotations WHERE created_at > ? ORDER BY created_at ASC`,
        )
        .all(since) as Array<{ payload_json: string }>)
    : (database
        .prepare(`SELECT payload_json FROM annotations ORDER BY created_at ASC`)
        .all() as Array<{ payload_json: string }>);

  return rows.map((r) => JSON.parse(r.payload_json) as AnnotationEvent);
}

export function batchCount(): number {
  return (getDb().prepare(`SELECT COUNT(*) as c FROM batches`).get() as { c: number }).c;
}
