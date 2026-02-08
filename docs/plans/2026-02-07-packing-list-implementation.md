# Packing List App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first packing list web app that generates smart, weather-aware packing lists from trip details.

**Architecture:** Next.js App Router frontend with Convex real-time backend and Clerk auth. The trip wizard collects destination/dates/type/transport, fetches weather from Open-Meteo via a Convex action, filters the user's master item library by trip type and weather conditions, calculates quantities by trip length, suggests luggage, and produces a categorized checklist. All data lives in Convex tables; auth flows through Clerk's JWT integration with Convex.

**Tech Stack:** Next.js 16, Convex, Clerk, Tailwind CSS v4, ShadCN UI, Open-Meteo API

**Reference docs:**

- Design: `docs/plans/2026-02-07-packing-list-app-design.md`
- Tech research: `docs/tech-stack-setup-research.md`
- Default items: `src/data/defaultItems.ts`

---

### Task 1: Project Scaffolding

**Files:**

- Create: Next.js project via `create-next-app`
- Create: `postcss.config.mjs` (auto-created by create-next-app)
- Create: `app/globals.css` (auto-created)

**Step 1: Create Next.js project**

Run from the repo root (which is currently empty except for `docs/` and `src/`). We need to create the Next.js project in-place. First back up our existing files, then scaffold, then restore:

```bash
# Save our existing work
cp -r docs /tmp/packing-list-docs-backup
cp -r src /tmp/packing-list-src-backup

# Create Next.js project in a temp dir, then move files
npx create-next-app@latest /tmp/packing-list-nextjs --yes --typescript --eslint --tailwind --app --turbopack --import-alias "@/*"

# Copy scaffolded files into our repo
cp -r /tmp/packing-list-nextjs/* .
cp -r /tmp/packing-list-nextjs/.* . 2>/dev/null || true

# Restore our docs and src
cp -r /tmp/packing-list-docs-backup/* docs/
cp -r /tmp/packing-list-src-backup/* src/

# Clean up
rm -rf /tmp/packing-list-nextjs /tmp/packing-list-docs-backup /tmp/packing-list-src-backup
```

**Step 2: Install dependencies**

```bash
npm install convex @clerk/nextjs
```

**Step 3: Initialize ShadCN**

```bash
npx shadcn@latest init --defaults
```

**Step 4: Add ShadCN components we'll need**

```bash
npx shadcn@latest add button card input label dialog select checkbox progress badge separator scroll-area
```

**Step 5: Verify the app runs**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: HTML response from Next.js dev server.

**Step 6: Initialize git and commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, ShadCN, Convex, and Clerk"
```

---

### Task 2: Convex Schema & Auth Config

**Files:**

- Create: `convex/schema.ts`
- Create: `convex/auth.config.ts`
- Create: `middleware.ts`
- Create: `components/ConvexClientProvider.tsx`
- Modify: `app/layout.tsx`
- Create: `.env.example` (template — user fills in real values)

**Step 1: Create `.env.example` template**

Create `.env.example` with placeholder values. The user will need to fill these in with real values from their Clerk and Convex dashboards. Do **not** commit `.env.local` to version control.

```env
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
```

When running locally, copy `.env.example` to `.env.local` and keep `.env.local` out of git.

**Step 2: Create Convex schema**

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  items: defineTable({
    userId: v.id("users"),
    name: v.string(),
    category: v.string(),
    tripTypes: v.array(v.string()),
    weatherConditions: v.union(
      v.object({
        minTemp: v.optional(v.number()),
        maxTemp: v.optional(v.number()),
        rain: v.optional(v.boolean()),
        snow: v.optional(v.boolean()),
      }),
      v.null(),
    ),
    quantityRule: v.object({
      type: v.union(
        v.literal("perDay"),
        v.literal("perNDays"),
        v.literal("fixed"),
      ),
      value: v.number(),
    }),
  }).index("by_user", ["userId"]),

  luggage: defineTable({
    userId: v.id("users"),
    name: v.string(),
    transportModes: v.array(v.string()),
    size: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
  }).index("by_user", ["userId"]),

  trips: defineTable({
    userId: v.id("users"),
    destination: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    departureDate: v.string(),
    returnDate: v.string(),
    tripType: v.string(),
    transportMode: v.string(),
    selectedLuggage: v.array(v.id("luggage")),
    weather: v.union(
      v.object({
        dailyForecasts: v.array(
          v.object({
            date: v.string(),
            highTemp: v.number(),
            lowTemp: v.number(),
            precipProbability: v.number(),
            snowfall: v.number(),
            weatherCode: v.number(),
            condition: v.string(),
          }),
        ),
        fetchedAt: v.number(),
      }),
      v.null(),
    ),
    status: v.union(
      v.literal("planning"),
      v.literal("packing"),
      v.literal("completed"),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  tripItems: defineTable({
    tripId: v.id("trips"),
    itemName: v.string(),
    category: v.string(),
    quantity: v.number(),
    packed: v.boolean(),
  }).index("by_trip", ["tripId"]),
});
```

**Step 3: Create Convex auth config**

Create `convex/auth.config.ts`:

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

**Step 4: Create Clerk middleware**

Create `middleware.ts` at project root:

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

**Step 5: Create ConvexClientProvider**

Create `components/ConvexClientProvider.tsx`:

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

**Step 6: Update app/layout.tsx**

Wrap the app with `ClerkProvider` and `ConvexClientProvider`:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import "./globals.css";

