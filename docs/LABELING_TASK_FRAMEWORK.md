# Labeling task framework (mobile)

HTML review pages in sibling repos are **reference UX**, not templates to copy field-by-field. The mobile app composes tasks from a small, reusable **interaction spec** so new labeling types ship as data, not one-off screens.

## Layers

| Layer | Role |
|--------|------|
| `LabelTask` + `TaskConfig` | Batch contract (items, assets, choices, optional `interaction`) |
| `resolveTaskSpec()` | Merges explicit `config.interaction` with legacy defaults from `mode` |
| `TaskWorkspace` | Picks layout + capabilities and mounts the right widgets |
| `AnnotationAnswer` | `choice`, `geometry`, `pairwise`, `isBest`, etc. |

## `TaskInteractionSpec`

```typescript
{
  layout: 'single_image' | 'dual_image' | 'pairwise_images',
  choices?: { id, label, tone?, swipe? }[],
  capabilities?: [
    'zoom', 'swipe_choices', 'draw_boxes', 'burst_loupe', 'burst_best',
    'detector_overlay', 'pairwise_blind', 'pairwise_model_compare',
  ],
  requireBoxesForChoiceIds?: string[],
  promoteChoiceOnDraw?: string,
  secondaryAsset?: 'subject_crop' | 'eye_crop',
  pairwise?: { leftLabel?, rightLabel?, includeNeither? },
}
```

When `config.interaction` is omitted, `resolveTaskSpec()` infers a spec from `mode` (`binary`, `presence`, `culling`, `box_quality`, `box_draw`, `pairwise`).

## Custom task example

Define a new review flow without adding a `LabelMode` or screen:

```json
{
  "mode": "attribute",
  "config": {
    "choices": ["POSITIVE", "NEGATIVE", "UNKNOWN"],
    "interaction": {
      "layout": "single_image",
      "capabilities": ["zoom", "draw_boxes"],
      "choices": [
        { "id": "POSITIVE", "label": "Target visible", "tone": "good" },
        { "id": "NEGATIVE", "label": "Not present", "tone": "bad" },
        { "id": "UNKNOWN", "label": "Unsure", "tone": "warning" }
      ],
      "requireBoxesForChoiceIds": ["POSITIVE"],
      "promoteChoiceOnDraw": "POSITIVE"
    }
  },
  "items": [{
    "imageId": "img-1",
    "assets": { "preview": "https://…" },
    "metadata": { "priorChoice": "UNKNOWN" }
  }]
}
```

Submissions store `answer.geometry` with normalized boxes and `choiceId`.

## Mapping reference HTML → framework

| Reference pattern | Framework knobs |
|-------------------|-----------------|
| Presence / ternary class | `single_image` + `swipe_choices` + 3 `choices` |
| Pick / keep / reject + burst | `culling` mode or same + `burst_*` capabilities |
| Detector A vs B | `pairwise_images` + `pairwise_model_compare` |
| Box QA (crop + frame) | `dual_image` + `secondaryAsset: subject_crop` |
| Multi-box ground truth | `draw_boxes` + `requireBoxesForChoiceIds` |

Export formats (CSV, project JSON) stay in backend / hub pipelines; the app records canonical `AnnotationEvent` payloads.
