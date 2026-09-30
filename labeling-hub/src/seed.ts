import type { LabelBatch } from './types.js';
import { hasBatchWithExperiment, upsertBatch } from './db.js';

function previewUrl(seed: number): string {
  return `https://picsum.photos/seed/hub-${seed}/1800/1200`;
}

function cropUrl(seed: number): string {
  return `https://picsum.photos/seed/hub-crop-${seed}/900/900`;
}

const PRESENTATION = {
  show_scores: false,
  allow_zoom: true,
  allow_undo: true,
};

function hubCullingBatch(): LabelBatch {
  const batchId = crypto.randomUUID();
  const seeds = [201, 202, 203, 204, 205, 206];
  return {
    id: batchId,
    experimentId: 'hub-culling-seed-v1',
    mode: 'culling',
    question: 'What should happen to this image? (hub seed batch)',
    schemaVersion: 1,
    config: {
      choices: ['PICK', 'KEEP', 'REJECT'],
      presentation: PRESENTATION,
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
        presentation: PRESENTATION,
      },
    })),
  };
}

function hubCullingBurstBatch(): LabelBatch {
  const batchId = crypto.randomUUID();
  const experimentId = 'hub-culling-burst-seed-v1';
  const question = 'Grade this burst frame (hub seed)';
  const config = {
    choices: ['PICK', 'KEEP', 'REJECT'],
    presentation: PRESENTATION,
  };
  const seeds = [211, 212, 213, 214];
  const clusterId = 'hub-burst-cluster-1';

  return {
    id: batchId,
    experimentId,
    mode: 'culling',
    question,
    schemaVersion: 1,
    config,
    tasks: seeds.map((seed, index) => ({
      id: crypto.randomUUID(),
      batchId,
      mode: 'culling',
      items: [
        {
          imageId: `hub-burst-${seed}`,
          assets: { preview: previewUrl(seed) },
        },
      ],
      question,
      experimentId,
      schemaVersion: 1,
      config,
      context: {
        clusterId,
        burstIndex: index,
        burstSize: seeds.length,
      },
    })),
  };
}

function hubBoxQualityBatch(): LabelBatch {
  const batchId = crypto.randomUUID();
  const seeds = [301, 302, 303, 304];
  const experimentId = 'hub-box-quality-seed-v1';
  const question = 'Is the primary detection box acceptable? (hub seed)';
  const config = {
    choices: ['USABLE', 'POOR_CROP', 'WRONG_TARGET', 'UNSURE'],
    presentation: PRESENTATION,
  };
  return {
    id: batchId,
    experimentId,
    mode: 'box_quality',
    question,
    schemaVersion: 1,
    config,
    tasks: seeds.map((seed) => ({
      id: crypto.randomUUID(),
      batchId,
      mode: 'box_quality',
      items: [
        {
          imageId: `hub-box-${seed}`,
          assets: {
            preview: previewUrl(seed),
            subject_crop: cropUrl(seed),
          },
        },
      ],
      question,
      experimentId,
      schemaVersion: 1,
      config,
    })),
  };
}

function hubPresenceBatch(): LabelBatch {
  const batchId = crypto.randomUUID();
  const seeds = [401, 402, 403, 404, 405];
  const experimentId = 'hub-presence-seed-v1';
  const question = 'Is the subject present? (hub seed)';
  const config = {
    choices: ['PRESENT', 'ABSENT', 'UNSURE'],
    presentation: PRESENTATION,
  };
  return {
    id: batchId,
    experimentId,
    mode: 'presence',
    question,
    schemaVersion: 1,
    config,
    tasks: seeds.map((seed) => ({
      id: crypto.randomUUID(),
      batchId,
      mode: 'presence',
      items: [
        {
          imageId: `hub-presence-${seed}`,
          assets: { preview: previewUrl(seed) },
        },
      ],
      question,
      experimentId,
      schemaVersion: 1,
      config,
    })),
  };
}

function hubPairwiseCompareBatch(): LabelBatch {
  const batchId = crypto.randomUUID();
  const experimentId = 'hub-detector-compare-seed-v1';
  const question = 'Which detector crop is better? (hub seed)';
  const config = {
    choices: ['LEFT', 'RIGHT', 'EQUAL', 'NEITHER', 'CANNOT_JUDGE'],
    presentation: PRESENTATION,
  };
  const pairs: [number, number][] = [[501, 502], [503, 504]];
  return {
    id: batchId,
    experimentId,
    mode: 'pairwise',
    question,
    schemaVersion: 1,
    config,
    tasks: pairs.map(([seedA, seedB]) => ({
      id: crypto.randomUUID(),
      batchId,
      mode: 'pairwise',
      items: [
        {
          imageId: `hub-compare-a-${seedA}`,
          assets: { preview: previewUrl(seedA) },
        },
        {
          imageId: `hub-compare-b-${seedB}`,
          assets: { preview: previewUrl(seedB) },
        },
      ],
      question,
      experimentId,
      schemaVersion: 1,
      config,
      context: { compareVariant: 'model_compare' },
    })),
  };
}

const HUB_SEED_FACTORIES = [
  hubCullingBatch,
  hubCullingBurstBatch,
  hubBoxQualityBatch,
  hubPresenceBatch,
  hubPairwiseCompareBatch,
];

/** Upsert any demo batch whose `experimentId` is not already in the hub DB. */
export function seedDemoBatches(): LabelBatch | null {
  let firstInserted: LabelBatch | null = null;
  for (const create of HUB_SEED_FACTORIES) {
    const batch = create();
    if (hasBatchWithExperiment(batch.experimentId)) {
      continue;
    }
    upsertBatch(batch);
    if (!firstInserted) {
      firstInserted = batch;
    }
  }
  return firstInserted;
}
