import type { AnnotationEvent, LabelBatch, LeaseResponse } from '@/types/labeling';
import { getAccessToken, getApiBaseUrl } from '@/services/device';

export class LabelingHubError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'LabelingHubError';
  }
}

async function hubFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const baseUrl = await getApiBaseUrl();
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${baseUrl}${path}`, { ...init, headers });
}

/** Provisional mobile consumer contract — canonical definitions live in image-scoring-backend. */
export const LabelingHubRoutes = {
  listBatches: '/v1/batches',
  leaseBatch: (batchId: string) => `/v1/batches/${batchId}/lease`,
  uploadAnnotations: '/v1/annotations',
} as const;

export async function listRemoteBatches(): Promise<LabelBatch[]> {
  const res = await hubFetch(LabelingHubRoutes.listBatches);
  if (!res.ok) {
    throw new LabelingHubError(`Failed to list batches (${res.status})`, res.status);
  }
  const data = (await res.json()) as { batches: LabelBatch[] };
  return data.batches ?? [];
}

export async function leaseBatchTasks(
  batchId: string,
  limit = 100,
): Promise<LeaseResponse> {
  const res = await hubFetch(LabelingHubRoutes.leaseBatch(batchId), {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
  if (!res.ok) {
    throw new LabelingHubError(`Failed to lease batch (${res.status})`, res.status);
  }
  return (await res.json()) as LeaseResponse;
}

export async function uploadAnnotations(events: AnnotationEvent[]): Promise<void> {
  const res = await hubFetch(LabelingHubRoutes.uploadAnnotations, {
    method: 'POST',
    body: JSON.stringify({ annotations: events }),
  });
  if (!res.ok) {
    throw new LabelingHubError(`Failed to upload annotations (${res.status})`, res.status);
  }
}

export async function pingHub(): Promise<boolean> {
  try {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
