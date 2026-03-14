# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PackPal — a weather-aware packing list generator built with Next.js 16 (App Router), Convex (real-time backend), Clerk (authentication), and Tailwind CSS v4 with ShadCN UI components. Users create trips by entering destination, dates, trip type, and transport mode; the app fetches weather forecasts and generates categorized packing checklists with calculated quantities.

## Commands

- `pnpm dev` — start Next.js dev server (uses Turbopack) + run `pnpm convex dev` separately for the Convex backend
- `pnpm build` — production build
- `pnpm lint` — run ESLint (flat config, v9)
- `pnpm test` — run unit tests
- `pnpm convex dev` — start Convex development server (watches and deploys functions)
- `pnpm convex deploy` — deploy Convex functions to production
- `pnpm shadcn@latest add <component>` — add new ShadCN UI components

Unit tests are configured with Vitest (`pnpm test`).

## Architecture

### Frontend (Next.js App Router)

Routes in `src/app/`:

- `/` — trip list (home)
- `/trips/new` — multi-step trip creation wizard
- `/trips/[tripId]` — individual trip view with packing checklist
- `/settings/items` — manage master item library
- `/settings/luggage` — manage luggage inventory
- `/sign-in`, `/sign-up` — Clerk auth pages

Components in `src/components/`:

- `ui/` — ShadCN primitives (button, card, dialog, checkbox, etc.)
- `wizard/` — multi-step trip creation wizard (WizardShell, DestinationStep, DatesStep, TripTypeStep, TransportStep)
- Top-level: Header, ConvexClientProvider, WeatherSummary, PackingChecklist

### Backend (Convex)

All backend logic lives in `convex/`. No Next.js API routes are used — the app communicates entirely through Convex queries, mutations, and actions via React hooks (`useQuery`, `useMutation`, `useAction`).

Key function files:

- `trips.ts`, `items.ts`, `luggage.ts`, `tripItems.ts`, `users.ts` — CRUD operations
- `weather.ts` — action that calls the Open-Meteo API for forecasts
- `defaultItems.ts` — seed data for new users' item libraries
- `authHelpers.ts` — shared auth utilities for Convex functions
- `schema.ts` — database schema (5 tables: users, items, luggage, trips, tripItems)

### Core Business Logic (`src/lib/`)

- `generatePackingList.ts` — filters items by trip type and weather conditions, calculates quantities based on trip duration
- `suggestLuggage.ts` — recommends luggage based on transport mode
- `weatherCodes.ts` — maps WMO weather codes to human-readable conditions

### Data Flow

Clerk handles auth → Convex syncs user identity → user manages items/luggage in settings → trip wizard collects trip details → weather action fetches forecast → `generatePackingList` produces checklist → tripItems are stored and tracked for packing status.

## Tech Stack Details

- **Node.js**: 22.19.0 (see `.nvmrc`)
- **Package manager**: pnpm 10.28.1
- **TypeScript**: strict mode enabled, path alias `@/*` → `./src/*`
- **Tailwind CSS v4**: CSS-first config via PostCSS plugin (no `tailwind.config.js`)
- **ShadCN UI**: "New York" style variant, uses `cn()` utility from `src/lib/utils.ts`
- **Convex validators**: use `v` from `convex/values` for schema/argument validation (not Zod)

## Environment Variables

Required in `.env.local` (see `.env.local.example`):

- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `CLERK_SECRET_KEY` — Clerk secret key
- `CLERK_JWT_ISSUER_DOMAIN` — Clerk JWT issuer URL used by Convex auth.config.ts

Optional / advanced Clerk config:

- `NEXT_PUBLIC_CLERK_FRONTEND_API_URL` — Override for the Clerk Frontend API URL when your setup explicitly needs it
