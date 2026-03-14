# PackPal

Weather-aware packing lists built with Next.js, Convex, Clerk, and Tailwind CSS.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` with:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
```

3. Start the app and Convex in separate terminals:

```bash
pnpm dev
pnpm convex dev
```

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm convex dev
pnpm convex deploy
```

## Architecture

- `src/app`: Next.js App Router pages
- `src/components`: UI and trip wizard components
- `src/lib`: shared packing, weather, date, auth, and route utilities
- `convex`: backend queries, mutations, actions, and schema
- `tests`: Vitest coverage for shared logic and critical UI contracts
