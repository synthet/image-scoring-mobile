import * as Crypto from 'expo-crypto';

import type { AnnotationAnswer, LabelItem } from '@/types/labeling';

export type PairwiseSideSlot = {
  imageId: string;
  previewUri: string;
};

export type PairwisePresentation = {
  left: PairwiseSideSlot;
  right: PairwiseSideSlot;
  sidesSwapped: boolean;
  canonicalImageIds: [string, string];
};

/** Deterministic left/right swap from task id (stable across reloads for the same task). */
export async function shouldSwapPairwiseSides(taskId: string): Promise<boolean> {
  const hex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, taskId);
  return parseInt(hex.slice(0, 2), 16) % 2 === 1;
}

export function buildPairwisePresentation(
  items: [LabelItem, LabelItem],
  leftUri: string,
  rightUri: string,
  sidesSwapped: boolean,
): PairwisePresentation {
  const canonicalImageIds: [string, string] = [items[0].imageId, items[1].imageId];
  const leftItem = sidesSwapped ? items[1] : items[0];
  const rightItem = sidesSwapped ? items[0] : items[1];
  return {
    left: { imageId: leftItem.imageId, previewUri: leftUri },
    right: { imageId: rightItem.imageId, previewUri: rightUri },
    sidesSwapped,
    canonicalImageIds,
  };
}

export type PairwiseDecision = 'LEFT' | 'RIGHT' | 'EQUAL' | 'CANNOT_JUDGE';

export function pairwiseAnswerFromDecision(
  decision: PairwiseDecision,
  presentation: PairwisePresentation,
): AnnotationAnswer {
  if (decision === 'CANNOT_JUDGE') {
    return {
      choice: 'CANNOT_JUDGE',
      cannotJudge: true,
      pairwise: {
        leftImageId: presentation.left.imageId,
        rightImageId: presentation.right.imageId,
        canonicalImageIds: presentation.canonicalImageIds,
        sidesSwapped: presentation.sidesSwapped,
      },
    };
  }
  if (decision === 'EQUAL') {
    return {
      choice: 'EQUAL',
      pairwise: {
        leftImageId: presentation.left.imageId,
        rightImageId: presentation.right.imageId,
        canonicalImageIds: presentation.canonicalImageIds,
        sidesSwapped: presentation.sidesSwapped,
      },
    };
  }
  const winnerImageId =
    decision === 'LEFT' ? presentation.left.imageId : presentation.right.imageId;
  return {
    choice: decision,
    selectedImageId: winnerImageId,
    pairwise: {
      leftImageId: presentation.left.imageId,
      rightImageId: presentation.right.imageId,
      canonicalImageIds: presentation.canonicalImageIds,
      sidesSwapped: presentation.sidesSwapped,
      winnerImageId,
    },
  };
}
