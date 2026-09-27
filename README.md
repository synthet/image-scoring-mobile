# image-scoring-labeler

Offline-first mobile app for Vexlum human labeling (React Native + Expo + SQLite).

## Architecture

This repo implements the **mobile labeler** described in the Vexlum human-labeling architecture:

- Download/lease task batches from the Hetzner labeling hub
- Cache preview assets on device
- Persist every annotation to SQLite before advancing the UI
- Upload results asynchronously via a sync outbox

Shared API/schema authority stays in `image-scoring-backend`. See [docs/LABELING_API.md](./docs/LABELING_API.md).

## MVP status

Implemented in this repo:

- Expo Router shell (`src/app/`)
- SQLite schema (batches, tasks, annotations, outbox, asset cache)
- Pick / Keep / Reject (`culling`), Good / Bad (`binary`), and pairwise (`LEFT` / `RIGHT` / `EQUAL` / `CANNOT_JUDGE`) UI with undo, skip, and zoom
- Background annotation outbox flush
- Demo batch (Picsum previews) for end-to-end UI testing without a hub

### Labeling hub (step 4)

Minimal broker in [`labeling-hub/`](./labeling-hub/README.md) — SQLite, mobile + machine tokens, seed batch on first run.

```bash
npm run hub:dev
```

Point the app Settings to `http://localhost:8787` with token `dev-mobile-token`, then pull to refresh.

Not yet implemented (follow-on):

- Production Hetzner deploy (PostgreSQL + object storage)
- Local task builder / sync agent in `image-scoring-backend`
- Swipe gestures (optional enhancement on existing modes)
- Gesture swipes (buttons provided for clarity)

## Development

```bash
npm install
npm run typecheck
npx expo start
```

Configure hub URL and access token under **Settings**. Use **Load demo culling batch** on the home screen to exercise labeling offline.

## Recommended vertical slice (from architecture)

Local batch → previews → Hetzner → this app → annotations → local human-label import. The demo batch simulates the mobile half until the hub and backend sync land.
