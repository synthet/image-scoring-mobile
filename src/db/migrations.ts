import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM schema_meta WHERE key = ?',
    ['schema_version'],
  );
  const current = row ? Number(row.value) : 0;
  if (current >= SCHEMA_VERSION) {
    return;
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY NOT NULL,
      experiment_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      question TEXT NOT NULL,
      schema_version INTEGER NOT NULL,
      config_json TEXT NOT NULL,
      assignment_id TEXT,
      lease_expires_at TEXT,
      total_tasks INTEGER NOT NULL DEFAULT 0,
      completed_tasks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      batch_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      position INTEGER NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_batch_status ON tasks(batch_id, status, position);

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE INDEX IF NOT EXISTS idx_annotations_sync ON annotations(sync_state, created_at);

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_assets (
      content_hash TEXT PRIMARY KEY NOT NULL,
      local_uri TEXT NOT NULL,
      remote_url TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  await db.runAsync(
    'INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)',
    ['schema_version', String(SCHEMA_VERSION)],
  );
}
