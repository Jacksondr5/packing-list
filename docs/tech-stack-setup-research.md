# Tech Stack Setup Research (February 2026)

## Table of Contents

1. [Next.js (v16) with App Router](#1-nextjs-v16-with-app-router)
2. [Tailwind CSS (v4)](#2-tailwind-css-v4)
3. [ShadCN UI](#3-shadcn-ui)
4. [Convex Backend](#4-convex-backend)
5. [Clerk Authentication](#5-clerk-authentication)
6. [Convex + Clerk Integration](#6-convex--clerk-integration)
7. [Open-Meteo API](#7-open-meteo-api)

---

## 1. Next.js (v16) with App Router

### CLI Commands

```bash
# Create a new project with defaults (TypeScript, ESLint, Tailwind, App Router, Turbopack)
npx create-next-app@latest my-app --yes

# Or interactive mode (prompts for TypeScript, linter, React Compiler, Tailwind, src/, App Router, import alias)
npx create-next-app@latest my-app

# Start dev server (Turbopack is default in v16)
npm run dev
```

### Key Details (Next.js 16)

- **Turbopack** is stable and used by default for `next dev` and `next build`.
- **React Compiler** is now stable (auto-memoizes components).
- Uses **React 19.2** (View Transitions, useEffectEvent, Activity).
- The `--yes` flag enables: TypeScript, Tailwind, ESLint, App Router, Turbopack, `@/*` import alias.

### Key Configuration Files

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `app/layout.tsx` - Root layout (Server Component)
- `app/page.tsx` - Home page
- `app/globals.css` - Global styles

---

## 2. Tailwind CSS (v4)

### Installation

If using `create-next-app` with `--yes`, Tailwind is automatically included. Otherwise:

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

### Key Configuration Files

**`postcss.config.mjs`** (project root):

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**`app/globals.css`**:

```css
@import "tailwindcss";
```

### v4-Specific Changes

- **No `tailwind.config.js` needed** -- Tailwind v4 auto-scans templates and uses CSS-first configuration.
- Uses `@tailwindcss/postcss` instead of the old `tailwindcss` PostCSS plugin.
- Single `@import "tailwindcss"` replaces the old `@tailwind base; @tailwind components; @tailwind utilities;` directives.
- Customization is done directly in CSS using `@theme` blocks instead of `tailwind.config.js`.
- Full builds 5x faster; incremental builds 100x+ faster.

---

## 3. ShadCN UI

### CLI Commands

```bash
# Initialize shadcn/ui in your Next.js project
npx shadcn@latest init

# Add individual components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
# etc.
```

### Init Prompts

The `init` command asks:

1. Style (Default or New York)
2. Base color
3. Component directory location

### Usage

Components are copied into your codebase (not a dependency). Use them like any other component:

```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return <Button>Click me</Button>;
}
```

### Key Details

- Components are built on **Radix Primitives** and **Tailwind CSS**.
- Fully supports React 19 and Tailwind v4.
- Components live in `components/ui/` -- you own and can modify the code.

---

## 4. Convex Backend

### CLI Commands

```bash
# Install Convex
npm install convex

# Initialize Convex dev environment (logs in via GitHub, creates project, generates convex/ folder)
npx convex dev

# Import sample data (optional)
npx convex import --table tasks sampleData.jsonl
```

### Key Configuration Files

- `convex/` - Directory for all backend functions
- `convex/schema.ts` - Database schema definition
- `convex/auth.config.ts` - Auth provider configuration (when using Clerk)
- `.env.local` - Contains `NEXT_PUBLIC_CONVEX_URL`

### Environment Variables

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project-123.convex.cloud
```

### Provider Setup

**`app/ConvexClientProvider.tsx`** (Client Component):

```tsx
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

**`app/layout.tsx`**:

```tsx
import { ConvexClientProvider } from "./ConvexClientProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
```

### Schema Definition Syntax

**`convex/schema.ts`**:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  trips: defineTable({
    name: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  packingItems: defineTable({
    name: v.string(),
    isPacked: v.boolean(),
    category: v.string(),
    tripId: v.id("trips"),
    quantity: v.optional(v.number()),
  }).index("by_trip", ["tripId"]),
});
```

### Available Validator Types

| Type        | Syntax                              | Description           |
| ----------- | ----------------------------------- | --------------------- |
| String      | `v.string()`                        | Text values           |
| Number      | `v.number()`                        | Numeric values        |
| Boolean     | `v.boolean()`                       | True/false            |
| Document ID | `v.id("tableName")`                 | Foreign key reference |
| Array       | `v.array(v.string())`               | Array of typed items  |
| Object      | `v.object({ key: v.string() })`     | Nested object         |
| Optional    | `v.optional(v.string())`            | Nullable field        |
| Union       | `v.union(v.string(), v.number())`   | Multiple types        |
| Literal     | `v.literal("constant")`             | Fixed value           |
| Record      | `v.record(v.string(), v.boolean())` | Key-value map         |
| Any         | `v.any()`                           | Unrestricted          |

### Defining Queries

```typescript
// convex/tasks.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

// Basic query -- no arguments
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

// Query with arguments and index
export const getByTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("packingItems")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .order("asc")
      .collect();
  },
});

// Query with authentication
export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    return await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});
```

**Client-side usage:**

```tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function TaskList() {
  const tasks = useQuery(api.tasks.getAll);
  return (
    <div>
      {tasks?.map(({ _id, text }) => (
        <div key={_id}>{text}</div>
      ))}
    </div>
  );
}
```

### Defining Mutations

```typescript
// convex/tasks.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Insert
export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const newId = await ctx.db.insert("tasks", {
      text: args.text,
      isCompleted: false,
    });
    return newId;
  },
});

