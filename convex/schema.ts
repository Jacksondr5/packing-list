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
        temperature: v.optional(v.number()),
        direction: v.optional(v.union(v.literal("above"), v.literal("below"))),
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
