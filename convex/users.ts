import { mutation, query } from "./_generated/server";
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
