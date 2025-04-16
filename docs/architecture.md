# High-Level Architecture

This document describes the overall architecture and interaction between components for the Packing List application.

**Core Components & Interactions:**

1.  **Client (Browser - Next.js/React):**
    *   **UI:** Renders pages and components using React (within the Next.js App Router), styled with Tailwind CSS and using pre-built components from ShadCN UI with Lucide Icons.
    *   **Authentication:** Integrates with Clerk's frontend SDK (`@clerk/nextjs`) to manage user sessions, display user state (logged in/out), and provide sign-in/sign-up flows.
    *   **State Management:** Uses Zustand to manage global UI state and the `CurrentPackingList` object. Zustand's `persist` middleware automatically saves/loads this ephemeral list to/from the browser's local storage.
    *   **API Communication:** Uses the tRPC client (`@trpc/client`) to make type-safe calls to the backend API for data fetching and actions.

2.  **Backend API (Server - Next.js/tRPC):**
    *   **Hosting:** Runs within the Next.js application (App Router structure, e.g., `app/api/trpc/[trpc]/route.ts`).
    *   **tRPC Router:** Defines API procedures (`server/trpc/routers/...`) organized by domain (e.g., `itemRouter`, `luggageRouter`, `packingListRouter`).
    *   **Authentication:** Uses Clerk's backend SDK (`@clerk/nextjs/server`) as middleware within tRPC procedures to protect endpoints and identify users.
    *   **Database Interaction:** Uses Drizzle ORM (`drizzle-orm`) to communicate with the Supabase PostgreSQL database. Schema definitions reside in `server/db/schema.ts`.
    *   **Business Logic:** Implements the core packing list generation logic within a tRPC procedure (`packingList.generate`). This involves fetching data, calling external APIs (weather), applying rules, and returning results.

3.  **Database (Supabase/PostgreSQL):**
    *   Stores persistent data: `items`, `luggage`, `tags`, `categories` (potentially linked to Clerk `userId`).
    *   Accessed exclusively by the backend API via Drizzle. Connection details stored in environment variables.

4.  **External Services:**
    *   **Clerk:** Handles user identity, authentication, session management.
    *   **OpenWeatherMap:** Provides weather forecast data via its HTTP API.

5.  **Deployment (Vercel):**
    *   Hosts the Next.js application.
    *   Manages environment variables securely.
    *   Handles build processes and serverless function execution.

**Data Flow Example (Generating a List):**

1.  User inputs trip details in the browser form.
2.  Client calls `packingList.generate` tRPC procedure with parameters.
3.  Backend (Next.js/tRPC) receives the request.
4.  Clerk middleware verifies authentication.
5.  `packingList.generate` procedure executes:
    *   (Optional) Calls OpenWeatherMap API.
    *   Uses Drizzle to fetch data from Supabase.
    *   Applies rules engine logic.
    *   Determines suggested luggage.
6.  Procedure returns generated list data to the client.
7.  Client updates Zustand store with the new `CurrentPackingList`.
8.  UI re-renders.
9.  Zustand persists the state to local storage. 