export const metadata = {
  title: "PackPal - Smart Packing Lists",
  description: "Generate weather-aware packing lists for your trips",
};

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

**Step 7: Commit** (verify `.env.local` is not staged)

```bash
git add -A
git commit -m "feat: add Convex schema, Clerk auth config, and provider setup"
```

---

### Task 3: User Management & Default Item Seeding

**Files:**

- Create: `convex/users.ts`
- Move: `src/data/defaultItems.ts` to `convex/defaultItems.ts` (Convex actions need access)
- Create: `convex/items.ts`

**Step 1: Create user management functions**

Create `convex/users.ts`. This handles looking up or creating the user record when they log in:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_ITEMS } from "./defaultItems";

export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) return existing._id;

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? undefined,
    });

    // Seed default item library for new user
    for (const item of DEFAULT_ITEMS) {
      await ctx.db.insert("items", {
        userId,
        name: item.name,
        category: item.category,
        tripTypes: item.tripTypes,
        weatherConditions: item.weatherConditions,
        quantityRule: item.quantityRule,
      });
    }

    return userId;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});
```

**Step 2: Move defaultItems.ts into convex folder**

Move `src/data/defaultItems.ts` to `convex/defaultItems.ts`. Remove the TypeScript types (Convex files in the `convex/` dir use Convex's own type system). Keep it as a plain array of objects:

```typescript
export const DEFAULT_ITEMS = [
  // ... (same content as src/data/defaultItems.ts but without the type exports)
  // Keep the full list of 76 items
];
```

Remove the old `src/data/` directory.

**Step 3: Create item CRUD functions**

Create `convex/items.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    category: v.string(),
    tripTypes: v.array(v.string()),
    weatherConditions: v.union(
      v.object({
        minTemp: v.optional(v.number()),
        maxTemp: v.optional(v.number()),
        rain: v.optional(v.boolean()),
        snow: v.optional(v.boolean()),
      }),
      v.null(),
    ),
    quantityRule: v.object({
      type: v.union(
        v.literal("perDay"),
        v.literal("perNDays"),
        v.literal("fixed"),
      ),
      value: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    tripTypes: v.optional(v.array(v.string())),
    weatherConditions: v.optional(
      v.union(
        v.object({
          minTemp: v.optional(v.number()),
          maxTemp: v.optional(v.number()),
          rain: v.optional(v.boolean()),
          snow: v.optional(v.boolean()),
        }),
        v.null(),
      ),
    ),
    quantityRule: v.optional(
      v.object({
        type: v.union(
          v.literal("perDay"),
          v.literal("perNDays"),
          v.literal("fixed"),
        ),
        value: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    // Filter out undefined fields
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch("items", id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.delete("items", args.id);
  },
});
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add user management with default item seeding and item CRUD"
```

---

### Task 4: Luggage CRUD Functions

**Files:**

- Create: `convex/luggage.ts`

**Step 1: Create luggage functions**

Create `convex/luggage.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("luggage")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    transportModes: v.array(v.string()),
    size: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("luggage", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("luggage"),
    name: v.optional(v.string()),
    transportModes: v.optional(v.array(v.string())),
    size: v.optional(
      v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch("luggage", id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("luggage") },
  handler: async (ctx, args) => {
    await ctx.db.delete("luggage", args.id);
  },
});
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add luggage CRUD functions"
```

---

### Task 5: Weather Action & List Generation Logic

**Files:**

- Create: `convex/weather.ts`
- Create: `convex/trips.ts`
- Create: `convex/tripItems.ts`
- Create: `lib/weatherCodes.ts`

**Step 1: Create WMO weather code mapping**

Create `lib/weatherCodes.ts`:

```typescript
const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function getConditionFromCode(code: number): string {
  return WMO_CODES[code] ?? "Unknown";
}

export function isRainCode(code: number): boolean {
  return [
    51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
  ].includes(code);
}

export function isSnowCode(code: number): boolean {
  return [71, 73, 75, 77, 85, 86].includes(code);
}
```

**Step 2: Create weather action**

Create `convex/weather.ts`. This is a Convex action (can call external APIs):

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const geocodeCity = action({
  args: { cityName: v.string() },
  handler: async (_ctx, args) => {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.cityName)}&count=5&language=en`,
    );
    const data = await response.json();
    return data.results ?? [];
  },
});

export const fetchForecast = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (_ctx, args) => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(args.latitude));
    url.searchParams.set("longitude", String(args.longitude));
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum,weather_code",
    );
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("start_date", args.startDate);
    url.searchParams.set("end_date", args.endDate);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    return await response.json();
  },
});
```

**Step 3: Create trip functions**

Create `convex/trips.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const weatherValidator = v.union(
  v.object({
    dailyForecasts: v.array(
      v.object({
        date: v.string(),
        highTemp: v.number(),
        lowTemp: v.number(),
        precipProbability: v.number(),
        snowfall: v.number(),
        weatherCode: v.number(),
        condition: v.string(),
      }),
    ),
    fetchedAt: v.number(),
  }),
  v.null(),
);

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getById = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db.get("trips", args.tripId);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    destination: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    departureDate: v.string(),
    returnDate: v.string(),
    tripType: v.string(),
    transportMode: v.string(),
    selectedLuggage: v.array(v.id("luggage")),
    weather: weatherValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("trips", {
      ...args,
      status: "planning",
    });
  },
});

