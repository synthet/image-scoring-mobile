import * as Crypto from 'expo-crypto';

import type { LabelBatch, LabelTask } from '@/types/labeling';

const DEMO_SEEDS = [
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
];

function previewUrl(seed: number): string {
  return `https://picsum.photos/seed/vexlum-${seed}/1800/1200`;
}

export async function createDemoCullingBatch(taskCount = 12): Promise<LabelBatch> {
  const batchId = Crypto.randomUUID();
  const experimentId = 'culling-demo-v1';

  const tasks: LabelTask[] = DEMO_SEEDS.slice(0, taskCount).map((seed, index) => {
    const imageId = `demo-image-${seed}`;
    return {
      id: Crypto.randomUUID(),
      batchId,
      mode: 'culling',
      items: [
        {
          imageId,
          assets: {
            preview: previewUrl(seed),
            thumbnail: `https://picsum.photos/seed/vexlum-thumb-${seed}/512/340`,
          },
        },
      ],
      question: 'What should happen to this image?',
      experimentId,
      schemaVersion: 1,
      config: {
        choices: ['PICK', 'KEEP', 'REJECT'],
        presentation: {
          show_scores: false,
          show_metadata: false,
          allow_zoom: true,
          allow_undo: true,
        },
      },
      context: {
        selectionReason: index % 3 === 0 ? 'random' : 'demo',
      },
    };
  });

  return {
    id: batchId,
    experimentId,
    mode: 'culling',
    question: 'What should happen to this image?',
    schemaVersion: 1,
    config: {
      choices: ['PICK', 'KEEP', 'REJECT'],
      presentation: {
        show_scores: false,
        show_metadata: false,
        allow_zoom: true,
        allow_undo: true,
      },
    },
    tasks,
  };
}
