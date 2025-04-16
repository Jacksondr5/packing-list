import { integer, text } from "drizzle-orm/pg-core";

import { createTable } from "../utils";

export const luggage = createTable("luggage", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(), // e.g., "Red Carry-on"
  userId: text("user_id").notNull(), // Link to the user (e.g., Clerk user ID)
  capacityDays: integer("capacity_days").notNull(), // Max days supported
});

// Many-to-many relation with tags (for travel modes) will be defined via a junction table in relations.ts