// Patch (shallow merge -- updates specified fields only)
export const update = mutation({
  args: { id: v.id("tasks"), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch("tasks", args.id, { isCompleted: args.isCompleted });
  },
});

// Replace (overwrites entire document)
export const replace = mutation({
  args: { id: v.id("tasks"), text: v.string(), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.replace("tasks", args.id, {
      text: args.text,
      isCompleted: args.isCompleted,
    });
  },
});

// Delete
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete("tasks", args.id);
  },
});
```

**Client-side usage:**

```tsx
"use client";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function AddTask() {
  const createTask = useMutation(api.tasks.create);

  const handleSubmit = async () => {
    await createTask({ text: "New task" });
  };
}
```

### Database Write Operations (Convex >= 1.31.0)

As of Convex 1.31.0 (Dec 2025), the `db.get`, `db.patch`, `db.replace`, and `db.delete` methods take the **table name as the first argument**:

```typescript
// New syntax (convex >= 1.31.0)
await ctx.db.get("messages", id);
await ctx.db.patch("messages", id, { text: "updated" });
await ctx.db.replace("messages", id, { text: "replaced", author: "me" });
await ctx.db.delete("messages", id);

// Old syntax (still works, but deprecated)
await ctx.db.get(id);
await ctx.db.patch(id, { text: "updated" });
await ctx.db.replace(id, { text: "replaced", author: "me" });
await ctx.db.delete(id);
```

### Defining Actions (External API Calls)

```typescript
// convex/weather.ts
import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Action that calls an external API
export const fetchWeather = action({
  args: { latitude: v.number(), longitude: v.number() },
  handler: async (ctx, args) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
    );
    const data = await response.json();
    return data;
  },
});

