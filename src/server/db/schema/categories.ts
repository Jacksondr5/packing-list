import { integer, text } from "drizzle-orm/pg-core";

import { createTable } from "../utils";

export const categories = createTable("category", {
  id: integer("id").primaryKey(), // ID will be manually assigned during seeding
  name: text("name").notNull().unique(), // e.g., "Clothing", "Toiletries"
});

// Define relations if needed later in relations.ts
