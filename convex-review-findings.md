# Packing List Convex Review Findings

Reviewed against: `convex_rules.txt`

## Scope

- Repository review focused on Convex backend patterns and auth/data access correctness.
- No code changes implemented.

## Prioritized Findings

### 1) **High** — Public functions accept `userId` as an argument for authorization-critical flows

**Rule reference:** Authentication guideline says: _“NEVER accept a `userId` or any user identifier as a function argument for authorization purposes. Always derive user identity server-side via `ctx.auth.getUserIdentity()`._

**Where**

- `convex/items.ts:6`, `convex/items.ts:18`
- `convex/luggage.ts:6`, `convex/luggage.ts:18`
- `convex/trips.ts:24`, `convex/trips.ts:44`

**Why this matters**

- Even with ownership checks, this pattern relies on client-supplied identity context for core data reads/writes.
- It increases attack surface and creates avoidable coupling between client and server auth semantics.
- It diverges from Convex’s recommended secure design pattern and can lead to future regression risks when new endpoints are added.

**Suggested remediation**

- Remove `userId` from public function args for user-scoped operations.
- In handlers, resolve current user via `ctx.auth.getUserIdentity()` (or `authenticateUser`) and use that derived `_id` for querying/inserting.
- Keep entity-id arguments only where needed (e.g., `tripId`, `itemId`) and verify ownership server-side.

**Quick win**

- Start with read/list endpoints (`listByUser` in items/luggage/trips): replace `args.userId` with server-derived user id and make `args: {}`.

---

### 2) **Medium** — Potentially incorrect Convex JWT issuer config (`auth.config.ts`)

**Rule reference:** Auth config must use JWT provider issuer domain discoverable at `{domain}/.well-known/openid-configuration`.

**Where**

- `convex/auth.config.ts:4` (`domain: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL`)

**Why this matters**

- If this env var points to Clerk frontend API rather than issuer URL, Convex auth verification can fail silently and `ctx.auth.getUserIdentity()` may return `null` for valid users.
- This can produce authentication outages or confusing authorization behavior.

**Suggested remediation**

- Confirm the env var resolves to Clerk’s JWT issuer URL (OIDC issuer), not a frontend-only endpoint.
- Prefer a clearly named issuer env (e.g., `CLERK_ISSUER_URL`) to avoid configuration ambiguity.

**Quick win**

- Add startup/deploy validation (or a short README note) documenting the exact expected issuer format.

---

### 3) **Low** — ID typing weakened by string cast in `tripItems.createMany`

**Rule reference:** TypeScript guideline says be strict with Convex `Id<...>` types and avoid falling back to plain strings.

**Where**

- `convex/tripItems.ts:33` (`const tripIdStr = item.tripId as string;`)

**Why this matters**

- Casting `Id<"trips">` to `string` weakens type guarantees and can hide future type errors.
- This is small now but tends to spread as code evolves.

**Suggested remediation**

- Keep the set typed as `Set<Id<"trips">>` and store `item.tripId` directly.

**Quick win**

- Replace string-cast dedupe with ID-typed dedupe in-place.

---

## Additional Observations (non-blocking)

- Function registration and argument validators are consistently present across public mutations/queries/actions.
- Query patterns generally use indexes (`withIndex`) rather than `filter`, aligning with Convex query guidance.
- No fixes were implemented per request; this is review-only.