// Action that reads/writes the database via internal functions
export const fetchAndStoreWeather = action({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    // Read from DB via internal query
    const trip = await ctx.runQuery(internal.weather.getTrip, {
      tripId: args.tripId,
    });

    // Call external API
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?...`);
    const weatherData = await response.json();

    // Write to DB via internal mutation
    await ctx.runMutation(internal.weather.storeWeather, {
      tripId: args.tripId,
      data: weatherData,
    });

    return weatherData;
  },
});

// Internal query (not exposed to client)
export const getTrip = internalQuery({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db.get("trips", args.tripId);
  },
});

// Internal mutation (not exposed to client)
export const storeWeather = internalMutation({
  args: { tripId: v.id("trips"), data: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.insert("weatherCache", {
      tripId: args.tripId,
      data: args.data,
      fetchedAt: Date.now(),
    });
  },
});
```

**Client-side usage:**

```tsx
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export function WeatherButton() {
  const fetchWeather = useAction(api.weather.fetchWeather);

  const handleClick = async () => {
    const data = await fetchWeather({ latitude: 52.52, longitude: 13.41 });
    console.log(data);
  };
}
```

### Key Differences: Query vs Mutation vs Action

| Feature                 | Query      | Mutation      | Action                  |
| ----------------------- | ---------- | ------------- | ----------------------- |
| Read DB                 | Yes        | Yes           | Via `ctx.runQuery()`    |
| Write DB                | No         | Yes           | Via `ctx.runMutation()` |
| Call external APIs      | No         | No            | Yes (`fetch`)           |
| Deterministic           | Yes        | Yes           | No                      |
| Reactive (auto-updates) | Yes        | No            | No                      |
| Transactional           | Yes        | Yes           | No                      |
| Client hook             | `useQuery` | `useMutation` | `useAction`             |
| Auto-retry on conflict  | Yes        | Yes           | No                      |

---

## 5. Clerk Authentication

### CLI Commands

```bash
npm install @clerk/nextjs
```

### Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Note: Clerk supports **keyless mode** -- the app starts without env vars and Clerk generates temporary API keys for development.

### Key Configuration Files

**`middleware.ts`** (project root or `src/`):

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Provider Setup (standalone, without Convex)

**`app/layout.tsx`**:

```tsx
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header>
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### Route Protection (Server-side)

```typescript
import { auth } from "@clerk/nextjs/server";

export default async function ProtectedPage() {
  const { userId } = await auth();
  if (!userId) return <div>Not authenticated</div>;
  return <div>Welcome, {userId}</div>;
}
```

---

## 6. Convex + Clerk Integration

### Setup Steps

1. **Install both packages:**

   ```bash
   npm install convex @clerk/nextjs
   ```

2. **Create JWT Template in Clerk Dashboard:**
   - Go to Clerk Dashboard > JWT Templates > New template > Select "Convex"
   - **Do NOT rename the JWT token -- it must be called `convex`**
   - Copy the **Issuer URL** (format: `https://verb-noun-00.clerk.accounts.dev`)

3. **Set environment variables:**

   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
   ```

4. **Create Convex auth config:**

   **`convex/auth.config.ts`**:

   ```typescript
   export default {
     providers: [
       {
         domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
         applicationID: "convex",
       },
     ],
   };
   ```

5. **Create Clerk middleware:**

   **`middleware.ts`**:

   ```typescript
   import { clerkMiddleware } from "@clerk/nextjs/server";

   export default clerkMiddleware();

   export const config = {
     matcher: [
       "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
       "/(api|trpc)(.*)",
     ],
   };
   ```

6. **Create the combined provider:**

   **`components/ConvexClientProvider.tsx`**:

   ```tsx
   "use client";

   import { ReactNode } from "react";
   import { ConvexReactClient } from "convex/react";
   import { ConvexProviderWithClerk } from "convex/react-clerk";
   import { useAuth } from "@clerk/nextjs";

   const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

   export default function ConvexClientProvider({
     children,
   }: {
     children: ReactNode;
   }) {
     return (
       <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
         {children}
       </ConvexProviderWithClerk>
     );
   }
   ```

7. **Wire up the layout:**

   **`app/layout.tsx`**:

   ```tsx
   import { ClerkProvider } from "@clerk/nextjs";
   import ConvexClientProvider from "@/components/ConvexClientProvider";

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <ClerkProvider>
         <html lang="en">
           <body>
             <ConvexClientProvider>{children}</ConvexClientProvider>
           </body>
         </html>
       </ClerkProvider>
     );
   }
   ```

8. **Sync config to Convex:**

   ```bash
   npx convex dev
   ```

### Auth-Aware UI Components

```tsx
"use client";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";

export default function App() {
  return (
    <>
      <AuthLoading>
        <p>Loading...</p>
      </AuthLoading>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <Authenticated>
        <UserButton />
        {/* Authenticated content here */}
      </Authenticated>
    </>
  );
}
```

### Accessing User Identity in Convex Functions

```typescript
import { query, mutation } from "./_generated/server";

