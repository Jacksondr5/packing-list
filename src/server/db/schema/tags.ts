import { integer, text } from "drizzle-orm/pg-core";

import { createTable } from "../utils";

export const tags = createTable("tag", {
  id: integer("id").primaryKey(), // ID will be manually assigned during seeding
  name: text("name").notNull().unique(), // e.g., "Weather: Warm", "Trip Type: Business"
});

// Define relations if needed later in relations.ts
