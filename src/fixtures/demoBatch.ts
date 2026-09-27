import * as Crypto from 'expo-crypto';

import type { LabelBatch, LabelMode, LabelTask, TaskConfig } from '@/types/labeling';

const DEMO_SEEDS = [
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
];

function previewUrl(seed: number): string {
  return `https://picsum.photos/seed/vexlum-${seed}/1800/1200`;
}

const PRESENTATION: TaskConfig['presentation'] = {
  show_scores: false,
  show_metadata: false,
  allow_zoom: true,
  allow_undo: true,
};

function createDemoBatch(
  mode: LabelMode,
  experimentId: string,
  question: string,
  choices: string[],
  taskCount: number,
): LabelBatch {
  const batchId = Crypto.randomUUID();
  const config: TaskConfig = { choices, presentation: PRESENTATION };

  const tasks: LabelTask[] = DEMO_SEEDS.slice(0, taskCount).map((seed, index) => {
    const imageId = `demo-image-${seed}`;
    return {
      id: Crypto.randomUUID(),
      batchId,
      mode,
      items: [
        {
          imageId,
          assets: {
            preview: previewUrl(seed),
            thumbnail: `https://picsum.photos/seed/vexlum-thumb-${seed}/512/340`,
          },
        },
      ],
      question,
      experimentId,
      schemaVersion: 1,
      config,
      context: {
        selectionReason: index % 3 === 0 ? 'random' : 'demo',
      },
    };
  });

  return {
    id: batchId,
    experimentId,
    mode,
    question,
    schemaVersion: 1,
    config,
    tasks,
  };
}

export function createDemoCullingBatch(taskCount = 12): LabelBatch {
  return createDemoBatch(
    'culling',
    'culling-demo-v1',
    'What should happen to this image?',
    ['PICK', 'KEEP', 'REJECT'],
    taskCount,
  );
}

export function createDemoBinaryBatch(taskCount = 12): LabelBatch {
  return createDemoBatch(
    'binary',
    'binary-quality-demo-v1',
    'Is this a good photograph?',
    ['GOOD', 'BAD'],
    taskCount,
  );
}

const DEMO_PAIRS: [number, number][] = [
  [101, 102],
  [103, 104],
  [105, 106],
  [107, 108],
  [109, 110],
  [111, 112],
  [113, 114],
  [115, 101],
];

export function createDemoPairwiseBatch(pairCount = 8): LabelBatch {
  const batchId = Crypto.randomUUID();
  const experimentId = 'pairwise-demo-v1';
  const question = 'Which image is better?';
  const config: TaskConfig = {
    choices: ['LEFT', 'RIGHT', 'EQUAL', 'CANNOT_JUDGE'],
    presentation: PRESENTATION,
  };

  const tasks: LabelTask[] = DEMO_PAIRS.slice(0, pairCount).map(([seedA, seedB], index) => ({
    id: Crypto.randomUUID(),
    batchId,
    mode: 'pairwise',
    items: [
      {
        imageId: `demo-image-${seedA}`,
        assets: { preview: previewUrl(seedA) },
      },
      {
        imageId: `demo-image-${seedB}`,
        assets: { preview: previewUrl(seedB) },
      },
    ],
    question,
    experimentId,
    schemaVersion: 1,
    config,
    context: {
      selectionReason: index % 2 === 0 ? 'close-scores' : 'demo',
    },
  }));

  return {
    id: batchId,
    experimentId,
    mode: 'pairwise',
    question,
    schemaVersion: 1,
    config,
    tasks,
  };
}
