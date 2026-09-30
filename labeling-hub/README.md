# image-scoring-labeling-hub (dev / MVP)

Minimal **Hetzner-style labeling broker** for local development and early integration. It stores batch manifests and annotations in SQLite; preview images remain remote URLs (no object storage yet).

Canonical API/schema authority will move to `image-scoring-backend` over time. Mobile consumer routes are documented in [`../docs/LABELING_API.md`](../docs/LABELING_API.md).

## Quick start

```bash
cd labeling-hub
cp .env.example .env
npm install
npm run dev
```

On startup, the hub **upserts any missing demo batches** by stable `experimentId` (safe to restart after upgrading the hub):

| `experimentId` | Mode | Notes |
|----------------|------|--------|
| `hub-culling-seed-v1` | culling | 6 single-frame tasks |
| `hub-culling-burst-seed-v1` | culling | 4-frame burst (`clusterId`, loupe) |
| `hub-box-quality-seed-v1` | box_quality | preview + `subject_crop` |
| `hub-presence-seed-v1` | presence | Present / Absent / Unsure |
| `hub-detector-compare-seed-v1` | pairwise | Option A/B + Neither |

## Auth

| Role | Token env | Routes |
|------|-----------|--------|
| Mobile | `LABELING_HUB_MOBILE_TOKEN` | `/v1/batches`, `/v1/batches/:id/lease`, `/v1/annotations` |
| Local sync agent | `LABELING_HUB_MACHINE_TOKEN` | `/v1/machine/batches`, `/v1/machine/annotations` |

Default dev tokens are in `.env.example`.

## Connect the mobile app

1. Start this service (`PORT=8787`).
2. In the labeler **Settings**:
   - Base URL: `http://localhost:8787` (use your LAN IP from a physical device)
   - Access token: `dev-mobile-token`
3. Pull to refresh on the home screen to download hub batches.

## Machine upload (local Vexlum sync agent preview)

```bash
curl -sS -X POST http://localhost:8787/v1/machine/batches \
  -H "Authorization: Bearer dev-machine-token" \
  -H "Content-Type: application/json" \
  -d @sample-batch.json
```

```bash
curl -sS "http://localhost:8787/v1/machine/annotations?since=2026-01-01T00:00:00.000Z" \
  -H "Authorization: Bearer dev-machine-token"
```

## Production notes (Hetzner)

Replace SQLite with PostgreSQL, add object storage for preview blobs, TLS termination (Caddy/Traefik), and rotate tokens. This package is intentionally small for the MVP vertical slice.
