import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  AnnotationEvent,
  LabelBatch,
  LabelTask,
  SyncState,
  TaskStatus,
} from '@/types/labeling';

export interface BatchSummary {
  id: string;
  experimentId: string;
  mode: string;
  question: string;
  totalTasks: number;
  completedTasks: number;
  leaseExpiresAt: string | null;
  updatedAt: string;
}

export async function upsertBatch(
  db: SQLiteDatabase,
  batch: LabelBatch,
  meta?: { assignmentId?: string; leaseExpiresAt?: string },
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO batches (
      id, experiment_id, mode, question, schema_version, config_json,
      assignment_id, lease_expires_at, total_tasks, completed_tasks, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      experiment_id = excluded.experiment_id,
      mode = excluded.mode,
      question = excluded.question,
      schema_version = excluded.schema_version,
      config_json = excluded.config_json,
      assignment_id = COALESCE(excluded.assignment_id, batches.assignment_id),
      lease_expires_at = COALESCE(excluded.lease_expires_at, batches.lease_expires_at),
      total_tasks = excluded.total_tasks,
      updated_at = excluded.updated_at`,
    [
      batch.id,
      batch.experimentId,
      batch.mode,
      batch.question,
      batch.schemaVersion,
      JSON.stringify(batch.config),
      meta?.assignmentId ?? null,
      meta?.leaseExpiresAt ?? null,
      batch.tasks.length,
      0,
      now,
      now,
    ],
  );

  for (let i = 0; i < batch.tasks.length; i++) {
    const task = batch.tasks[i];
    await db.runAsync(
      `INSERT INTO tasks (id, batch_id, payload_json, status, position)
       VALUES (?, ?, ?, 'pending', ?)
       ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json`,
      [task.id, batch.id, JSON.stringify(task), i],
    );
  }
}

export async function listBatches(db: SQLiteDatabase): Promise<BatchSummary[]> {
  const rows = await db.getAllAsync<{
    id: string;
    experiment_id: string;
    mode: string;
    question: string;
    total_tasks: number;
    completed_tasks: number;
    lease_expires_at: string | null;
    updated_at: string;
  }>(
    `SELECT id, experiment_id, mode, question, total_tasks, completed_tasks, lease_expires_at, updated_at
     FROM batches ORDER BY updated_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    experimentId: r.experiment_id,
    mode: r.mode,
    question: r.question,
    totalTasks: r.total_tasks,
    completedTasks: r.completed_tasks,
    leaseExpiresAt: r.lease_expires_at,
    updatedAt: r.updated_at,
  }));
}

export async function listTasksInBatch(
  db: SQLiteDatabase,
  batchId: string,
): Promise<LabelTask[]> {
  const rows = await db.getAllAsync<{ payload_json: string }>(
    `SELECT payload_json FROM tasks WHERE batch_id = ? ORDER BY position ASC`,
    [batchId],
  );
  return rows.map((row) => JSON.parse(row.payload_json) as LabelTask);
}

export async function getNextPendingTask(
  db: SQLiteDatabase,
  batchId: string,
): Promise<LabelTask | null> {
  const row = await db.getFirstAsync<{ payload_json: string }>(
    `SELECT payload_json FROM tasks
     WHERE batch_id = ? AND status = 'pending'
     ORDER BY position ASC LIMIT 1`,
    [batchId],
  );
  if (!row) {
    return null;
  }
  return JSON.parse(row.payload_json) as LabelTask;
}

export async function countPendingTasks(
  db: SQLiteDatabase,
  batchId: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM tasks WHERE batch_id = ? AND status = 'pending'`,
    [batchId],
  );
  return row?.count ?? 0;
}

export async function getBatchProgress(
  db: SQLiteDatabase,
  batchId: string,
): Promise<{ total: number; completed: number }> {
  const row = await db.getFirstAsync<{ total_tasks: number; completed_tasks: number }>(
    'SELECT total_tasks, completed_tasks FROM batches WHERE id = ?',
    [batchId],
  );
  return {
    total: row?.total_tasks ?? 0,
    completed: row?.completed_tasks ?? 0,
  };
}

export async function markTaskStatus(
  db: SQLiteDatabase,
  taskId: string,
  batchId: string,
  status: TaskStatus,
): Promise<void> {
  await db.runAsync('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
  if (status === 'completed' || status === 'skipped') {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks WHERE batch_id = ? AND status != 'pending'`,
      [batchId],
    );
    const completed = row?.count ?? 0;
    await db.runAsync(
      'UPDATE batches SET completed_tasks = ?, updated_at = ? WHERE id = ?',
      [completed, new Date().toISOString(), batchId],
    );
  }
}

