import { integer, text } from "drizzle-orm/pg-core";

import { createTable } from "../utils";
import { categories } from "./categories";

export const items = createTable("item", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(), // User-defined item name
  userId: text("user_id").notNull(), // Link to the user (e.g., Clerk user ID)
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null", // Optional: Keep item if category is deleted
  }),
  // Assumes createTable handles createdAt, updatedAt
});

// Many-to-many relation with tags will be defined via a junction table in relations.ts
