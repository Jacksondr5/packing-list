import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { luggage, luggageToTravelModeTags } from "../../db/schema";
import { db } from "../../db";
import { isTravelModeTagId } from "~/lib/tags";

// Input schemas for CRUD operations
const createLuggageSchema = z.object({
  name: z.string().min(1, "Luggage name is required"),
  capacityDays: z.number().int().min(1, "Capacity must be at least 1 day"),
  travelModeTagIds: z
    .array(z.number().int())
    .refine((ids) => ids.every((id) => isTravelModeTagId(id)), {
      message: "One or more travel mode tag IDs are invalid",
    }),
});

const updateLuggageSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, "Luggage name is required"),
  capacityDays: z.number().int().min(1, "Capacity must be at least 1 day"),
  travelModeTagIds: z
    .array(z.number().int())
    .refine((ids) => ids.every((id) => isTravelModeTagId(id)), {
      message: "One or more travel mode tag IDs are invalid",
    }),
});

const deleteLuggageSchema = z.object({
  id: z.number().int(),
});

// Define type for luggage with tags
type LuggageWithTags = typeof luggage.$inferSelect & {
  travelModeTagIds: number[];
};

export const luggageRouter = createTRPCRouter({
  // List all luggage for the authenticated user
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    // Get all luggage with their travel mode tag relations in a single query
    const userLuggageWithTags = await db
      .select({
        luggageItem: luggage,
        tagId: luggageToTravelModeTags.tagId,
      })
      .from(luggage)
      .leftJoin(
        luggageToTravelModeTags,
        eq(luggage.id, luggageToTravelModeTags.luggageId),
      )
      .where(eq(luggage.userId, userId));

    // Group the results by luggage item
    const groupedLuggage = new Map<number, LuggageWithTags>();

    for (const row of userLuggageWithTags) {
      const { luggageItem, tagId } = row;

      if (!groupedLuggage.has(luggageItem.id)) {
        groupedLuggage.set(luggageItem.id, {
          ...luggageItem,
          travelModeTagIds: [],
        });
      }

      if (tagId !== null) {
        const luggage = groupedLuggage.get(luggageItem.id);
        if (luggage) {
          luggage.travelModeTagIds.push(tagId);
        }
      }
    }

    return Array.from(groupedLuggage.values());
  }),

  // Create a new luggage item
  create: protectedProcedure
    .input(createLuggageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Start a transaction
      return await db.transaction(async (tx) => {
        // 1. Create the luggage
        const [createdLuggage] = await tx
          .insert(luggage)
          .values({
            name: input.name,
            userId: userId,
            capacityDays: input.capacityDays,
          })
          .returning();

        if (!createdLuggage) {
          throw new Error("Failed to create luggage");
        }

        // 2. Create travel mode tag associations
        await tx.insert(luggageToTravelModeTags).values(
          input.travelModeTagIds.map((tagId) => ({
            luggageId: createdLuggage.id,
            tagId,
          })),
        );

        // 3. Return created luggage with tags
        return {
          ...createdLuggage,
          travelModeTagIds: input.travelModeTagIds,
        } as LuggageWithTags;
      });
    }),

  // Update an existing luggage item
  update: protectedProcedure
    .input(updateLuggageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      return await db.transaction(async (tx) => {
        // 1. Update the luggage (ensuring it belongs to the user)
        const [updatedLuggage] = await tx
          .update(luggage)
          .set({
            name: input.name,
            capacityDays: input.capacityDays,
          })
          .where(and(eq(luggage.id, input.id), eq(luggage.userId, userId)))
          .returning();

        if (!updatedLuggage) {
          throw new Error("Luggage not found or doesn't belong to this user");
        }

        // 2. Delete existing travel mode tag associations
        await tx
          .delete(luggageToTravelModeTags)
          .where(eq(luggageToTravelModeTags.luggageId, updatedLuggage.id));

        // 3. Create new travel mode tag associations
        await tx.insert(luggageToTravelModeTags).values(
          input.travelModeTagIds.map((tagId) => ({
            luggageId: updatedLuggage.id,
            tagId,
          })),
        );

        // 4. Return updated luggage with tags
        return {
          ...updatedLuggage,
          travelModeTagIds: input.travelModeTagIds,
        } as LuggageWithTags;
      });
    }),

  // Delete a luggage item
  delete: protectedProcedure
    .input(deleteLuggageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Delete the luggage (ensuring it belongs to the user)
      // No need to delete junction table entries due to ON DELETE CASCADE constraint
      await db
        .delete(luggage)
        .where(and(eq(luggage.id, input.id), eq(luggage.userId, userId)));

      // Return void to indicate success
      return;
    }),
});
