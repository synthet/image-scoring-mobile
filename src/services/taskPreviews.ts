import type { SQLiteDatabase } from 'expo-sqlite';

import { resolvePreviewUri } from '@/services/assetCache';
import type { LabelTask } from '@/types/labeling';
import {
  buildPairwisePresentation,
  shouldSwapPairwiseSides,
  type PairwisePresentation,
} from '@/utils/pairwisePresentation';

async function resolveAssetUri(db: SQLiteDatabase, remote: string): Promise<string> {
  try {
    return await resolvePreviewUri(db, remote);
  } catch {
    return remote;
  }
}

export async function loadSinglePreview(
  db: SQLiteDatabase,
  task: LabelTask,
): Promise<string | null> {
  const remote = task.items[0]?.assets.preview;
  if (!remote) {
    return null;
  }
  return resolveAssetUri(db, remote);
}

export async function loadPairwisePresentation(
  db: SQLiteDatabase,
  task: LabelTask,
): Promise<PairwisePresentation | null> {
  if (task.items.length < 2) {
    return null;
  }
  const items = task.items.slice(0, 2) as [typeof task.items[0], typeof task.items[1]];
  const sidesSwapped = await shouldSwapPairwiseSides(task.id);
  const leftRemote = (sidesSwapped ? items[1] : items[0]).assets.preview;
  const rightRemote = (sidesSwapped ? items[0] : items[1]).assets.preview;
  const [leftUri, rightUri] = await Promise.all([
    resolveAssetUri(db, leftRemote),
    resolveAssetUri(db, rightRemote),
  ]);
  return buildPairwisePresentation(items, leftUri, rightUri, sidesSwapped);
}