export async function saveAnnotation(
  db: SQLiteDatabase,
  event: AnnotationEvent,
  batchId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO annotations (id, task_id, batch_id, payload_json, sync_state, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [event.annotationId, event.taskId, batchId, JSON.stringify(event), event.createdAt],
  );
  await db.runAsync(
    `INSERT INTO sync_outbox (id, kind, payload_json, sync_state, created_at)
     VALUES (?, 'annotation', ?, 'pending', ?)`,
    [event.annotationId, JSON.stringify(event), event.createdAt],
  );
}

export async function undoLastAnnotation(
  db: SQLiteDatabase,
  batchId: string,
): Promise<LabelTask | null> {
  const last = await db.getFirstAsync<{ id: string; task_id: string; payload_json: string }>(
    `SELECT a.id, a.task_id, t.payload_json
     FROM annotations a
     JOIN tasks t ON t.id = a.task_id
     WHERE a.batch_id = ?
     ORDER BY a.created_at DESC LIMIT 1`,
    [batchId],
  );
  if (!last) {
    return null;
  }

  await db.runAsync('DELETE FROM annotations WHERE id = ?', [last.id]);
  await db.runAsync('DELETE FROM sync_outbox WHERE id = ?', [last.id]);
  await db.runAsync("UPDATE tasks SET status = 'pending' WHERE id = ?", [last.task_id]);

  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM tasks WHERE batch_id = ? AND status != 'pending'`,
    [batchId],
  );
  await db.runAsync(
    'UPDATE batches SET completed_tasks = ?, updated_at = ? WHERE id = ?',
    [row?.count ?? 0, new Date().toISOString(), batchId],
  );

  return JSON.parse(last.payload_json) as LabelTask;
}

export async function listPendingOutbox(
  db: SQLiteDatabase,
  limit = 50,
): Promise<{ id: string; payloadJson: string; attempts: number }[]> {
  const rows = await db.getAllAsync<{ id: string; payload_json: string; attempts: number }>(
    `SELECT id, payload_json, attempts FROM sync_outbox
     WHERE sync_state = 'pending' OR sync_state = 'failed'
     ORDER BY created_at ASC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    payloadJson: r.payload_json,
    attempts: r.attempts,
  }));
}

export async function markOutboxSynced(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("UPDATE sync_outbox SET sync_state = 'synced' WHERE id = ?", [id]);
  await db.runAsync("UPDATE annotations SET sync_state = 'synced' WHERE id = ?", [id]);
}

export async function markOutboxFailed(
  db: SQLiteDatabase,
  id: string,
  error: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE sync_outbox SET sync_state = 'failed', attempts = attempts + 1, last_error = ? WHERE id = ?`,
    [error, id],
  );
}

export async function countPendingSync(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_outbox WHERE sync_state IN ('pending', 'failed')`,
  );
  return row?.count ?? 0;
}

export async function upsertCachedAsset(
  db: SQLiteDatabase,
  contentHash: string,
  localUri: string,
  remoteUrl: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO cached_assets (content_hash, local_uri, remote_url, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(content_hash) DO UPDATE SET local_uri = excluded.local_uri, updated_at = excluded.updated_at`,
    [contentHash, localUri, remoteUrl, new Date().toISOString()],
  );
}

export async function getCachedAssetUri(
  db: SQLiteDatabase,
  contentHash: string,
): Promise<string | null> {
  const row = await db.getFirstAsync<{ local_uri: string }>(
    'SELECT local_uri FROM cached_assets WHERE content_hash = ?',
    [contentHash],
  );
  return row?.local_uri ?? null;
}

export async function getBatchQuestion(
  db: SQLiteDatabase,
  batchId: string,
): Promise<string | null> {
  const row = await db.getFirstAsync<{ question: string }>(
    'SELECT question FROM batches WHERE id = ?',
    [batchId],
  );
  return row?.question ?? null;
}

export async function getBatchConfig(
  db: SQLiteDatabase,
  batchId: string,
): Promise<{ allowUndo: boolean; allowZoom: boolean }> {
  const row = await db.getFirstAsync<{ config_json: string }>(
    'SELECT config_json FROM batches WHERE id = ?',
    [batchId],
  );
  if (!row) {
    return { allowUndo: true, allowZoom: true };
  }
  const config = JSON.parse(row.config_json) as LabelBatch['config'];
  return {
    allowUndo: config.presentation?.allow_undo ?? true,
    allowZoom: config.presentation?.allow_zoom ?? true,
  };
}

export type { SyncState };
