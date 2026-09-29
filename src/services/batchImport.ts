import type { SQLiteDatabase } from 'expo-sqlite';

import type { LabelBatch, LeaseResponse } from '@/types/labeling';
import { upsertBatch } from '@/db/repository';
import { resolvePreviewUri } from '@/services/assetCache';

export async function importBatchLocally(
  db: SQLiteDatabase,
  batch: LabelBatch,
  meta?: Pick<LeaseResponse, 'assignmentId' | 'leaseExpiresAt'>,
): Promise<void> {
  await upsertBatch(db, batch, {
    assignmentId: meta?.assignmentId,
    leaseExpiresAt: meta?.leaseExpiresAt,
  });
}

/** Download remote preview URLs into the on-device cache (best-effort). */
export async function warmBatchAssetCache(
  db: SQLiteDatabase,
  batch: LabelBatch,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const urls = batch.tasks.flatMap((t) =>
    t.items.flatMap((item) =>
      [
        item.assets.preview,
        item.assets.thumbnail,
        item.assets.subject_crop,
        item.assets.eye_crop,
      ].filter(Boolean) as string[],
    ),
  );
  const unique = [...new Set(urls)];
  let done = 0;
  for (const url of unique) {
    try {
      await resolvePreviewUri(db, url);
    } catch {
      // Offline or unreachable hub — labeling can still use remote URLs.
    }
    done += 1;
    onProgress?.(done, unique.length);
  }
}
