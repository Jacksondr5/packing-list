# Favicon Refresh Implementation Plan

> Implementation note: execute tasks sequentially and validate outputs after each task.

**Goal:** Replace the blue favicon with a warm-toned vintage trunk icon and provide a rugged comparison variant.

**Architecture:** Keep the live app favicon on the existing `src/app/icon.svg` path so Next metadata continues to resolve without route changes. Store the rugged alternate as a separate SVG asset, then generate PNG previews from both files for visual comparison and quick review.

**Tech Stack:** Next.js App Router, SVG, Node.js tooling, macOS `sips`

---

## Task 1: Capture the approved vintage trunk favicon system

**Files:**

- Modify: `src/app/icon.svg`
- Create: `public/favicon-vintage-rugged.svg`

**Step 1: Simplify the trunk geometry**

Use a compact vintage trunk silhouette with a short handle, restrained edge bands, and one centered latch that can survive small raster sizes.

**Step 2: Apply the warm brand palette**

Use cream and sand for the tile or body fill, deep brown for structure, and muted brass for the accent detail.

**Step 3: Set the live favicon**

Replace the current blue `src/app/icon.svg` with the polished warm-tile trunk variant while preserving the file path already referenced by metadata.

**Step 4: Add the rugged alternate**

Create `public/favicon-vintage-rugged.svg` with the same trunk silhouette but darker straps and heavier trim so it can be compared independently.

## Task 2: Generate review artifacts

**Files:**

- Create: `tmp/favicon-preview/favicon-polished.png`
- Create: `tmp/favicon-preview/favicon-rugged.png`
- Create: `tmp/favicon-preview/comparison.html`
- Create: `tmp/favicon-preview/comparison-screenshot.png`

**Step 1: Rasterize both SVGs**

Run:

- `sips -s format png src/app/icon.svg --out tmp/favicon-preview/favicon-polished.png`
- `sips -s format png public/favicon-vintage-rugged.svg --out tmp/favicon-preview/favicon-rugged.png`

**Step 2: Build a simple comparison board**

Create `tmp/favicon-preview/comparison.html` that loads `./favicon-polished.png` and `./favicon-rugged.png` in matching sections for dark, light, and tab-like backgrounds so both variants can be compared in a deterministic layout.

**Step 3: Capture a screenshot for review**

Render the board and save a screenshot as `tmp/favicon-preview/comparison-screenshot.png` with:

- `npx playwright screenshot --device="Desktop Chrome HiDPI" file://$PWD/tmp/favicon-preview/comparison.html tmp/favicon-preview/comparison-screenshot.png`

## Task 3: Verify asset wiring

**Files:**

- Inspect: `src/app/layout.tsx`

**Step 1: Confirm metadata still points at `/icon.svg`**

Keep the existing icon metadata unchanged so the new primary asset is picked up automatically.

**Step 2: Smoke-check the output files**

Open the generated previews or screenshot and confirm both variants match the approved warm palette and suitcase silhouette.
