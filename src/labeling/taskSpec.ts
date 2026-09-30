import type { LabelChoiceTone } from '@/components/labeling/LabelChoiceButton';
import type { LabelMode, LabelTask, TaskConfig } from '@/types/labeling';

export type TaskLayout = 'single_image' | 'dual_image' | 'pairwise_images';

export type TaskCapability =
  | 'zoom'
  | 'swipe_choices'
  | 'draw_boxes'
  | 'burst_loupe'
  | 'burst_best'
  | 'detector_overlay'
  | 'pairwise_blind'
  | 'pairwise_model_compare';

export type SwipeDirection = 'left' | 'right' | 'up';

export interface ChoiceSpec {
  /** Stored in `annotation.answer.choice`. */
  id: string;
  label: string;
  tone?: LabelChoiceTone;
  swipe?: SwipeDirection;
}

export interface TaskInteractionSpec {
  layout: TaskLayout;
  choices?: ChoiceSpec[];
  capabilities?: TaskCapability[];
  /** Choice ids that require at least one normalized box before submit. */
  requireBoxesForChoiceIds?: string[];
  /** When user draws a valid box, auto-select this choice id. */
  promoteChoiceOnDraw?: string;
  secondaryAsset?: 'subject_crop' | 'eye_crop';
  pairwise?: {
    leftLabel?: string;
    rightLabel?: string;
    includeNeither?: boolean;
  };
}

export interface ResolvedTaskSpec {
  layout: TaskLayout;
  choices: ChoiceSpec[];
  capabilities: Set<TaskCapability>;
  requireBoxesForChoiceIds: Set<string>;
  promoteChoiceOnDraw?: string;
  secondaryAsset?: 'subject_crop' | 'eye_crop';
  pairwise?: TaskInteractionSpec['pairwise'];
}

const DEFAULT_CAPABILITIES: TaskCapability[] = ['zoom'];

function withCapabilities(
  spec: TaskInteractionSpec,
): ResolvedTaskSpec {
  return {
    layout: spec.layout,
    choices: spec.choices ?? [],
    capabilities: new Set([...DEFAULT_CAPABILITIES, ...(spec.capabilities ?? [])]),
    requireBoxesForChoiceIds: new Set(spec.requireBoxesForChoiceIds ?? []),
    promoteChoiceOnDraw: spec.promoteChoiceOnDraw,
    secondaryAsset: spec.secondaryAsset,
    pairwise: spec.pairwise,
  };
}

