/** Normalized axis-aligned rectangle `[x1, y1, x2, y2]` in 0–1 image coordinates. */
export type NormalizedRect = [number, number, number, number];

export const MIN_NORMALIZED_BOX_SIZE = 0.003;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function pointInOverlay(
  x: number,
  y: number,
  width: number,
  height: number,
): [number, number] {
  if (width <= 0 || height <= 0) {
    return [0, 0];
  }
  return [clamp01(x / width), clamp01(y / height)];
}

export function rectFromPoints(a: [number, number], b: [number, number]): NormalizedRect {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}

export function isValidNormalizedRect(rect: NormalizedRect): boolean {
  return rect[2] - rect[0] >= MIN_NORMALIZED_BOX_SIZE && rect[3] - rect[1] >= MIN_NORMALIZED_BOX_SIZE;
}

export function roundNormalizedRect(rect: NormalizedRect): NormalizedRect {
  return rect.map((v) => +v.toFixed(6)) as NormalizedRect;
}
