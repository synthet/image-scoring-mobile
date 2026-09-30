import type { TaskInteractionSpec } from '@/labeling/taskSpec';

export type LabelMode =
  | 'binary'
  | 'presence'
  | 'box_quality'
  | 'box_draw'
  | 'culling'
  | 'pairwise'
  | 'best_of_n'
  | 'rating'
  | 'attribute'
  | 'ranking';

export type BoxQualityChoice = 'USABLE' | 'POOR_CROP' | 'WRONG_TARGET' | 'UNSURE';

export type PresenceChoice = 'PRESENT' | 'ABSENT' | 'UNSURE';

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export type SyncState = 'pending' | 'synced' | 'failed';

export interface LabelAssets {
  preview: string;
  thumbnail?: string;
  large?: string;
  subject_crop?: string;
  eye_crop?: string;
}

/** Normalized (0–1) box coordinates relative to the preview image. */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  label?: string;
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
  /** When set, drives layout and capabilities instead of hard-coded `mode` behavior. */
  interaction?: TaskInteractionSpec;
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
    burstIndex?: number;
    burstSize?: number;
    selectionReason?: string;
    compareVariant?: 'model_compare';
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
  /** Burst culling: reviewer marked this frame as best-in-burst. */
  isBest?: boolean;
  /** Region geometry + class choice (multi-box annotation tasks). */
  geometry?: {
    boxes: [number, number, number, number][];
    choiceId: string;
    priorChoice?: string;
    imageId: string;
  };
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