function legacySpecForMode(mode: LabelMode, config: TaskConfig): ResolvedTaskSpec {
  const choicesFromConfig = config.choices.map((id) => ({
    id,
    label: formatChoiceLabel(id),
    tone: toneForChoiceId(id),
    swipe: swipeForChoiceId(id),
  }));

  switch (mode) {
    case 'binary':
      return withCapabilities({
        layout: 'single_image',
        choices: choicesFromConfig.length
          ? choicesFromConfig
          : [
              { id: 'BAD', label: 'Bad', tone: 'bad', swipe: 'left' },
              { id: 'GOOD', label: 'Good', tone: 'good', swipe: 'right' },
            ],
        capabilities: ['zoom', 'swipe_choices'],
      });
    case 'presence':
      return withCapabilities({
        layout: 'single_image',
        choices: choicesFromConfig.length
          ? choicesFromConfig
          : [
              { id: 'PRESENT', label: 'Present', tone: 'good', swipe: 'right' },
              { id: 'ABSENT', label: 'Absent', tone: 'bad', swipe: 'left' },
              { id: 'UNSURE', label: 'Unsure', tone: 'warning', swipe: 'up' },
            ],
        capabilities: ['zoom', 'swipe_choices'],
      });
    case 'culling':
      return withCapabilities({
        layout: 'single_image',
        choices: choicesFromConfig.length
          ? choicesFromConfig
          : [
              { id: 'REJECT', label: 'Reject', tone: 'reject', swipe: 'left' },
              { id: 'KEEP', label: 'Keep', tone: 'keep', swipe: 'right' },
              { id: 'PICK', label: 'Pick', tone: 'pick', swipe: 'up' },
            ],
        capabilities: ['zoom', 'swipe_choices', 'burst_loupe', 'burst_best'],
      });
    case 'box_quality':
      return withCapabilities({
        layout: 'dual_image',
        secondaryAsset: 'subject_crop',
        choices: choicesFromConfig.length
          ? choicesFromConfig
          : [
              { id: 'USABLE', label: 'Usable', tone: 'good' },
              { id: 'POOR_CROP', label: 'Poor crop', tone: 'crop' },
              { id: 'WRONG_TARGET', label: 'Wrong target', tone: 'bad' },
              { id: 'UNSURE', label: 'Unsure', tone: 'neutral' },
            ],
        capabilities: ['zoom', 'detector_overlay'],
      });
    case 'box_draw':
      return withCapabilities({
        layout: 'single_image',
        choices: choicesFromConfig.length
          ? choicesFromConfig
          : [
              { id: 'POSITIVE', label: 'Present', tone: 'good' },
              { id: 'NEGATIVE', label: 'Absent', tone: 'bad' },
              { id: 'UNKNOWN', label: 'Unsure', tone: 'warning' },
            ],
        capabilities: ['zoom', 'draw_boxes'],
        requireBoxesForChoiceIds: ['POSITIVE', 'BIRD'],
        promoteChoiceOnDraw: 'POSITIVE',
      });
    case 'pairwise':
      return withCapabilities({
        layout: 'pairwise_images',
        choices: choicesFromConfig,
        capabilities: ['zoom', 'pairwise_blind'],
        pairwise: {
          leftLabel: 'Left',
          rightLabel: 'Right',
          includeNeither: config.choices.includes('NEITHER'),
        },
      });
    default:
      return withCapabilities({
        layout: 'single_image',
        choices: choicesFromConfig,
      });
  }
}

/** Task UI is driven by `config.interaction` when set; otherwise inferred from `mode`. */
export function resolveTaskSpec(task: LabelTask): ResolvedTaskSpec {
  if (task.config.interaction) {
    return withCapabilities(task.config.interaction);
  }
  return legacySpecForMode(task.mode, task.config);
}

export function parsePriorChoice(
  metadata?: Record<string, unknown>,
  choices?: ChoiceSpec[],
): string | undefined {
  const raw = metadata?.priorChoice ?? metadata?.prior ?? metadata?.priorClass;
  if (typeof raw !== 'string') {
    return undefined;
  }
  if (choices?.some((c) => c.id === raw)) {
    return raw;
  }
  const aliases: Record<string, string> = {
    bird: 'POSITIVE',
    no_bird: 'NEGATIVE',
    unsure: 'UNKNOWN',
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
  };
  const mapped = aliases[raw] ?? raw;
  if (choices?.some((c) => c.id === mapped)) {
    return mapped;
  }
  return mapped;
}

function formatChoiceLabel(id: string): string {
  return id
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toneForChoiceId(id: string): LabelChoiceTone | undefined {
  const map: Record<string, LabelChoiceTone> = {
    GOOD: 'good',
    PRESENT: 'good',
    POSITIVE: 'good',
    BIRD: 'good',
    PICK: 'pick',
    KEEP: 'keep',
    BAD: 'bad',
    ABSENT: 'bad',
    NEGATIVE: 'bad',
    NO_BIRD: 'bad',
    REJECT: 'reject',
    UNSURE: 'warning',
    UNKNOWN: 'warning',
    CANNOT_JUDGE: 'neutral',
    EQUAL: 'neutral',
    NEITHER: 'bad',
  };
  return map[id];
}

function swipeForChoiceId(id: string): SwipeDirection | undefined {
  const map: Record<string, SwipeDirection> = {
    GOOD: 'right',
    PRESENT: 'right',
    POSITIVE: 'right',
    KEEP: 'right',
    BAD: 'left',
    ABSENT: 'left',
    NEGATIVE: 'left',
    REJECT: 'left',
    UNSURE: 'up',
    UNKNOWN: 'up',
    PICK: 'up',
  };
  return map[id];
}
