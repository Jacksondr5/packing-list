# Packing List

A packing list application to help you prepare for trips.

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build for production
pnpm build
```

## Tech Stack

- [Next.js](https://nextjs.org/) 15 with App Router
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Clerk](https://clerk.com/) for authentication
- [TypeScript](https://www.typescriptlang.org/)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
