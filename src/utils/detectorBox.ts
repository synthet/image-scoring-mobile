import type { BoundingBox } from '@/types/labeling';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function boxFromRecord(value: Record<string, unknown>): BoundingBox | undefined {
  const x = value.x;
  const y = value.y;
  const width = value.width;
  const height = value.height;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height)) {
    return undefined;
  }
  if (width <= 0 || height <= 0) {
    return undefined;
  }
  const box: BoundingBox = { x, y, width, height };
  if (isFiniteNumber(value.confidence)) {
    box.confidence = value.confidence;
  }
  if (typeof value.label === 'string') {
    box.label = value.label;
  }
  return box;
}

/** Reads normalized (0–1) primary detector box from task item metadata. */
export function parsePrimaryDetectorBox(metadata?: Record<string, unknown>): BoundingBox | undefined {
  if (!metadata) {
    return undefined;
  }
  const raw = metadata.primaryBox ?? metadata.primary_box ?? metadata.detectorBox;
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  return boxFromRecord(raw as Record<string, unknown>);
}
