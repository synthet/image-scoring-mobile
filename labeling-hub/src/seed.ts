import type { LabelBatch } from './types.js';
import { batchCount, upsertBatch } from './db.js';

function previewUrl(seed: number): string {
  return `https://picsum.photos/seed/hub-${seed}/1800/1200`;
}

export function seedDemoBatchIfEmpty(): LabelBatch | null {
  if (batchCount() > 0) {
    return null;
  }

  const batchId = crypto.randomUUID();
  const seeds = [201, 202, 203, 204, 205, 206];
  const batch: LabelBatch = {
    id: batchId,
    experimentId: 'hub-culling-seed-v1',
    mode: 'culling',
    question: 'What should happen to this image? (hub seed batch)',
    schemaVersion: 1,
    config: {
      choices: ['PICK', 'KEEP', 'REJECT'],
      presentation: {
        show_scores: false,
        allow_zoom: true,
        allow_undo: true,
      },
    },
    tasks: seeds.map((seed) => ({
      id: crypto.randomUUID(),
      batchId,
      mode: 'culling',
      items: [
        {
          imageId: `hub-image-${seed}`,
          assets: { preview: previewUrl(seed) },
        },
      ],
      question: 'What should happen to this image? (hub seed batch)',
      experimentId: 'hub-culling-seed-v1',
      schemaVersion: 1,
      config: {
        choices: ['PICK', 'KEEP', 'REJECT'],
        presentation: { allow_zoom: true, allow_undo: true },
      },
    })),
  };

  upsertBatch(batch);
  return batch;
}
