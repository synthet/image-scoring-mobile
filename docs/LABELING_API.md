# Mobile labeling hub API (consumer notes)

This repository implements the **mobile client** for the Vexlum human-labeling subsystem. Canonical REST paths, OpenAPI, and database schema are owned by `image-scoring-backend` (`docs/technical/API_CONTRACT.md`, `docs/reference/api/openapi.yaml`).

Until those sources publish labeling endpoints, this app uses the provisional routes below (see `src/api/labelingHubClient.ts`).

## Provisional routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness check from Settings |
| `GET` | `/v1/batches` | List downloadable batches (`{ batches: LabelBatch[] }`) |
| `POST` | `/v1/batches/{batchId}/lease` | Lease up to `limit` tasks (`LeaseResponse`) |
| `POST` | `/v1/annotations` | Idempotent upload of `{ annotations: AnnotationEvent[] }` |

## Payload alignment

Types in `src/types/labeling.ts` mirror the architecture document:

- Generic `LabelTask` with `mode`, `items`, `config.choices`, and experiment metadata
- Immutable `AnnotationEvent` with provenance (`client`, `interaction`, `schemaVersion`)

When backend contracts change, update types here only after the canonical OpenAPI changes.
