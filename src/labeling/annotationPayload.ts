import type { AnnotationAnswer } from '@/types/labeling';
import type { NormalizedRect } from '@/utils/normalizedRect';

export type GeometrySubmitPayload = {
  choiceId: string;
  boxes: NormalizedRect[];
  priorChoice?: string;
  imageId: string;
};

export function buildChoiceAnswer(choiceId: string, extras?: { isBest?: boolean }): AnnotationAnswer {
  return {
    choice: choiceId,
    ...(extras?.isBest ? { isBest: true } : {}),
  };
}

export function buildGeometryAnswer(payload: GeometrySubmitPayload): AnnotationAnswer {
  return {
    choice: payload.choiceId,
    geometry: {
      boxes: payload.boxes,
      choiceId: payload.choiceId,
      priorChoice: payload.priorChoice,
      imageId: payload.imageId,
    },
  };
}
