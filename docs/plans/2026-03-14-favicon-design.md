# Favicon Refresh Design

## Problem

The current favicon uses a bright blue and white palette that no longer matches the application UI, which now uses warm sand, brown, and gold tones.

## Decision

Replace the favicon with a simple vintage trunk mark in the app's warm palette and create two related variants:

- a polished vintage trunk on a light warm rounded tile
- a rugged vintage trunk alternate with darker trim

The primary app favicon will use the light warm tile because it preserves contrast and legibility across browser tab bars.

## Rationale

The vintage trunk keeps the travel cue but feels more distinctive and brand-aligned than the first suitcase pass. Keeping the shape simple avoids losing detail at `16x16` and `32x32`, while the warm tile version gives the icon a consistent silhouette on both dark and light browser chrome. The rugged variant is useful as a contrast study, but the polished version is more intentional at small sizes.

## Visual Direction

- Base colors: warm cream, sand, deep brown, and muted brass
- Form: upright vintage trunk with rounded body, short handle, and restrained trim
- Detail level: minimal center latch, simple edge bands, no tiny decorative lines
- Variant finishes:
  - primary: polished vintage on a soft sand rounded square
  - alternate: rugged vintage with darker straps and stronger edge trim

## Validation

- Update `src/app/icon.svg` to the polished warm-tile trunk version
- Add a rugged trunk variant as a comparison asset
- Render PNG previews for both variants and compare them at favicon-like scale
