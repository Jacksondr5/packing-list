import { createTRPCRouter, publicProcedure } from "../trpc";
import { categories } from "../../db/schema";
import { db } from "../../db";

export const categoryRouter = createTRPCRouter({
  // List all available categories
  list: publicProcedure.query(async () => {
    return await db.select().from(categories);
  }),
});
