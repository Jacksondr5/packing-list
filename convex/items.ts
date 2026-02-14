import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authenticateUser, verifyUserOwnership } from "./authHelpers";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await verifyUserOwnership(ctx, args.userId);
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
  },
  handler: async (ctx, args) => {
    await verifyUserOwnership(ctx, args.userId);
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
          temperature: v.optional(v.number()),
          direction: v.optional(v.union(v.literal("above"), v.literal("below"))),
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
    const user = await authenticateUser(ctx);
    const item = await ctx.db.get("items", args.id);
    if (!item) throw new Error("Item not found");
    if (item.userId !== user._id) throw new Error("Unauthorized");

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
    const user = await authenticateUser(ctx);
    const item = await ctx.db.get("items", args.id);
    if (!item) throw new Error("Item not found");
    if (item.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete("items", args.id);
  },
});
