export type LabelMode =
  | 'binary'
  | 'culling'
  | 'pairwise'
  | 'best_of_n'
  | 'rating'
  | 'attribute'
  | 'ranking';

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export type SyncState = 'pending' | 'synced' | 'failed';

export interface LabelAssets {
  preview: string;
  thumbnail?: string;
  large?: string;
  subject_crop?: string;
  eye_crop?: string;
}

export interface LabelItem {
  imageId: string;
  assets: LabelAssets;
  metadata?: Record<string, unknown>;
}

export interface TaskPresentation {
  show_scores?: boolean;
  show_metadata?: boolean;
  allow_zoom?: boolean;
  allow_undo?: boolean;
}

export interface TaskConfig {
  choices: string[];
  presentation?: TaskPresentation;
}

export interface LabelTask {
  id: string;
  batchId: string;
  mode: LabelMode;
  items: LabelItem[];
  question: string;
  experimentId: string;
  schemaVersion: number;
  context?: {
    clusterId?: string;
    stackId?: string;
    selectionReason?: string;
  };
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

export interface PairwiseAnswerContext {
  leftImageId: string;
  rightImageId: string;
  canonicalImageIds: [string, string];
  sidesSwapped: boolean;
  winnerImageId?: string;
}

export interface AnnotationAnswer {
  choice?: string;
  selectedImageId?: string;
  rating?: number;
  orderedImageIds?: string[];
  skipped?: boolean;
  cannotJudge?: boolean;
  /** Present for pairwise tasks — records on-screen layout at submit time. */
  pairwise?: PairwiseAnswerContext;
}

export interface AnnotationInteraction {
  durationMs: number;
  changedAnswer?: boolean;
  zoomUsed?: boolean;
  zoomCount?: number;
  undoUsed?: boolean;
}

export interface AnnotationEvent {
  annotationId: string;
  taskId: string;
  experimentId: string;
  schemaVersion: number;
  answer: AnnotationAnswer;
  client: {
    deviceId: string;
    appVersion: string;
  };
  interaction: AnnotationInteraction;
  createdAt: string;
}

export interface LeaseResponse {
  batchId: string;
  assignmentId: string;
  leaseExpiresAt: string;
  tasks: LabelTask[];
}