export const getMyData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    // identity.subject = Clerk user ID
    // identity.email = user email
    // identity.name = user full name (if mapped in JWT template)
    // identity.tokenIdentifier = unique identifier string
    return await ctx.db
      .query("userData")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});
```

### Important Notes

- Use `useConvexAuth()` from `convex/react` instead of Clerk's `useAuth()` for checking login status in components.
- `ConvexProviderWithClerk` must be inside `ClerkProvider` and must be a Client Component.
- The JWT template in Clerk must be named exactly `convex`.

---

## 7. Open-Meteo API

### Geocoding API (City Name to Coordinates)

**Base URL:** `https://geocoding-api.open-meteo.com/v1/search`

**Parameters:**

| Parameter     | Type    | Required | Default | Description                            |
| ------------- | ------- | -------- | ------- | -------------------------------------- |
| `name`        | String  | Yes      | --      | City name (2+ chars exact, 3+ fuzzy)   |
| `count`       | Integer | No       | 10      | Number of results (max 100)            |
| `language`    | String  | No       | `en`    | Result language                        |
| `format`      | String  | No       | `json`  | Response format (`json` or `protobuf`) |
| `countryCode` | String  | No       | --      | ISO-3166 alpha2 country filter         |

**Example Request:**

```
https://geocoding-api.open-meteo.com/v1/search?name=Berlin&count=5&language=en
```

**Example Response:**

```json
{
  "results": [
    {
      "id": 2950159,
      "name": "Berlin",
      "latitude": 52.52437,
      "longitude": 13.41053,
      "elevation": 74.0,
      "timezone": "Europe/Berlin",
      "feature_code": "PPLC",
      "country_code": "DE",
      "country": "Germany",
      "admin1": "Land Berlin",
      "admin2": null,
      "admin3": null,
      "admin4": null,
      "population": 3426354,
      "postcodes": ["10115", "10117"]
    }
  ]
}
```

### Weather Forecast API

**Base URL:** `https://api.open-meteo.com/v1/forecast`

**Required Parameters:**

| Parameter   | Type  | Description     |
| ----------- | ----- | --------------- |
| `latitude`  | Float | WGS84 latitude  |
| `longitude` | Float | WGS84 longitude |

**Optional Parameters:**

| Parameter            | Type    | Default   | Description                       |
| -------------------- | ------- | --------- | --------------------------------- |
| `hourly`             | String  | --        | Comma-separated hourly variables  |
| `daily`              | String  | --        | Comma-separated daily variables   |
| `current`            | String  | --        | Comma-separated current variables |
| `temperature_unit`   | String  | `celsius` | `celsius` or `fahrenheit`         |
| `wind_speed_unit`    | String  | `kmh`     | `kmh`, `ms`, `mph`, `kn`          |
| `precipitation_unit` | String  | `mm`      | `mm` or `inch`                    |
| `timezone`           | String  | `GMT`     | IANA timezone or `auto`           |
| `forecast_days`      | Integer | 7         | 0-16 days                         |
| `past_days`          | Integer | 0         | 0-92 days                         |
| `start_date`         | String  | --        | ISO8601 `yyyy-mm-dd`              |
| `end_date`           | String  | --        | ISO8601 `yyyy-mm-dd`              |

**Common Hourly Variables:**

- `temperature_2m` - Air temperature at 2m height
- `relative_humidity_2m` - Relative humidity at 2m
- `apparent_temperature` - Feels-like temperature
- `precipitation_probability` - Probability of precipitation
- `precipitation` - Total precipitation
- `rain` - Rain amount
- `snowfall` - Snowfall amount
- `weather_code` - WMO weather code
- `cloud_cover` - Total cloud cover (%)
- `wind_speed_10m` - Wind speed at 10m
- `wind_direction_10m` - Wind direction at 10m
- `wind_gusts_10m` - Wind gusts at 10m
- `visibility` - Visibility distance
- `uv_index` - UV index

**Common Daily Variables:**

