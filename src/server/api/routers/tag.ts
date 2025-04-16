import { createTRPCRouter, publicProcedure } from "../trpc";
import { tags } from "../../db/schema";
import { db } from "../../db";

export const tagRouter = createTRPCRouter({
  // List all predefined tags - this can be public since tags are global
  list: publicProcedure.query(async () => {
    const allTags = await db.select().from(tags);
    return allTags;
  }),
});