export const updateWeather = mutation({
  args: {
    tripId: v.id("trips"),
    weather: weatherValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("trips", args.tripId, { weather: args.weather });
  },
});

export const updateLuggage = mutation({
  args: {
    tripId: v.id("trips"),
    selectedLuggage: v.array(v.id("luggage")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("trips", args.tripId, {
      selectedLuggage: args.selectedLuggage,
    });
  },
});

export const updateStatus = mutation({
  args: {
    tripId: v.id("trips"),
    status: v.union(
      v.literal("planning"),
      v.literal("packing"),
      v.literal("completed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("trips", args.tripId, { status: args.status });
  },
});
```

**Step 4: Create trip item functions**

Create `convex/tripItems.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tripItems")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

export const createMany = mutation({
  args: {
    items: v.array(
      v.object({
        tripId: v.id("trips"),
        itemName: v.string(),
        category: v.string(),
        quantity: v.number(),
        packed: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const item of args.items) {
      ids.push(await ctx.db.insert("tripItems", item));
    }
    return ids;
  },
});

export const togglePacked = mutation({
  args: { id: v.id("tripItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get("tripItems", args.id);
    if (!item) throw new Error("Trip item not found");
    await ctx.db.patch("tripItems", args.id, { packed: !item.packed });
  },
});

export const updateQuantity = mutation({
  args: { id: v.id("tripItems"), quantity: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch("tripItems", args.id, { quantity: args.quantity });
  },
});

export const remove = mutation({
  args: { id: v.id("tripItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete("tripItems", args.id);
  },
});

export const addItem = mutation({
  args: {
    tripId: v.id("trips"),
    itemName: v.string(),
    category: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tripItems", {
      ...args,
      packed: false,
    });
  },
});
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add weather API, trip CRUD, and trip item management"
```

---

### Task 6: List Generation Logic (Client-Side Utility)

**Files:**

- Create: `lib/generatePackingList.ts`
- Create: `lib/suggestLuggage.ts`

**Step 1: Create packing list generation logic**

Create `lib/generatePackingList.ts`. This is a pure function that takes the user's item library and trip details and returns the filtered, quantity-calculated list:

```typescript
import { getConditionFromCode, isRainCode, isSnowCode } from "./weatherCodes";

interface WeatherConditions {
  minTemp?: number;
  maxTemp?: number;
  rain?: boolean;
  snow?: boolean;
}

interface QuantityRule {
  type: "perDay" | "perNDays" | "fixed";
  value: number;
}

interface MasterItem {
  _id: string;
  name: string;
  category: string;
  tripTypes: string[];
  weatherConditions: WeatherConditions | null;
  quantityRule: QuantityRule;
}

interface DailyForecast {
  date: string;
  highTemp: number;
  lowTemp: number;
  precipProbability: number;
  snowfall: number;
  weatherCode: number;
  condition: string;
}

interface TripDetails {
  tripType: string;
  tripDays: number;
  weather: { dailyForecasts: DailyForecast[] } | null;
}

interface GeneratedItem {
  itemName: string;
  category: string;
  quantity: number;
}

export function generatePackingList(
  masterItems: MasterItem[],
  trip: TripDetails,
): GeneratedItem[] {
  const { tripType, tripDays, weather } = trip;

  // Compute weather summary across all forecast days
  let minHighTemp = Infinity;
  let maxLowTemp = -Infinity;
  let hasRain = false;
  let hasSnow = false;

  if (weather?.dailyForecasts.length) {
    for (const day of weather.dailyForecasts) {
      if (day.highTemp < minHighTemp) minHighTemp = day.highTemp;
      if (day.lowTemp > maxLowTemp) maxLowTemp = day.lowTemp;
      if (day.precipProbability > 40) hasRain = true;
      if (isRainCode(day.weatherCode)) hasRain = true;
      if (day.snowfall > 0) hasSnow = true;
      if (isSnowCode(day.weatherCode)) hasSnow = true;
    }
  }

  const result: GeneratedItem[] = [];

  for (const item of masterItems) {
    // Filter by trip type
    if (!item.tripTypes.includes("all") && !item.tripTypes.includes(tripType)) {
      continue;
    }

    // Filter by weather conditions
    if (item.weatherConditions && weather) {
      const wc = item.weatherConditions;
      let weatherMatch = false;

      // minTemp: suggest when forecast high is at or below this
      if (wc.minTemp !== undefined && minHighTemp <= wc.minTemp) {
        weatherMatch = true;
      }
      // maxTemp: suggest when forecast low is at or above this
      if (wc.maxTemp !== undefined && maxLowTemp >= wc.maxTemp) {
        weatherMatch = true;
      }
      // Rain
      if (wc.rain && hasRain) {
        weatherMatch = true;
      }
      // Snow
      if (wc.snow && hasSnow) {
        weatherMatch = true;
      }

      // If item has weather conditions but none matched, skip it
      if (!weatherMatch) continue;
    }

    // If we have weather conditions on the item but no weather data, skip weather-only items
    if (item.weatherConditions && !weather) {
      // Still include items that also match by trip type (non-weather-only)
      // But if the item ONLY has weather conditions, we can't evaluate, so skip
      continue;
    }

    // Calculate quantity
    let quantity: number;
    switch (item.quantityRule.type) {
      case "perDay":
        quantity = tripDays * item.quantityRule.value;
        break;
      case "perNDays":
        quantity = Math.max(1, Math.ceil(tripDays / item.quantityRule.value));
        break;
      case "fixed":
        quantity = item.quantityRule.value;
        break;
    }

    result.push({
      itemName: item.name,
      category: item.category,
      quantity,
    });
  }

  return result;
}
```

**Step 2: Create luggage suggestion logic**

Create `lib/suggestLuggage.ts`:

```typescript
interface LuggageItem {
  _id: string;
  name: string;
  transportModes: string[];
  size: "small" | "medium" | "large";
}

const SIZE_CAPACITY = { small: 15, medium: 30, large: 50 };

export function suggestLuggage(
  allLuggage: LuggageItem[],
  transportMode: string,
  totalItemCount: number,
): LuggageItem[] {
  // Filter by transport compatibility
  const compatible = allLuggage.filter((bag) =>
    bag.transportModes.includes(transportMode),
  );

  if (compatible.length === 0) return [];

  // Sort by size ascending
  const sizeOrder = { small: 0, medium: 1, large: 2 };
  const sorted = [...compatible].sort(
    (a, b) => sizeOrder[a.size] - sizeOrder[b.size],
  );

  // Find the smallest bag(s) that fit
  const suggestions: LuggageItem[] = [];
  let remainingCapacity = totalItemCount;

  for (const bag of sorted.reverse()) {
    if (remainingCapacity <= 0) break;
    suggestions.push(bag);
    remainingCapacity -= SIZE_CAPACITY[bag.size];
  }

  return suggestions;
}

export function getLuggageWarning(
  selectedLuggage: LuggageItem[],
  totalItemCount: number,
): string | null {
  const totalCapacity = selectedLuggage.reduce(
    (sum, bag) => sum + SIZE_CAPACITY[bag.size],
    0,
  );

  if (totalCapacity < totalItemCount * 0.7) {
    return "Your selected luggage might be too small for this trip. Consider a larger bag.";
  }
  return null;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add packing list generation and luggage suggestion logic"
```

---

### Task 7: Home Page & Auth UI

**Files:**

- Create: `app/page.tsx` (replace default)
- Create: `components/Header.tsx`
- Create: `app/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/sign-up/[[...sign-up]]/page.tsx`

**Step 1: Create Header component**

Create `components/Header.tsx`:

```tsx
"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

export default function Header() {
  return (
    <header className="bg-background sticky top-0 z-50 border-b px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <h1 className="text-lg font-bold">PackPal</h1>
        <AuthLoading>
          <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
        </AuthLoading>
        <Unauthenticated>
          <SignInButton mode="modal" />
        </Unauthenticated>
        <Authenticated>
          <UserButton />
        </Authenticated>
      </div>
    </header>
  );
}
```

**Step 2: Create home page**

Replace `app/page.tsx`:

```tsx
"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function TripList() {
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const user = useQuery(api.users.getCurrentUser);
  const trips = useQuery(
    api.trips.listByUser,
    user ? { userId: user._id } : "skip",
  );

  useEffect(() => {
    getOrCreateUser();
  }, [getOrCreateUser]);

  const activeTrips = trips?.filter((t) => t.status !== "completed") ?? [];
  const pastTrips = trips?.filter((t) => t.status === "completed") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Trips</h2>
        <Button asChild>
          <Link href="/trips/new">New Trip</Link>
        </Button>
      </div>

      {activeTrips.length === 0 && pastTrips.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center">
            No trips yet. Create your first trip to get started!
          </CardContent>
        </Card>
      )}

      {activeTrips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-medium">Active</h3>
          {activeTrips.map((trip) => (
            <Link key={trip._id} href={`/trips/${trip._id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {trip.destination}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {trip.departureDate} - {trip.returnDate} | {trip.tripType} |{" "}
                  {trip.transportMode}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pastTrips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-medium">
            Past Trips
          </h3>
          {pastTrips.map((trip) => (
            <Link key={trip._id} href={`/trips/${trip._id}`}>
              <Card className="hover:bg-accent opacity-60 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {trip.destination}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {trip.departureDate} - {trip.returnDate} | {trip.tripType}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6">
        <Unauthenticated>
          <div className="space-y-4 py-12 text-center">
            <h2 className="text-2xl font-bold">Smart Packing Lists</h2>
            <p className="text-muted-foreground">
              Generate weather-aware packing lists for your trips. Never forget
              an item again.
            </p>
          </div>
        </Unauthenticated>
        <Authenticated>
          <TripList />
        </Authenticated>
      </main>
    </div>
  );
}
```

**Step 3: Create Clerk sign-in/sign-up routes**

Create `app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

Create `app/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add home page with trip list, auth UI, and sign-in/sign-up routes"
```

---

### Task 8: Trip Wizard — Destination & Dates Steps

**Files:**

- Create: `app/trips/new/page.tsx`
- Create: `components/wizard/WizardShell.tsx`
- Create: `components/wizard/DestinationStep.tsx`
- Create: `components/wizard/DatesStep.tsx`

**Step 1: Create WizardShell**

Create `components/wizard/WizardShell.tsx` — manages wizard state and step navigation:

```tsx
"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface WizardShellProps {
  steps: string[];
  children: (currentStep: number) => ReactNode;
  onComplete: () => void;
  canProceed: boolean;
}

export default function WizardShell({
  steps,
  children,
  onComplete,
  canProceed,
}: WizardShellProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-muted-foreground flex justify-between text-sm">
          <span>{steps[currentStep]}</span>
          <span>
            {currentStep + 1} / {steps.length}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div>{children(currentStep)}</div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed}
          >
            Next
          </Button>
        ) : (
          <Button onClick={onComplete} disabled={!canProceed}>
            Generate List
          </Button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create DestinationStep**

Create `components/wizard/DestinationStep.tsx` — city search with geocoding:

```tsx
"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface DestinationStepProps {
  onSelect: (result: {
    name: string;
    latitude: number;
    longitude: number;
  }) => void;
  selected: { name: string; latitude: number; longitude: number } | null;
}

export default function DestinationStep({
  onSelect,
  selected,
}: DestinationStepProps) {
  const [query, setQuery] = useState(selected?.name ?? "");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const geocode = useAction(api.weather.geocodeCity);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await geocode({ cityName: value });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="destination">Where are you going?</Label>
        <Input
          id="destination"
          placeholder="Search for a city..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {selected && (
        <div className="border-primary bg-primary/5 rounded-md border p-3 text-sm">
          Selected: <strong>{selected.name}</strong>
        </div>
      )}

      {searching && (
        <p className="text-muted-foreground text-sm">Searching...</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <Card
              key={r.id}
              className="hover:bg-accent cursor-pointer transition-colors"
              onClick={() => {
                onSelect({
                  name: `${r.name}, ${r.country}`,
                  latitude: r.latitude,
                  longitude: r.longitude,
                });
                setResults([]);
                setQuery(`${r.name}, ${r.country}`);
              }}
            >
              <CardContent className="py-3">
                <p className="font-medium">{r.name}</p>
                <p className="text-muted-foreground text-sm">
                  {r.admin1 ? `${r.admin1}, ` : ""}
                  {r.country}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create DatesStep**

Create `components/wizard/DatesStep.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DatesStepProps {
  departureDate: string;
  returnDate: string;
  onDepartureChange: (date: string) => void;
  onReturnChange: (date: string) => void;
}

export default function DatesStep({
  departureDate,
  returnDate,
  onDepartureChange,
  onReturnChange,
}: DatesStepProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="departure">Departure date</Label>
        <Input
          id="departure"
          type="date"
          min={today}
          value={departureDate}
          onChange={(e) => onDepartureChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="return">Return date</Label>
        <Input
          id="return"
          type="date"
          min={departureDate || today}
          value={returnDate}
          onChange={(e) => onReturnChange(e.target.value)}
        />
      </div>
      {departureDate && returnDate && (
        <p className="text-muted-foreground text-sm">
          {Math.ceil(
            (new Date(returnDate).getTime() -
              new Date(departureDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1}{" "}
          days
        </p>
      )}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add trip wizard shell, destination search, and date picker steps"
```

---

### Task 9: Trip Wizard — Type, Transport & Complete Flow

**Files:**

- Create: `components/wizard/TripTypeStep.tsx`
- Create: `components/wizard/TransportStep.tsx`
- Modify: `app/trips/new/page.tsx` (wire up all steps)

**Step 1: Create TripTypeStep**

Create `components/wizard/TripTypeStep.tsx`:

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

const TRIP_TYPES = [
  {
    value: "business",
    label: "Business",
    description: "Work meetings, conferences",
  },
  {
    value: "vacation",
    label: "Vacation / Beach",
    description: "Relaxation, sun, swimming",
  },
  {
    value: "camping",
    label: "Camping / Outdoors",
    description: "Hiking, nature, adventure",
  },
  {
    value: "cityBreak",
    label: "City Break",
    description: "Sightseeing, culture, food",
  },
];

interface TripTypeStepProps {
  selected: string;
  onSelect: (type: string) => void;
}

export default function TripTypeStep({
  selected,
  onSelect,
}: TripTypeStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        What kind of trip is this?
      </p>
      {TRIP_TYPES.map((type) => (
        <Card
          key={type.value}
          className={`hover:bg-accent cursor-pointer transition-colors ${
            selected === type.value ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => onSelect(type.value)}
        >
          <CardContent className="py-3">
            <p className="font-medium">{type.label}</p>
            <p className="text-muted-foreground text-sm">{type.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Step 2: Create TransportStep**

Create `components/wizard/TransportStep.tsx`:

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

const TRANSPORT_MODES = [
  { value: "plane", label: "Plane", description: "Flying to destination" },
  { value: "train", label: "Train", description: "Rail travel" },
  { value: "car", label: "Car", description: "Driving to destination" },
];

interface TransportStepProps {
  selected: string;
  onSelect: (mode: string) => void;
}

export default function TransportStep({
  selected,
  onSelect,
}: TransportStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        How are you getting there?
      </p>
      {TRANSPORT_MODES.map((mode) => (
        <Card
          key={mode.value}
          className={`hover:bg-accent cursor-pointer transition-colors ${
            selected === mode.value ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => onSelect(mode.value)}
        >
          <CardContent className="py-3">
            <p className="font-medium">{mode.label}</p>
            <p className="text-muted-foreground text-sm">{mode.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Step 3: Create the wizard page**

Create `app/trips/new/page.tsx` — ties all wizard steps together:

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import WizardShell from "@/components/wizard/WizardShell";
import DestinationStep from "@/components/wizard/DestinationStep";
import DatesStep from "@/components/wizard/DatesStep";
import TripTypeStep from "@/components/wizard/TripTypeStep";
import TransportStep from "@/components/wizard/TransportStep";
import { generatePackingList } from "@/lib/generatePackingList";
import { getConditionFromCode } from "@/lib/weatherCodes";

const STEPS = ["Destination", "Dates", "Trip Type", "Transport"];

export default function NewTripPage() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const items = useQuery(
    api.items.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const luggage = useQuery(
    api.luggage.listByUser,
    user ? { userId: user._id } : "skip",
  );

  const createTrip = useMutation(api.trips.create);
  const createTripItems = useMutation(api.tripItems.createMany);
  const fetchForecast = useAction(api.weather.fetchForecast);

  const [destination, setDestination] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [tripType, setTripType] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [generating, setGenerating] = useState(false);

  const canProceedForStep = (step: number) => {
    switch (step) {
      case 0:
        return destination !== null;
      case 1:
        return (
          departureDate !== "" &&
          returnDate !== "" &&
          returnDate >= departureDate
        );
      case 2:
        return tripType !== "";
      case 3:
        return transportMode !== "";
      default:
        return false;
    }
  };

  const [currentStep, setCurrentStep] = useState(0);

  const handleComplete = async () => {
    if (!user || !destination || !items) return;
    setGenerating(true);

    try {
      // Fetch weather
      let weather = null;
      try {
        const forecastData = await fetchForecast({
          latitude: destination.latitude,
          longitude: destination.longitude,
          startDate: departureDate,
          endDate: returnDate,
        });

        if (forecastData?.daily) {
          const dailyForecasts = forecastData.daily.time.map(
            (date: string, i: number) => ({
              date,
              highTemp: forecastData.daily.temperature_2m_max[i],
              lowTemp: forecastData.daily.temperature_2m_min[i],
              precipProbability:
                forecastData.daily.precipitation_probability_max[i],
              snowfall: forecastData.daily.snowfall_sum[i],
              weatherCode: forecastData.daily.weather_code[i],
              condition: getConditionFromCode(
                forecastData.daily.weather_code[i],
              ),
            }),
          );
          weather = { dailyForecasts, fetchedAt: Date.now() };
        }
      } catch {
        // Weather fetch failed — proceed without weather
      }

      // Suggest luggage
      const compatibleLuggage = (luggage ?? []).filter((bag) =>
        bag.transportModes.includes(transportMode),
      );
      const selectedLuggage = compatibleLuggage.map((bag) => bag._id);

      // Create trip
      const tripDays =
        Math.ceil(
          (new Date(returnDate).getTime() - new Date(departureDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;

      const tripId = await createTrip({
        userId: user._id,
        destination: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
        departureDate,
        returnDate,
        tripType,
        transportMode,
        selectedLuggage,
        weather,
      });

      // Generate packing list
      const packingList = generatePackingList(items as any, {
        tripType,
        tripDays,
        weather,
      });

      // Save trip items
      await createTripItems({
        items: packingList.map((item) => ({
          tripId,
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity,
          packed: false,
        })),
      });

      router.push(`/trips/${tripId}`);
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-lg font-medium">Generating your packing list...</p>
          <p className="text-muted-foreground text-sm">
            Fetching weather and calculating what you need
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6">
        <WizardShell
          steps={STEPS}
          canProceed={canProceedForStep(currentStep)}
          onComplete={handleComplete}
        >
          {(step) => {
            // Track step changes
            if (step !== currentStep) setCurrentStep(step);
            switch (step) {
              case 0:
                return (
                  <DestinationStep
                    selected={destination}
                    onSelect={setDestination}
                  />
                );
              case 1:
                return (
                  <DatesStep
                    departureDate={departureDate}
                    returnDate={returnDate}
                    onDepartureChange={setDepartureDate}
                    onReturnChange={setReturnDate}
                  />
                );
              case 2:
                return (
                  <TripTypeStep selected={tripType} onSelect={setTripType} />
                );
              case 3:
                return (
                  <TransportStep
                    selected={transportMode}
                    onSelect={setTransportMode}
                  />
                );
              default:
                return null;
            }
          }}
        </WizardShell>
      </main>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: complete trip wizard with all steps and list generation"
```

---

### Task 10: Trip Detail Page — Packing Checklist

**Files:**

- Create: `app/trips/[tripId]/page.tsx`
- Create: `components/PackingChecklist.tsx`
- Create: `components/WeatherSummary.tsx`

**Step 1: Create WeatherSummary component**

Create `components/WeatherSummary.tsx`:

```tsx
interface DailyForecast {
  date: string;
  highTemp: number;
  lowTemp: number;
  precipProbability: number;
  condition: string;
}

interface WeatherSummaryProps {
  forecasts: DailyForecast[];
}

export default function WeatherSummary({ forecasts }: WeatherSummaryProps) {
  if (forecasts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-muted-foreground text-sm font-medium">Weather</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {forecasts.map((day) => (
          <div
            key={day.date}
            className="flex min-w-[80px] flex-col items-center rounded-lg border p-2 text-center text-xs"
          >
            <span className="font-medium">
              {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="text-muted-foreground">{day.condition}</span>
            <span>
              {Math.round(day.highTemp)}° / {Math.round(day.lowTemp)}°
            </span>
            {day.precipProbability > 0 && (
              <span className="text-blue-500">
                {day.precipProbability}% rain
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create PackingChecklist component**

Create `components/PackingChecklist.tsx`:

```tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Id } from "../convex/_generated/dataModel";

interface TripItem {
  _id: Id<"tripItems">;
  itemName: string;
  category: string;
  quantity: number;
  packed: boolean;
}

interface PackingChecklistProps {
  items: TripItem[];
  readOnly?: boolean;
}

export default function PackingChecklist({
  items,
  readOnly = false,
}: PackingChecklistProps) {
  const togglePacked = useMutation(api.tripItems.togglePacked);

  // Group by category
  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, TripItem[]>,
  );

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.packed).length;
  const progressPercent = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  // Sort categories: put ones with unpacked items first
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aUnpacked = grouped[a].filter((i) => !i.packed).length;
    const bUnpacked = grouped[b].filter((i) => !i.packed).length;
    if (aUnpacked > 0 && bUnpacked === 0) return -1;
    if (aUnpacked === 0 && bUnpacked > 0) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>
            {packedItems} of {totalItems} items packed
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {sortedCategories.map((category) => {
        const categoryItems = grouped[category];
        const categoryPacked = categoryItems.filter((i) => i.packed).length;

        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{category}</h3>
              <span className="text-muted-foreground text-xs">
                {categoryPacked}/{categoryItems.length}
              </span>
            </div>
            <div className="space-y-1">
              {categoryItems.map((item) => (
                <button
                  key={item._id}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                    item.packed
                      ? "bg-muted/50 text-muted-foreground"
                      : "bg-card hover:bg-accent"
                  } ${readOnly ? "cursor-default" : "active:bg-accent cursor-pointer"}`}
                  onClick={() => {
                    if (!readOnly) togglePacked({ id: item._id });
                  }}
                  disabled={readOnly}
                >
                  <Checkbox checked={item.packed} tabIndex={-1} />
                  <span
                    className={`flex-1 ${item.packed ? "line-through" : ""}`}
                  >
                    {item.itemName}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground text-sm">
                      x{item.quantity}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 3: Create trip detail page**

Create `app/trips/[tripId]/page.tsx`:

```tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Header from "@/components/Header";
import PackingChecklist from "@/components/PackingChecklist";
import WeatherSummary from "@/components/WeatherSummary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as Id<"trips">;

  const trip = useQuery(api.trips.getById, { tripId });
  const tripItems = useQuery(api.tripItems.listByTrip, { tripId });
  const updateStatus = useMutation(api.trips.updateStatus);

  if (!trip || !tripItems) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-6">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  const isCompleted = trip.status === "completed";
  const isPacking = trip.status === "packing";
  const isPlanning = trip.status === "planning";
  const allPacked = tripItems.every((item) => item.packed);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{trip.destination}</h2>
            <Badge variant={isCompleted ? "secondary" : "default"}>
              {trip.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {trip.departureDate} - {trip.returnDate} | {trip.tripType} |{" "}
            {trip.transportMode}
          </p>
        </div>

        {trip.weather && (
          <WeatherSummary forecasts={trip.weather.dailyForecasts} />
        )}

        {!trip.weather && (
          <p className="text-muted-foreground text-sm">
            Weather forecast not available for this trip.
          </p>
        )}

        {isPlanning && (
          <Button
            className="w-full"
            onClick={() =>
              updateStatus({ tripId: trip._id, status: "packing" })
            }
          >
            Start Packing
          </Button>
        )}

        <PackingChecklist items={tripItems} readOnly={isCompleted} />

        {isPacking && allPacked && (
          <Button
            className="w-full"
            onClick={() =>
              updateStatus({ tripId: trip._id, status: "completed" })
            }
          >
            Done Packing!
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/")}
        >
          Back to Trips
        </Button>
      </main>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add trip detail page with packing checklist and weather summary"
```

---

### Task 11: Settings Pages — Item Library & Luggage Management

**Files:**

- Create: `app/settings/page.tsx`
- Create: `app/settings/items/page.tsx`
- Create: `app/settings/luggage/page.tsx`
- Modify: `components/Header.tsx` (add settings link)

**Step 1: Create settings index page**

Create `app/settings/page.tsx`:

```tsx
"use client";

import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Link href="/settings/items">
          <Card className="hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Item Library</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Manage your master list of items that can be packed
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/luggage">
          <Card className="hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Luggage</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Manage your bags and their transport compatibility
            </CardContent>
          </Card>
        </Link>
      </main>
    </div>
  );
}
```

**Step 2: Create item library management page**

Create `app/settings/items/page.tsx` — list all items with ability to add/remove:

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  "Clothing",
  "Toiletries",
  "Electronics",
  "Documents",
  "Accessories",
  "Health/Medicine",
  "Miscellaneous",
];

export default function ItemsSettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const items = useQuery(
    api.items.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const createItem = useMutation(api.items.create);
  const removeItem = useMutation(api.items.remove);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredItems =
    filterCategory === "all"
      ? items
      : items?.filter((i) => i.category === filterCategory);

  const handleAdd = async () => {
    if (!user || !newName || !newCategory) return;
    await createItem({
      userId: user._id,
      name: newName,
      category: newCategory,
      tripTypes: ["all"],
      weatherConditions: null,
      quantityRule: { type: "fixed", value: 1 },
    });
    setNewName("");
    setNewCategory("");
    setDialogOpen(false);
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Item Library</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={!newName || !newCategory}>
                  Add
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-muted-foreground text-sm">
          {filteredItems?.length ?? 0} items
        </p>

        <div className="space-y-1">
          {filteredItems?.map((item) => (
            <div
              key={item._id}
              className="bg-card flex items-center justify-between rounded-lg p-3"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <div className="mt-1 flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem({ id: item._id })}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

**Step 3: Create luggage management page**

Create `app/settings/luggage/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function LuggageSettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const luggageList = useQuery(
    api.luggage.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const createLuggage = useMutation(api.luggage.create);
  const removeLuggage = useMutation(api.luggage.remove);

  const [name, setName] = useState("");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [modes, setModes] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleMode = (mode: string) => {
    setModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    );
  };

  const handleAdd = async () => {
    if (!user || !name || modes.length === 0) return;
    await createLuggage({
      userId: user._id,
      name,
      transportModes: modes,
      size,
    });
    setName("");
    setSize("medium");
    setModes([]);
    setDialogOpen(false);
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Luggage</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Bag</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Luggage</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Blue carry-on"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select
                    value={size}
                    onValueChange={(v) =>
                      setSize(v as "small" | "medium" | "large")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Compatible transport</Label>
                  <div className="space-y-2">
                    {["plane", "train", "car"].map((mode) => (
                      <label
                        key={mode}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={modes.includes(mode)}
                          onCheckedChange={() => toggleMode(mode)}
                        />
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleAdd}
                  disabled={!name || modes.length === 0}
                >
                  Add
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(!luggageList || luggageList.length === 0) && (
          <p className="text-muted-foreground text-sm">
            No luggage added yet. Add your bags to get luggage suggestions when
            creating trips.
          </p>
        )}

        <div className="space-y-2">
          {luggageList?.map((bag) => (
            <div
              key={bag._id}
              className="bg-card flex items-center justify-between rounded-lg p-3"
            >
              <div>
                <p className="text-sm font-medium">{bag.name}</p>
                <div className="mt-1 flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {bag.size}
                  </Badge>
                  {bag.transportModes.map((mode) => (
                    <Badge key={mode} variant="outline" className="text-xs">
                      {mode}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeLuggage({ id: bag._id })}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

**Step 4: Add settings link to Header**

Update `components/Header.tsx` to include a gear icon link to settings:

```tsx
// Add to the Authenticated section, before UserButton:
<Link href="/settings" className="text-muted-foreground hover:text-foreground">
  Settings
</Link>
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add settings pages for item library and luggage management"
```

---

### Task 12: Mobile Polish & Final Styling

**Files:**

- Modify: `app/globals.css` (add mobile-optimized styles)
- Modify: `app/layout.tsx` (add viewport meta)
- Review and polish all components for mobile touch targets

**Step 1: Add viewport meta and mobile CSS**

Ensure `app/layout.tsx` has proper viewport meta (should be auto-included by Next.js, but verify).

Add to `app/globals.css` after the Tailwind import:

```css
@import "tailwindcss";

/* Mobile-first optimizations */
html {
  -webkit-tap-highlight-color: transparent;
}

body {
  overscroll-behavior: none;
}
```

**Step 2: Review touch targets**

Go through all interactive elements and ensure minimum 44px touch targets. The packing checklist items already use `p-3` which should be adequate. Verify buttons are at least `h-10` (ShadCN default).

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: mobile polish and touch-friendly styling"
```

---

### Task 13: Manual Testing & Bug Fixes

**Step 1: Start both servers**

```bash
# Terminal 1
npx convex dev

# Terminal 2
npm run dev
```

**Step 2: Test the full flow**

1. Visit `http://localhost:3000`
2. Sign in with Clerk
3. Verify home page shows "No trips yet"
4. Go to Settings > Luggage > Add a bag
5. Go to Settings > Item Library > verify 76 default items loaded
6. Create a new trip via the wizard
7. Verify weather loads and packing list is generated
8. Tap items to check them off
9. Mark trip as complete
10. Verify it appears in past trips

**Step 3: Fix any bugs found during testing**

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```

---

## Summary

| Task | Description                       | Key Files                                           |
| ---- | --------------------------------- | --------------------------------------------------- |
| 1    | Project scaffolding               | Next.js, Tailwind, ShadCN, deps                     |
| 2    | Convex schema & auth              | schema.ts, auth.config.ts, middleware, providers    |
| 3    | User management & seeding         | users.ts, defaultItems.ts, items.ts                 |
| 4    | Luggage CRUD                      | luggage.ts                                          |
| 5    | Weather & trip functions          | weather.ts, trips.ts, tripItems.ts                  |
| 6    | List generation logic             | generatePackingList.ts, suggestLuggage.ts           |
| 7    | Home page & auth UI               | page.tsx, Header, sign-in/sign-up                   |
| 8    | Wizard: destination & dates       | WizardShell, DestinationStep, DatesStep             |
| 9    | Wizard: type, transport, complete | TripTypeStep, TransportStep, new/page.tsx           |
| 10   | Trip detail & checklist           | [tripId]/page.tsx, PackingChecklist, WeatherSummary |
| 11   | Settings pages                    | items/page.tsx, luggage/page.tsx                    |
| 12   | Mobile polish                     | globals.css, touch targets                          |
| 13   | Manual testing                    | Full flow verification                              |

Tasks 1-2 must be sequential (project setup). Tasks 3-6 can be parallelized (backend functions + logic). Tasks 7-11 should be sequential (UI builds on prior work). Tasks 12-13 are final polish.
