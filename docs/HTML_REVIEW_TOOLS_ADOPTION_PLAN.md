# HTML Review Tools Adoption Plan

This document outlines the adoption strategy for integrating existing web and HTML review tools across the Image Scoring ecosystem into [image-scoring-mobile](file:///D:/Projects/image-scoring-mobile).

---

## 1. Ecosystem Tool Inventory

The following tools exist across sibling repositories and provide battle-tested review and labeling UX patterns:

| Tool | Source Repository / Path | Review Mode | Key UX Pattern |
|------|-------------------------|-------------|----------------|
| **Primary-Box Quality Review** | `image-scoring-backend`:<br>[box_page/index.html](file:///D:/Projects/image-scoring-backend/.agent/scratch/bird_v1_owner_labels/box_page/index.html) | Bounding box quality (`usable`, `poor_crop`, `wrong_target`, `unsure`) | Dual synchronized panels: whole image with detector box overlay + magnified subject crop |
| **Bird Box Model Comparison** | `image-scoring-backend`:<br>[bird_detect_compare/page/index.html](file:///D:/Projects/image-scoring-backend/.agent/scratch/bird_detect_compare/page/index.html) | Model A vs Model B detector comparison (`a`, `b`, `tie`, `neither`, `unsure`) | Side-by-side detector comparison on same photo with 5 decision choices including 'neither' |
| **Blind Bird Presence Review** | `image-scoring-backend`:<br>[page/index.html](file:///D:/Projects/image-scoring-backend/.agent/scratch/bird_v1_owner_labels/page/index.html) | 3-state presence (`bird`, `no_bird`, `unsure`) | Clean image stage, single-click 200% zoom toggle, progress meter, quick keyboard/tap shortcuts |
| **Detector Benchmark Labelling** | `image-scoring-backend`:<br>[label/index.html](file:///D:/Projects/image-scoring-backend/.agent/scratch/detector_benchmark/label/index.html) | Detection ground truth verification | Minimalist high-throughput verification with CSV export |
| **Burst-series culling & star labeler** | Inspired UX (local reference inventory under gitignored `docs/private/`) | Multi-image burst series (Pick/Keep/Reject + Star) | Multi-card burst comparison, 100% Loupe pan/zoom, consensus hints, burst-level completion |
| **Detection & Eye Score Galleries** | `image-scoring-model`:<br>[bird-detect gallery](file:///D:/Projects/image-scoring-model/.agent/scratch/bird-detect-run/gallery/index.html),<br>[eye-score gallery](file:///D:/Projects/image-scoring-model/.agent/scratch/eye-score-run/gallery/index.html) | Inspection & validation | Canvas bounding box overlays colored by confidence gradient, threshold filtering, lightbox stage |
| **Design Tokens & Badges** | `image-scoring-ui`:<br>[embedding-icons.html](file:///D:/Projects/image-scoring-ui/preview/embedding-icons.html) | UI tokens & status badges | Standard colors (`--pick: #3fb950`, `--keep: #d29922`, `--reject: #f85149`, `--best: #58a6ff`) |

### CUB ONNX train — D1 / raptor review suite (2026-09-29)

Canonical index (sibling repo): [`image-scoring-model/.agent/scratch/cub-onnx-train-2026-09-29/REVIEW_PAGES.md`](file:///D:/Projects/image-scoring-model/.agent/scratch/cub-onnx-train-2026-09-29/REVIEW_PAGES.md) and [`REVIEW_PAGES.csv`](file:///D:/Projects/image-scoring-model/.agent/scratch/cub-onnx-train-2026-09-29/REVIEW_PAGES.csv).

| Page | HTML | Workflow | Export / status |
|------|------|----------|-----------------|
| **D1 blind box comparison** | [`d1_review/page/index.html`](file:///D:/Projects/image-scoring-model/.agent/scratch/cub-onnx-train-2026-09-29/d1_review/page/index.html) | Pairwise on 38 field disagreements; model identity hidden until decode | [`compare_review_decoded.csv`](file:///D:/Projects/image-scoring-model/.agent/scratch/cub-onnx-train-2026-09-29/d1_review/compare_review_decoded.csv) — review complete |
| **Raptor presence review** | [`raptor_presence_page/index.html`](file:///D:/Projects/image-scoring-model/.agent/scratch/cub-onnx-train-2026-09-29/d1_review/raptor_presence_page/index.html) | 100 independent frames: bird / no bird / unsure | [`raptor_presence_decoded.csv`](file:///D:/Projects/image-scoring-model/.agent/scratch/cub-onnx-train-2026-09-29/d1_review/raptor_presence_decoded.csv) — 56 bird, 35 no bird, 9 unsure |
| **Raptor bird-box review** | [`raptor_box_page/index.html`](file:///D:/Projects/image-scoring-model/.agent/scratch/cub-onnx-train-2026-09-29/d1_review/raptor_box_page/index.html) | On bird frames: drag **multiple** normalized boxes per image; on unsure frames: re-label presence; actual-pixels viewport | `raptor_boxes.json` — in progress |

---

## 2. Adoption Blueprints for Mobile

### Phase 1: Primary-Box Quality Review Mode (`box_quality`)

#### Context & Objective
In detector validation pipelines (such as `bird_v1`), reviewers evaluate whether the primary detected bounding box is high quality or a false positive. Adopting this in mobile enables rapid field verification of detector runs.

#### Workflow & Choices
- **Usable** (<kbd>G</kbd>): Contains subject and frames its body usefully.
- **Poor Crop** (<kbd>P</kbd>): Subject cut off or excessive background.
- **Wrong Target** (<kbd>W</kbd>): False positive (no target subject in box).
- **Unsure** (<kbd>U</kbd>).

#### Screen Layout & Components
- **Dual Visual Stage**:
  1. **Overview Panel**: Displays `assets.preview` with the primary detector rectangle outlined in high-contrast orange.
  2. **Crop Focus Panel**: Displays `assets.subject_crop` (magnified region around the bounding box + margin).
  - Tapping either panel triggers an interactive fullscreen modal for pinch-to-zoom / 100% inspection.
- **Thumb Action Bar**: 4 distinct color-accented action buttons stacked or in a 2x2 grid for easy thumb reach on mobile devices.
- **Quick Navigation**: "Previous", "Next", "Skip to next unlabelled", and "Undo".

---

### Phase 2: Presence Verification Mode (`presence`)

#### Context & Objective
Extends the current `binary` mode (`GOOD` / `BAD`) into a specialized high-throughput presence labeling flow.

#### Workflow & Choices
- **Subject Present** (`YES` / Green)
- **Subject Absent** (`NO` / Red)
- **Unsure** (`UNSURE` / Yellow)

#### Screen Layout & Components
- Edge-to-edge image canvas with double-tap 200% zoom.
- Minimalist header with linear progress bar and completion percentage.
- Swipe gestures (swipe right = Present, swipe left = Absent, swipe up = Unsure).

---

### Phase 3: Burst Culling & "Best-in-Burst" Star (`culling_burst`)

#### Context & Objective
Adopt burst-series culling patterns (pick / keep / reject, loupe, best-in-burst star) for clusters of consecutive shots (`context.clusterId`). External HTML reference paths live only under gitignored `docs/private/` ([PRIVATE_LOCAL.md](./PRIVATE_LOCAL.md)).

#### Workflow & Choices
- Grade each image in the burst: **Pick** (2), **Keep** (1), **Reject** (0).
- Select **Star / Best-in-Burst** (`isBest = true`).

#### Screen Layout & Components
- Horizontal swipe carousel or compact grid view of the burst items.
- Shared burst header indicating image position in cluster (e.g., `Shot 3 of 7`).
- Dedicated Star toggle on each card.
- Fullscreen Loupe modal allowing seamless pan & swipe between consecutive burst frames at 1:1 pixel resolution to check focus and eye sharpness.

---

### Phase 4: Model Detection Comparison (`pairwise_compare`)

#### Context & Objective
Adopted from [bird_detect_compare/page/index.html](file:///D:/Projects/image-scoring-backend/.agent/scratch/bird_detect_compare/page/index.html). When evaluating two detector models (e.g., `v0` vs `v1`) on the same image, reviewers compare the proposed crops side-by-side. Crucially, both models might fail, requiring a 5th option (`Neither`).

#### Workflow & Choices
- **Prefer A** (<kbd>1</kbd>): Option A box is superior.
- **Prefer B** (<kbd>2</kbd>): Option B box is superior.
- **Tie** (<kbd>T</kbd>): Both boxes are equally good/comparable.
- **Neither** (<kbd>N</kbd>): Both boxes are poor crops or miss the bird.
- **Unsure** (<kbd>U</kbd>).

#### Screen Layout & Components
- Side-by-side comparison labeled **Option A** (`#2f6fad` / `#7fb1ff`) and **Option B** (`#8a4a12` / `#ffb46c`).
- Extend `PairwiseDecision` to include `'NEITHER'`.
- Option button row with color accents and clean mobile spacing.

---

## 3. Schema & API Alignment

### Schema Extensions in `src/types/labeling.ts`

```typescript
// Add new modes
export type LabelMode =
  | 'binary'
  | 'presence'       // Adopted from page/index.html & detector_benchmark
  | 'box_quality'    // Adopted from box_page/index.html
  | 'culling'
  | 'pairwise'
  | 'best_of_n'
  | 'rating'
  | 'attribute'
  | 'ranking';

// Ensure asset fields support overview, crops, and overlays
export interface LabelAssets {
  preview: string;
  thumbnail?: string;
  large?: string;
  subject_crop?: string;  // Used for Box Quality crop focus panel
  eye_crop?: string;      // Used for Eye Quality scoring
}

// Bounding box metadata for overlays
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  label?: string;
}
```

---

## 4. Implementation Milestones

1. **Milestone 1 — Box Quality Review Component**:
   - Create `src/components/labeling/BoxQualityTaskView.tsx`.
   - Implement dual-panel display (`assets.preview` + `assets.subject_crop`).
   - Wire 4-choice response handler (`usable`, `poor_crop`, `wrong_target`, `unsure`).

2. **Milestone 2 — Seed Batches in Labeling Hub**:
   - Update `labeling-hub/src/seed.ts` to generate mock batches for:
     - `hub-box-quality-seed-v1` (with preview and subject crop URLs).
     - `hub-presence-seed-v1` (presence verification).
   - Test offline leasing, caching, and annotation outbox flush.

3. **Milestone 3 — Burst Loupe & Star Selection**:
   - Enhance culling task screen with a burst viewer modal.
   - Add "Best in Burst" star selection to cluster labeling.

---

## 5. Mobile implementation status (2026-09-29)

| Capability | Status | Mobile surface |
|------------|--------|----------------|
| Box quality dual-panel review | **Shipped** | `BoxQualityScreen`, `box_quality` mode, orange `primaryBox` overlay via metadata |
| Detector model pairwise compare | **Shipped** | `PairwiseScreen` + `NEITHER`, `compareVariant: 'model_compare'` |
| Presence verification | **Shipped** | `PresenceScreen`, swipe shortcuts + tap buttons |
| Burst star / best-in-burst | **Shipped** | Star toggle + `isBest`; `BurstLoupeModal` swipes cluster frames with pinch zoom |
| Hub + offline demo seeds | **Shipped** | `demoBatch.ts`, `labeling-hub/src/seed.ts` |
| Interaction metrics | **Shipped** | `zoomUsed` / `zoomCount` on preview or loupe zoom; `undoUsed` when reviewer undoes before submit |

**Verify locally:** `npm run typecheck`, `npm run hub:typecheck`, `npx expo lint`. Home screen demo buttons load each mode without the hub.

---

## 6. CUB D1 / raptor pages → mobile mapping

| HTML page | Mobile today | Choice / data alignment | Gap |
|-----------|--------------|-------------------------|-----|
| D1 blind comparison | `pairwise` + `compareVariant: 'model_compare'` | Prefer A/B → `LEFT`/`RIGHT`; tie / neither / unsure → `EQUAL` / `NEITHER` / `CANNOT_JUDGE`; side randomization matches blind review | Batch must ship two crops per disagreement; decode mapping stays in export pipeline (not in app) |
| Raptor presence | `presence` | `bird` → `PRESENT`, `no_bird` → `ABSENT`, `unsure` → `UNSURE` | Progress bar / 200% zoom toggle are optional polish; core flow matches |
| Raptor bird-box (reference) | `box_draw` or custom `interaction` | `answer.geometry` with normalized boxes + `choiceId`; map to `raptor_boxes.json` in export pipeline | **Framework** — `GeometryAnnotateScreen` via `draw_boxes` capability; see [LABELING_TASK_FRAMEWORK.md](./LABELING_TASK_FRAMEWORK.md) |

**Suggested next milestone (raptor_box_page):**

1. Extend `AnnotationAnswer` with `boxes?: BoundingBox[]` (or `[x1,y1,x2,y2][]`) and optional `presenceOverride` when revisiting unsure priors.
2. Full-screen `BoxDrawScreen` with `react-native-gesture-handler` rect drag on normalized coordinates (mirror HTML `pointerdown` / `pointermove` / `pointerup` on overlay).
3. Hub seed batch `hub-raptor-box-draw-seed-v1` referencing 1280px-oriented review JPEGs + `context.prior: 'bird' | 'unsure'`.
4. Machine export compatible with `raptor_boxes.json` shape from the HTML tool.

Use the three verified HTML files as UX reference; keep exports authoritative in `image-scoring-backend` / model scratch pipelines.
