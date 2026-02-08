import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { verifyUserOwnership, verifyTripOwnership } from "./authHelpers";

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
      })
    ),
    fetchedAt: v.number(),
  }),
  v.null()
);

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await verifyUserOwnership(ctx, args.userId);
    return await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getById = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await verifyTripOwnership(ctx, args.tripId);
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
    await verifyUserOwnership(ctx, args.userId);
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
    await verifyTripOwnership(ctx, args.tripId);
    await ctx.db.patch("trips", args.tripId, { weather: args.weather });
  },
});

export const updateLuggage = mutation({
  args: {
    tripId: v.id("trips"),
    selectedLuggage: v.array(v.id("luggage")),
  },
  handler: async (ctx, args) => {
    await verifyTripOwnership(ctx, args.tripId);
    await ctx.db.patch("trips", args.tripId, {
      selectedLuggage: args.selectedLuggage,
    });
  },
});

export const deleteTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await verifyTripOwnership(ctx, args.tripId);
    await ctx.db.delete(args.tripId);
  },
});

export const updateStatus = mutation({
  args: {
    tripId: v.id("trips"),
    status: v.union(
      v.literal("planning"),
      v.literal("packing"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    await verifyTripOwnership(ctx, args.tripId);
    await ctx.db.patch("trips", args.tripId, { status: args.status });
  },
});
