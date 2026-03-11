# Auth Route Protection Design

## Problem

Signed-out users can currently load protected application routes directly because `middleware.ts` initializes Clerk but does not enforce authentication anywhere outside the page components.

## Decision

Protect all non-public routes in Clerk middleware.

Public routes:

- `/`
- `/sign-in(.*)`
- `/sign-up(.*)`

Protected routes:

- `/trips/*`
- `/settings/*`
- any future application route that is not explicitly marked public

## Rationale

Middleware is the correct boundary for this behavior because it prevents deep-linked protected pages from rendering at all. It is simpler and less error-prone than adding ad hoc client redirects in each page component.

## Validation

- Add a shared route-protection helper with unit coverage for public vs protected pathnames.
- Run targeted tests for the helper.