- `temperature_2m_max` - Maximum daily temperature
- `temperature_2m_min` - Minimum daily temperature
- `apparent_temperature_max` - Max feels-like temperature
- `apparent_temperature_min` - Min feels-like temperature
- `precipitation_sum` - Total daily precipitation
- `rain_sum` - Total daily rain
- `snowfall_sum` - Total daily snowfall
- `precipitation_probability_max` - Max precipitation probability
- `sunrise` - Sunrise time
- `sunset` - Sunset time
- `daylight_duration` - Daylight duration in seconds
- `sunshine_duration` - Sunshine duration in seconds
- `wind_speed_10m_max` - Max daily wind speed
- `wind_gusts_10m_max` - Max daily wind gusts
- `wind_direction_10m_dominant` - Dominant wind direction
- `uv_index_max` - Max UV index
- `weather_code` - Most severe daily weather code

**Example Request:**

```
https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&current=temperature_2m,weather_code&timezone=auto&forecast_days=7
```

**Example Response:**

```json
{
  "latitude": 52.52,
  "longitude": 13.419998,
  "generationtime_ms": 0.5,
  "utc_offset_seconds": 3600,
  "timezone": "Europe/Berlin",
  "timezone_abbreviation": "CET",
  "elevation": 38.0,
  "current_units": {
    "time": "iso8601",
    "temperature_2m": "\u00b0C",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2026-02-07T12:00",
    "temperature_2m": 3.2,
    "weather_code": 3
  },
  "daily_units": {
    "time": "iso8601",
    "temperature_2m_max": "\u00b0C",
    "temperature_2m_min": "\u00b0C",
    "precipitation_sum": "mm",
    "weather_code": "wmo code"
  },
  "daily": {
    "time": ["2026-02-07", "2026-02-08", "2026-02-09"],
    "temperature_2m_max": [5.1, 6.3, 4.8],
    "temperature_2m_min": [0.2, 1.1, -0.5],
    "precipitation_sum": [0.0, 2.3, 0.5],
    "weather_code": [3, 61, 51]
  }
}
```

### WMO Weather Codes (for `weather_code`)

| Code       | Description                             |
| ---------- | --------------------------------------- |
| 0          | Clear sky                               |
| 1, 2, 3    | Mainly clear, Partly cloudy, Overcast   |
| 45, 48     | Fog, Depositing rime fog                |
| 51, 53, 55 | Drizzle: light, moderate, dense         |
| 56, 57     | Freezing drizzle: light, dense          |
| 61, 63, 65 | Rain: slight, moderate, heavy           |
| 66, 67     | Freezing rain: light, heavy             |
| 71, 73, 75 | Snowfall: slight, moderate, heavy       |
| 77         | Snow grains                             |
| 80, 81, 82 | Rain showers: slight, moderate, violent |
| 85, 86     | Snow showers: slight, heavy             |
| 95         | Thunderstorm: slight or moderate        |
| 96, 99     | Thunderstorm with hail: slight, heavy   |

### Key Notes

- Open-Meteo is **free for non-commercial use** (no API key required).
- Commercial use requires an API key.
- Supports multiple locations via comma-separated coordinates.
- `timezone=auto` automatically resolves timezone from coordinates.

---

## Complete Setup Sequence (All Tools Together)

Here is the recommended order to set up a new project with all these tools:

```bash
# 1. Create Next.js app (includes TypeScript, Tailwind, ESLint, App Router)
npx create-next-app@latest my-app --yes
cd my-app

# 2. Install Convex and Clerk
npm install convex @clerk/nextjs

# 3. Initialize shadcn/ui
npx shadcn@latest init

# 4. Add commonly needed shadcn components
npx shadcn@latest add button card input label dialog select

# 5. Start Convex dev server (creates convex/ folder, prompts GitHub login)
npx convex dev

# 6. In a separate terminal, start Next.js dev server
npm run dev
```

Then configure:

1. Create `convex/schema.ts` with your data model.
2. Create Clerk account and JWT template named "convex".
3. Add environment variables to `.env.local`.
4. Create `convex/auth.config.ts` with Clerk issuer domain.
5. Create `middleware.ts` with Clerk middleware.
6. Create `components/ConvexClientProvider.tsx` with `ConvexProviderWithClerk`.
7. Update `app/layout.tsx` to wrap with `ClerkProvider` and `ConvexClientProvider`.
