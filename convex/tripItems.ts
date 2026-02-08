import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authenticateUser, verifyTripOwnership } from "./authHelpers";

export const listByTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await verifyTripOwnership(ctx, args.tripId);
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
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify ownership of all referenced trips
    const user = await authenticateUser(ctx);
    const verifiedTrips = new Set<string>();
    for (const item of args.items) {
      const tripIdStr = item.tripId as string;
      if (!verifiedTrips.has(tripIdStr)) {
        const trip = await ctx.db.get("trips", item.tripId);
        if (!trip) throw new Error("Trip not found");
        if (trip.userId !== user._id) throw new Error("Unauthorized");
        verifiedTrips.add(tripIdStr);
      }
    }

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
    const user = await authenticateUser(ctx);
    const item = await ctx.db.get("tripItems", args.id);
    if (!item) throw new Error("Trip item not found");
    const trip = await ctx.db.get("trips", item.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch("tripItems", args.id, { packed: !item.packed });
  },
});

export const updateQuantity = mutation({
  args: { id: v.id("tripItems"), quantity: v.number() },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);
    const item = await ctx.db.get("tripItems", args.id);
    if (!item) throw new Error("Trip item not found");
    const trip = await ctx.db.get("trips", item.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch("tripItems", args.id, { quantity: args.quantity });
  },
});

export const remove = mutation({
  args: { id: v.id("tripItems") },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);
    const item = await ctx.db.get("tripItems", args.id);
    if (!item) throw new Error("Trip item not found");
    const trip = await ctx.db.get("trips", item.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.userId !== user._id) throw new Error("Unauthorized");

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
    await verifyTripOwnership(ctx, args.tripId);
    return await ctx.db.insert("tripItems", {
      ...args,
      packed: false,
    });
  },
});
