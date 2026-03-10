# Item Library Create Form Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users configure quantity rules, trip types, and weather conditions when creating a new item in the item library.

**Architecture:** Reuse the existing edit-item form structure for item creation so both flows share one form model, one set of controls, and one payload-normalization path. Keep the backend unchanged because the schema and mutations already accept the required fields.

**Tech Stack:** Next.js App Router, React, Convex, TypeScript, ShadCN UI

---

### Task 1: Share item form state between add and edit dialogs

**Files:**
- Modify: `src/app/settings/items/page.tsx`

**Step 1: Define shared form types and default state**

Add a shared form state shape that can initialize from defaults for new items and from a stored item for edits.

**Step 2: Extract shared item form UI**

Move the quantity rule, trip type, weather condition, name, and category controls into a shared dialog form component or shared render path.

**Step 3: Wire add flow to shared form**

Use the shared form in the add-item dialog and submit the normalized values through `api.items.create`.

**Step 4: Keep edit flow on shared form**

Use the same form state and normalization for `api.items.update` so create/edit stay behaviorally aligned.

### Task 2: Verify behavior and regressions

**Files:**
- Modify: `src/app/settings/items/page.tsx`

**Step 1: Run targeted checks**

Run `pnpm lint` if feasible, or a targeted file check if the repo has unrelated lint noise.

**Step 2: Review the rendered state assumptions**

Confirm defaults remain `fixed:1`, `tripTypes:["all"]`, and `weatherConditions:null` when the user leaves the extra controls unchanged.
