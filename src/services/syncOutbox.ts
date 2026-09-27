import type { SQLiteDatabase } from 'expo-sqlite';

import { uploadAnnotations } from '@/api/labelingHubClient';
import {
  listPendingOutbox,
  markOutboxFailed,
  markOutboxSynced,
} from '@/db/repository';
import type { AnnotationEvent } from '@/types/labeling';

export async function flushAnnotationOutbox(db: SQLiteDatabase): Promise<number> {
  const pending = await listPendingOutbox(db);
  if (pending.length === 0) {
    return 0;
  }

  let synced = 0;
  const batch: AnnotationEvent[] = [];
  const batchIds: string[] = [];

  for (const item of pending) {
    if (item.attempts >= 8) {
      continue;
    }
    batch.push(JSON.parse(item.payloadJson) as AnnotationEvent);
    batchIds.push(item.id);
  }

  if (batch.length === 0) {
    return 0;
  }

  try {
    await uploadAnnotations(batch);
    for (const id of batchIds) {
      await markOutboxSynced(db, id);
      synced += 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    for (const id of batchIds) {
      await markOutboxFailed(db, id, message);
    }
  }

  return synced;
}
