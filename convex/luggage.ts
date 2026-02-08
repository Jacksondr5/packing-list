import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authenticateUser, verifyUserOwnership } from "./authHelpers";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await verifyUserOwnership(ctx, args.userId);
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
    await verifyUserOwnership(ctx, args.userId);
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
    const user = await authenticateUser(ctx);
    const bag = await ctx.db.get("luggage", args.id);
    if (!bag) throw new Error("Luggage not found");
    if (bag.userId !== user._id) throw new Error("Unauthorized");

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
    const user = await authenticateUser(ctx);
    const bag = await ctx.db.get("luggage", args.id);
    if (!bag) throw new Error("Luggage not found");
    if (bag.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete("luggage", args.id);
  },
});
