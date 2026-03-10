# Auth Route Protection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redirect unauthenticated users to Clerk sign-in whenever they request a protected app route.

**Architecture:** Keep route protection centralized in `middleware.ts` using Clerk's middleware guard. Define public-route patterns once in a shared helper so the policy is easy to test and update without duplicating matcher logic.

**Tech Stack:** Next.js 16, Clerk middleware, Vitest

---

## Task 1: Define route-protection policy

**Files:**
- Create: `src/lib/routeProtection.ts`

**Step 1: Add the public-route patterns**

Create the shared list of routes that remain accessible without auth:

```ts
export const PUBLIC_ROUTE_PATTERNS = ["/", "/sign-in(.*)", "/sign-up(.*)"] as const;
```

**Step 2: Add a testable pathname helper**

Create `isPublicPathname(pathname)` so unit tests can verify the same policy without needing a full Next middleware runtime.

## Task 2: Enforce auth in middleware

**Files:**
- Modify: `middleware.ts`

**Step 1: Build a Clerk route matcher**

Import `createRouteMatcher` and initialize it from `PUBLIC_ROUTE_PATTERNS`.

**Step 2: Protect non-public routes**

Update the middleware callback to call `await auth.protect()` whenever the current request is not public.

## Task 3: Verify the policy

**Files:**
- Create: `tests/routeProtection.spec.ts`

**Step 1: Add public-route coverage**

Verify `/`, `/sign-in`, and `/sign-up` remain public.

**Step 2: Add protected-route coverage**

Verify `/trips/new`, `/trips/[tripId]`, and `/settings` are treated as protected.

**Step 3: Run the targeted test**

Run:

```bash
pnpm test -- routeProtection
```
