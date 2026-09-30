# image-scoring-labeler

Offline-first mobile app for Vexlum human labeling (React Native + Expo + SQLite).

## Architecture

This repo implements the **mobile labeler** described in the Vexlum human-labeling architecture:

- Download/lease task batches from the Hetzner labeling hub
- Cache preview assets on device
- Persist every annotation to SQLite before advancing the UI
- Upload results asynchronously via a sync outbox

Shared API/schema authority stays in `image-scoring-backend`. See [docs/LABELING_API.md](./docs/LABELING_API.md).

HTML review tool adoption (box quality, presence, detector compare, burst culling) is tracked in [docs/HTML_REVIEW_TOOLS_ADOPTION_PLAN.md](./docs/HTML_REVIEW_TOOLS_ADOPTION_PLAN.md).

## MVP status

Implemented in this repo:

- Expo Router shell (`src/app/`)
- SQLite schema (batches, tasks, annotations, outbox, asset cache)
- Labeling modes:
  - **Culling** — Pick / Keep / Reject, burst star (`isBest`), burst loupe + thumbnails, swipe shortcuts
  - **Binary** — Good / Bad
  - **Presence** — Present / Absent / Unsure with swipe shortcuts
  - **Box quality** — dual preview + primary-box overlay
  - **Pairwise** — Left / Right / Equal / Cannot judge; model compare adds **Neither** (Prefer A / B)
- Undo, skip, zoom interaction metrics (`zoomUsed`, `zoomCount`, `undoUsed`)
- Background annotation outbox flush
- Demo batches (Picsum previews) on the home screen for offline testing

### Labeling hub (step 4)

Minimal broker in [`labeling-hub/`](./labeling-hub/README.md) — SQLite, mobile + machine tokens, demo seed batches on startup (missing `experimentId`s are inserted automatically).

```bash
npm run hub:dev
```

Point the app Settings to `http://localhost:8787` with token `dev-mobile-token`, then pull to refresh.

Not yet implemented (follow-on):

- Production Hetzner deploy (PostgreSQL + object storage)
- Local task builder / sync agent in `image-scoring-backend`

## Development

```bash
npm install
npm run typecheck
npm run hub:typecheck
npx expo lint
npx expo start
```

Configure hub URL and access token under **Settings**. Use the home screen **Demo:** buttons to exercise each labeling mode offline.

## Recommended vertical slice (from architecture)

Local batch → previews → Hetzner → this app → annotations → local human-label import. Demo batches simulate the mobile half until the hub and backend sync land.
