import type { SQLiteDatabase } from 'expo-sqlite';

import { listTasksInBatch } from '@/db/repository';
import { loadSinglePreview } from '@/services/taskPreviews';

export type BurstLoupeFrame = {
  taskId: string;
  imageId: string;
  previewUri: string;
  burstIndex: number;
  isCurrent: boolean;
};

export async function loadBurstLoupeFrames(
  db: SQLiteDatabase,
  batchId: string,
  clusterId: string,
  currentTaskId: string,
): Promise<BurstLoupeFrame[]> {
  const tasks = await listTasksInBatch(db, batchId);
  const inCluster = tasks
    .filter((task) => task.context?.clusterId === clusterId)
    .sort(
      (a, b) => (a.context?.burstIndex ?? 0) - (b.context?.burstIndex ?? 0),
    );

  const frames: BurstLoupeFrame[] = [];
  for (const task of inCluster) {
    const previewUri = await loadSinglePreview(db, task);
    if (!previewUri) {
      continue;
    }
    frames.push({
      taskId: task.id,
      imageId: task.items[0]?.imageId ?? task.id,
      previewUri,
      burstIndex: task.context?.burstIndex ?? frames.length,
      isCurrent: task.id === currentTaskId,
    });
  }
  return frames;
}
