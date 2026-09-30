export const LABEL_SWIPE_THRESHOLD = 56;

export function resolveLabelSwipe(
  translationX: number,
  translationY: number,
): 'left' | 'right' | 'up' | null {
  if (Math.abs(translationX) > Math.abs(translationY)) {
    if (translationX > LABEL_SWIPE_THRESHOLD) {
      return 'right';
    }
    if (translationX < -LABEL_SWIPE_THRESHOLD) {
      return 'left';
    }
    return null;
  }
  if (translationY < -LABEL_SWIPE_THRESHOLD) {
    return 'up';
  }
  return null;
}
