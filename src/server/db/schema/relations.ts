import { relations } from "drizzle-orm";
import { integer, primaryKey } from "drizzle-orm/pg-core";

import { createTable } from "../utils";
import { items } from "./items";
import { tags } from "./tags";
import { categories } from "./categories";
import { luggage } from "./luggage";

// Junction table for Items and Tags (Many-to-Many)
export const itemsToTags = createTable(
  "items_to_tags",
  {
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.tagId] })],
);

// Junction table for Luggage and Tags (Many-to-Many for Travel Modes)
export const luggageToTravelModeTags = createTable(
  "luggage_to_travel_mode_tags",
  {
    luggageId: integer("luggage_id")
      .notNull()
      .references(() => luggage.id, { onDelete: "cascade" }),
    tagId: integer("tag_id") // Assuming travel modes are also stored in the tags table
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.luggageId, t.tagId] })],
);

// Relations definitions

export const categoryRelations = relations(categories, ({ many }) => ({
  items: many(items),
}));

export const itemRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  itemsToTags: many(itemsToTags),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  itemsToTags: many(itemsToTags),
  luggageToTravelModeTags: many(luggageToTravelModeTags),
}));

export const luggageRelations = relations(luggage, ({ many }) => ({
  luggageToTravelModeTags: many(luggageToTravelModeTags),
}));

export const itemsToTagsRelations = relations(itemsToTags, ({ one }) => ({
  item: one(items, {
    fields: [itemsToTags.itemId],
    references: [items.id],
  }),
  tag: one(tags, {
    fields: [itemsToTags.tagId],
    references: [tags.id],
  }),
}));

export const luggageToTravelModeTagsRelations = relations(
  luggageToTravelModeTags,
  ({ one }) => ({
    luggage: one(luggage, {
      fields: [luggageToTravelModeTags.luggageId],
      references: [luggage.id],
    }),
    tag: one(tags, {
      fields: [luggageToTravelModeTags.tagId],
      references: [tags.id],
    }),
  }),
);
