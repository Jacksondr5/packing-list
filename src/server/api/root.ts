import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { tagRouter } from "./routers/tag";
import { categoryRouter } from "./routers/category";
import { itemRouter } from "./routers/item";
import { luggageRouter } from "./routers/luggage";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  tag: tagRouter,
  category: categoryRouter,
  item: itemRouter,
  luggage: luggageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
