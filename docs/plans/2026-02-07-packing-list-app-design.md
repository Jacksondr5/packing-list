# Packing List App — Design Document

## Problem

Packing for trips is cognitively heavy. You have to remember everything you might need, figure out quantities based on trip length, check the weather, consider your transport mode, and pick the right luggage. Today this is a manual process with a flat checklist and lots of mental math.

## Solution

A mobile-first web app that generates smart, personalized packing lists. Answer a few questions about your trip, and the app produces a weather-aware, quantity-calculated checklist you can tap through as you pack.

## Tech Stack

- **Next.js** — app framework (mobile-first web app)
- **Convex** — real-time backend and database
- **Clerk** — authentication (email/password, Google)
- **Tailwind** — utility-first CSS
- **ShadCN** — UI component library
- **Open-Meteo** — free weather API (no API key required)

---

## Core Features

### 1. Trip Wizard

The main entry point for creating a new trip. A short, step-by-step flow:

1. **Destination** — city/region (used for weather lookup)
2. **Dates** — departure and return (calculates trip length)
3. **Trip type** — select from presets: Business, Vacation/Beach, Camping/Outdoors, City Break, etc.
4. **Transport mode** — Plane, Train, Car

From these inputs, the app:

- Fetches the weather forecast from Open-Meteo for the destination across travel dates
- Filters the master item library by trip type and weather conditions
- Calculates item quantities based on trip length
- Suggests luggage based on trip length, item count, and transport compatibility
- Generates a categorized checklist

The user reviews and adjusts the list (add/remove items, change quantities, change luggage) before starting to pack.

If the trip is too far out for a weather forecast (~7 days), the app shows "Weather forecast not yet available" with the option to refresh later.

### 2. Master Item Library

A personal catalog of everything the user might ever pack. Each item has:

- **Name** — e.g., "Rain jacket", "Phone charger"
- **Category** — Clothing, Toiletries, Electronics, Documents, etc.
- **Trip type tags** — which trip types this item is relevant for (e.g., "Suit" = Business only, "Sunscreen" = Vacation + Camping)
- **Weather conditions** — when to suggest this item:
  - Temperature thresholds (e.g., heavy coat when below 50°F, shorts when above 80°F)
  - Precipitation (e.g., rain jacket when rain probability is high)
- **Quantity rule** — how to calculate count per trip:
  - "1 per day" (shirts, underwear, socks)
  - "1 per N days" (pants = 1 per 2 days)
  - "fixed" (toothbrush = always 1, laptop = always 1)

The app ships with a sensible default library. Users customize it over time — add, remove, or adjust items and rules. The library persists across trips.

### 3. Luggage System

Tracks the user's bag inventory:

- **Name** — e.g., "Blue carry-on", "Big hiking backpack"
- **Transport compatibility** — which modes the bag works with (Plane, Train, Car)
- **Relative size** — Small, Medium, Large

When the wizard generates a trip, it:

1. Filters to bags compatible with the selected transport mode
2. Estimates volume based on item count and trip length
3. Recommends one or more bags
4. Flags a gentle warning if the selected bag seems too small

Users can override suggestions and pick different bags.

### 4. Packing Checklist

The core packing experience — a clean, categorized, mobile-optimized checklist:

- Items grouped by category (Clothing, Toiletries, Electronics, etc.)
- Each item shows name and quantity (e.g., "Shirts x 5")
- Tap to mark packed — checkmark, visual dim/move down
- Category progress (e.g., "Clothing 3/8")
- Overall progress bar/count (e.g., "12 of 25 items packed")
- Tap again to uncheck
- Big tap targets, one-handed use, minimal interaction

### 5. Weather Display

The trip summary shows a weather overview for the travel dates:

- Daily high/low temperatures
- Precipitation probability
- General conditions (sunny, cloudy, rain, snow)
- Refreshable as the trip date approaches (forecasts improve closer to departure)

Weather data drives list generation — temperature thresholds and precipitation probability determine which weather-conditional items appear.

### 6. Trip History

Past trips are stored with:

- Trip details (destination, dates, type, transport)
- The full generated list
- Which items were packed (checked off)

Users can browse past trips for reference. Completed trips are read-only.

---

## Data Model (Convex)

### Users

Managed by Clerk. Convex stores a user record linked to the Clerk user ID.

### Items (Master Library)

```
items {
  userId: Id<"users">
  name: string
  category: string
  tripTypes: string[]           // ["business", "vacation", "camping", ...]
  weatherConditions: {
    minTemp?: number            // suggest when forecast high <= this (°F)
    maxTemp?: number            // suggest when forecast low >= this (°F)
    rain?: boolean              // suggest when rain probability is high
    snow?: boolean              // suggest when snow is forecast
  }
  quantityRule: {
    type: "perDay" | "perNDays" | "fixed"
    value: number               // 1 for perDay, N for perNDays, count for fixed
  }
}
```

### Luggage

```
luggage {
  userId: Id<"users">
  name: string
  transportModes: string[]      // ["plane", "train", "car"]
  size: "small" | "medium" | "large"
}
```

### Trips

```
trips {
  userId: Id<"users">
  destination: string
  departureDate: string
  returnDate: string
  tripType: string
  transportMode: string
  suggestedLuggage: Id<"luggage">[]
  selectedLuggage: Id<"luggage">[]
  weather: {
    dailyForecasts: {
      date: string
      highTemp: number
      lowTemp: number
      precipProbability: number
      condition: string
    }[]
    fetchedAt: string
  }
  status: "planning" | "packing" | "completed"
}
```

### Trip Items

```
tripItems {
  tripId: Id<"trips">
  itemName: string
  category: string
  quantity: number
  packed: boolean
}
```

---

## UX Flow

```
Login (Clerk)
  |
  v
Home Screen
  ├── "New Trip" button --> Trip Wizard
  ├── Active trips list --> Packing Checklist
  └── Past trips list --> Read-only trip view

Trip Wizard (step-by-step):
  Destination -> Dates -> Trip Type -> Transport Mode
  |
  v
  [App fetches weather, generates list, suggests luggage]
  |
  v
Review Screen:
  - Weather summary
  - Suggested luggage (editable)
  - Generated item list by category (add/remove/adjust quantities)
  - "Start Packing" button
  |
  v
Packing Checklist:
  - Tap items to check off
  - Progress tracking
  - "Done Packing" to complete trip

Settings / Library Management:
  - Edit master item library
  - Edit luggage inventory
```

---

## Scope

### In v1

- Trip wizard (destination, dates, type, transport)
- Weather-driven list generation via Open-Meteo
- Master item library with sensible defaults
- Quantity calculation by trip length
- Luggage suggestions with transport filtering
- Categorized packing checklist with tap-to-pack
- Trip history (read-only past trips)
- Auth via Clerk
- Mobile-first responsive design

### Not in v1

- Offline mode
- Sharing / multi-user trips
- Unpack checklist for return trips
- Strict luggage capacity enforcement (weight/volume)
- Historical weather averages for far-out trips
- Native mobile app (it's a web app)
