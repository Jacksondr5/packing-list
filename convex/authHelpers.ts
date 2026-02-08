import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Authenticate the current user and return their user document.
 * Throws if no identity is found or no matching user exists.
 */
export async function authenticateUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new Error("User not found");

  return user;
}

/**
 * Verify that the given userId belongs to the authenticated user.
 * Returns the user document on success.
 */
export async function verifyUserOwnership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"users">> {
  const user = await authenticateUser(ctx);
  if (user._id !== userId) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Verify that the authenticated user owns a trip.
 * Returns both the user and trip documents on success.
 */
export async function verifyTripOwnership(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trips">
): Promise<{ user: Doc<"users">; trip: Doc<"trips"> }> {
  const user = await authenticateUser(ctx);
  const trip = await ctx.db.get("trips", tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.userId !== user._id) {
    throw new Error("Unauthorized");
  }
  return { user, trip };
}
