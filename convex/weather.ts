import { action } from "./_generated/server";
import { v } from "convex/values";

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  snowfall_sum: number[];
  weather_code: number[];
}

interface ForecastResponse {
  daily: ForecastDaily;
}

export const geocodeCity = action({
  args: { cityName: v.string() },
  handler: async (_ctx, args) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.cityName)}&count=5&language=en`,
      { signal: controller.signal }
    );
<<<<<<< HEAD
    const data: GeocodingResponse = await response.json();
=======
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    const data = await response.json();
>>>>>>> 71b6377bd1a07132fa9d4380cfcf73761a045b67
    return data.results ?? [];
  },
});

export const fetchForecast = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (_ctx, args) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(args.latitude));
    url.searchParams.set("longitude", String(args.longitude));
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum,weather_code"
    );
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("start_date", args.startDate);
    url.searchParams.set("end_date", args.endDate);

    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    const data: ForecastResponse = await response.json();
    return data;
  },
});
