import { z } from "zod";

import { PackingListItemSchema } from "./items";

/**
 * Represents the currently active packing list stored in the browser's local storage.
 */
export const CurrentPackingListSchema = z.object({
  tripDetails: z.object({
    destination: z.string().min(1),
    startDate: z.date(),
    endDate: z.date(),
    tripTypeTagId: z.number().int(), // Reference to Tag.id
    travelModeTagId: z.number().int(), // Reference to Tag.id
    // Assuming dailyWeatherTagIds array length matches trip duration requires custom validation logic outside the basic schema
    dailyWeatherTagIds: z.array(z.number().int()),
  }),
  suggestedLuggageIds: z.array(z.number().int()), // List of Luggage.id
  items: z.array(PackingListItemSchema), // The list of items to be packed
});

export type CurrentPackingList = z.infer<typeof CurrentPackingListSchema>;
