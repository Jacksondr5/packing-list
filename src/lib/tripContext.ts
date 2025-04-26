import type { WeatherTagId, TripTypeTagId, TravelModeTagId } from "./tags";

// Define the input context for the trip
export type TripContext = {
  tripWeatherForecast: WeatherTagId[];
  tripTypeTagId: TripTypeTagId;
  travelModeTagId: TravelModeTagId;
};
