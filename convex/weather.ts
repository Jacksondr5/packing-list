import { action } from "./_generated/server";
import { v } from "convex/values";

export const geocodeCity = action({
  args: { cityName: v.string() },
  handler: async (_ctx, args) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.cityName)}&count=5&language=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    const data = await response.json();
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
    return await response.json();
  },
});
