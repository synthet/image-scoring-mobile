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
  const batch = createDemoBatch(
    'culling',
    'culling-demo-v1',
    'What should happen to this image?',
    ['PICK', 'KEEP', 'REJECT'],
    taskCount,
  );
  batch.tasks = batch.tasks.map((task, index) => {
    const inBurstDemo = index < 8;
    return {
      ...task,
      context: {
        ...task.context,
        ...(inBurstDemo
          ? {
              clusterId: `burst-demo-${Math.floor(index / 4)}`,
              burstIndex: index % 4,
              burstSize: 4,
            }
          : {}),
      },
    };
  });
  return batch;
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

export function createDemoBoxQualityBatch(taskCount = 10): LabelBatch {
  const batchId = Crypto.randomUUID();
  const experimentId = 'box-quality-demo-v1';
  const question = 'Is the primary detection box acceptable?';
  const config: TaskConfig = {
    choices: ['USABLE', 'POOR_CROP', 'WRONG_TARGET', 'UNSURE'],
    presentation: PRESENTATION,
  };

  const tasks: LabelTask[] = DEMO_SEEDS.slice(0, taskCount).map((seed, index) => ({
    id: Crypto.randomUUID(),
    batchId,
    mode: 'box_quality',
    items: [
      {
        imageId: `demo-image-${seed}`,
        assets: {
          preview: previewUrl(seed),
          subject_crop: `https://picsum.photos/seed/vexlum-crop-${seed}/900/900`,
        },
        metadata: {
          primaryBox: {
            x: 0.22 + (index % 3) * 0.05,
            y: 0.18 + (index % 2) * 0.08,
            width: 0.38,
            height: 0.42,
          },
        },
      },
    ],
    question,
    experimentId,
    schemaVersion: 1,
    config,
    context: {
      selectionReason: index % 2 === 0 ? 'detector-qa' : 'demo',
    },
  }));

  return {
    id: batchId,
    experimentId,
    mode: 'box_quality',
    question,
    schemaVersion: 1,
    config,
    tasks,
  };
}

const BOX_DRAW_PRIORS = ['UNKNOWN', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'UNKNOWN', 'POSITIVE', 'POSITIVE', 'UNKNOWN'];

export function createDemoBoxDrawBatch(taskCount = 8): LabelBatch {
  const batchId = Crypto.randomUUID();
  const experimentId = 'box-draw-demo-v1';
  const question = 'Draw regions for the target class, or pick a classification';
  const config: TaskConfig = {
    choices: ['POSITIVE', 'NEGATIVE', 'UNKNOWN'],
    presentation: PRESENTATION,
  };

  const tasks: LabelTask[] = DEMO_SEEDS.slice(0, taskCount).map((seed, index) => {
    const prior = BOX_DRAW_PRIORS[index % BOX_DRAW_PRIORS.length];
    return {
      id: Crypto.randomUUID(),
      batchId,
      mode: 'box_draw',
      items: [
        {
          imageId: `demo-geometry-${seed}`,
          assets: {
            preview: `https://picsum.photos/seed/vexlum-geometry-${seed}/1280/960`,
          },
          metadata: { priorChoice: prior },
        },
      ],
      question,
      experimentId,
      schemaVersion: 1,
      config,
    };
  });

  return {
    id: batchId,
    experimentId,
    mode: 'box_draw',
    question,
    schemaVersion: 1,
    config,
    tasks,
  };
}

export function createDemoPresenceBatch(taskCount = 12): LabelBatch {
  return createDemoBatch(
    'presence',
    'presence-demo-v1',
    'Is the subject present in this image?',
    ['PRESENT', 'ABSENT', 'UNSURE'],
    taskCount,
  );
}

export function createDemoModelCompareBatch(pairCount = 8): LabelBatch {
  const batchId = Crypto.randomUUID();
  const experimentId = 'detector-compare-demo-v1';
  const question = 'Which detector crop is better on this photo?';
  const config: TaskConfig = {
    choices: ['LEFT', 'RIGHT', 'EQUAL', 'NEITHER', 'CANNOT_JUDGE'],
    presentation: PRESENTATION,
  };

  const tasks: LabelTask[] = DEMO_PAIRS.slice(0, pairCount).map(([seedA, seedB], index) => ({
    id: Crypto.randomUUID(),
    batchId,
    mode: 'pairwise',
    items: [
      {
        imageId: `demo-image-${seedA}-model-a`,
        assets: {
          preview: `https://picsum.photos/seed/vexlum-a-${seedA}/1200/900`,
        },
      },
      {
        imageId: `demo-image-${seedB}-model-b`,
        assets: {
          preview: `https://picsum.photos/seed/vexlum-b-${seedB}/1200/900`,
        },
      },
    ],
    question,
    experimentId,
    schemaVersion: 1,
    config,
    context: {
      compareVariant: 'model_compare',
      selectionReason: index % 2 === 0 ? 'v0-vs-v1' : 'demo',
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
