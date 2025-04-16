import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { items, itemsToTags } from "../../db/schema";
import { db } from "../../db";
import { TagIds, type TagId } from "~/lib/tags";
import type { Item } from "~/schemas";

// Input schemas for CRUD operations
const createItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  categoryId: z.number().int().nullable().optional(),
  tagIds: z.array(z.number().int()).refine(
    (ids) =>
      ids.every((id) =>
        Object.values(TagIds)
          .flat()
          .includes(id as TagId),
      ),
    { message: "One or more tag IDs are invalid" },
  ),
});

const updateItemSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, "Item name is required"),
  categoryId: z.number().int().nullable().optional(),
  tagIds: z.array(z.number().int()).refine(
    (ids) =>
      ids.every((id) =>
        Object.values(TagIds)
          .flat()
          .includes(id as TagId),
      ),
    { message: "One or more tag IDs are invalid" },
  ),
});

const deleteItemSchema = z.object({
  id: z.number().int(),
});

export const itemRouter = createTRPCRouter({
  // List all items for the authenticated user
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    // Get all items with their tag relations in a single query
    const userItemsWithTags = await db
      .select({
        item: items,
        tagId: itemsToTags.tagId,
      })
      .from(items)
      .leftJoin(itemsToTags, eq(items.id, itemsToTags.itemId))
      .where(eq(items.userId, userId));

    // Group the results by item
    const groupedItems = new Map<number, Item>();

    for (const row of userItemsWithTags) {
      const { item, tagId } = row;

      if (!groupedItems.has(item.id)) {
        groupedItems.set(item.id, {
          ...item,
          tagIds: [],
        });
      }

      if (tagId !== null) {
        groupedItems.get(item.id)!.tagIds.push(tagId);
      }
    }

    return Array.from(groupedItems.values());
  }),

  // Create a new item
  create: protectedProcedure
    .input(createItemSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Start a transaction
      return await db.transaction(async (tx) => {
        // 1. Create the item
        const [createdItem] = await tx
          .insert(items)
          .values({
            name: input.name,
            userId: userId,
            categoryId: input.categoryId,
          })
          .returning();

        if (!createdItem) {
          throw new Error("Failed to create item");
        }

        // 2. Create tag associations
        if (input.tagIds.length > 0) {
          await tx.insert(itemsToTags).values(
            input.tagIds.map((tagId) => ({
              itemId: createdItem.id,
              tagId,
            })),
          );
        }

        // 3. Return created item with tags
        return {
          ...createdItem,
          tagIds: input.tagIds,
        };
      });
    }),

  // Update an existing item
  update: protectedProcedure
    .input(updateItemSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      return await db.transaction(async (tx) => {
        // 1. Update the item (ensuring it belongs to the user)
        const [updatedItem] = await tx
          .update(items)
          .set({
            name: input.name,
            categoryId: input.categoryId,
          })
          .where(and(eq(items.id, input.id), eq(items.userId, userId)))
          .returning();

        if (!updatedItem) {
          throw new Error("Item not found or doesn't belong to this user");
        }

        // 2. Delete existing tag associations
        await tx
          .delete(itemsToTags)
          .where(eq(itemsToTags.itemId, updatedItem.id));

        // 3. Create new tag associations
        if (input.tagIds.length > 0) {
          await tx.insert(itemsToTags).values(
            input.tagIds.map((tagId) => ({
              itemId: updatedItem.id,
              tagId,
            })),
          );
        }

        // 4. Return updated item with tags
        return {
          ...updatedItem,
          tagIds: input.tagIds,
        };
      });
    }),

  // Delete an item
  delete: protectedProcedure
    .input(deleteItemSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Delete the item (ensuring it belongs to the user)
      // No need to delete junction table entries due to ON DELETE CASCADE constraint
      await db
        .delete(items)
        .where(and(eq(items.id, input.id), eq(items.userId, userId)));

      // Return void to indicate success
      return;
    }),
});
