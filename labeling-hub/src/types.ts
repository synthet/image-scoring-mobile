/** Mirrors mobile `src/types/labeling.ts` — canonical contract lives in image-scoring-backend. */

export type LabelMode =
  | 'binary'
  | 'culling'
  | 'pairwise'
  | 'best_of_n'
  | 'rating'
  | 'attribute'
  | 'ranking';

export interface LabelAssets {
  preview: string;
  thumbnail?: string;
}

export interface LabelItem {
  imageId: string;
  assets: LabelAssets;
}

export interface TaskConfig {
  choices: string[];
  presentation?: Record<string, unknown>;
}

export interface LabelTask {
  id: string;
  batchId: string;
  mode: LabelMode;
  items: LabelItem[];
  question: string;
  experimentId: string;
  schemaVersion: number;
  config: TaskConfig;
}

export interface LabelBatch {
  id: string;
  experimentId: string;
  mode: LabelMode;
  question: string;
  schemaVersion: number;
  config: TaskConfig;
  tasks: LabelTask[];
}

export interface AnnotationEvent {
  annotationId: string;
  taskId: string;
  experimentId: string;
  schemaVersion: number;
  answer: Record<string, unknown>;
  client: { deviceId: string; appVersion: string };
  interaction: Record<string, unknown>;
  createdAt: string;
}

export interface LeaseResponse {
  batchId: string;
  assignmentId: string;
  leaseExpiresAt: string;
  tasks: LabelTask[];
}
