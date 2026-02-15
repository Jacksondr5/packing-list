import { isRainCode, isSnowCode } from "./weatherCodes";

interface WeatherConditions {
  temperature?: number;
  direction?: "above" | "below";
  rain?: boolean;
  snow?: boolean;
}

interface QuantityRule {
  type: "perDay" | "perNDays" | "fixed";
  value: number;
}

export interface MasterItem {
  name: string;
  category: string;
  tripTypes: string[];
  weatherConditions: WeatherConditions | null;
  quantityRule: QuantityRule;
}

export interface DailyForecast {
  date: string;
  highTemp: number;
  lowTemp: number;
  precipProbability: number;
  snowfall: number;
  weatherCode: number;
  condition: string;
}

interface TripDetails {
  tripType: string;
  tripDays: number;
  weather: { dailyForecasts: DailyForecast[]; fetchedAt?: number } | null;
}

interface GeneratedItem {
  itemName: string;
  category: string;
  quantity: number;
}

export function generatePackingList(
  masterItems: MasterItem[],
  trip: TripDetails,
): GeneratedItem[] {
  const { tripType, tripDays, weather } = trip;

  let hasRain = false;
  let hasSnow = false;
  const dailyForecasts = weather?.dailyForecasts ?? [];

  if (dailyForecasts.length) {
    for (const day of dailyForecasts) {
      if (day.precipProbability > 40) hasRain = true;
      if (isRainCode(day.weatherCode)) hasRain = true;
      if (day.snowfall > 0) hasSnow = true;
      if (isSnowCode(day.weatherCode)) hasSnow = true;
    }
  }

  const result: GeneratedItem[] = [];

  for (const item of masterItems) {
    // 1. Filter by trip type
    if (!item.tripTypes.includes("all") && !item.tripTypes.includes(tripType)) {
      continue;
    }

    // 2. Filter by weather conditions
    if (item.weatherConditions) {
      if (!weather) {
        // No weather data — skip weather-conditional items
        continue;
      }

      const wc = item.weatherConditions;
      let weatherMatch = false;

      if (wc.temperature !== undefined && wc.direction !== undefined) {
        const threshold = wc.temperature;
        weatherMatch = dailyForecasts.some((day) =>
          wc.direction === "above"
            ? day.highTemp >= threshold || day.lowTemp >= threshold
            : day.highTemp <= threshold || day.lowTemp <= threshold,
        );
      }
      if (wc.rain && hasRain) weatherMatch = true;
      if (wc.snow && hasSnow) weatherMatch = true;

      if (!weatherMatch) continue;
    }

    // 3. Calculate quantity
    if (tripDays <= 0) {
      throw new Error("tripDays must be > 0");
    }
    if (item.quantityRule.value <= 0) {
      throw new Error("quantityRule.value must be > 0");
    }
    let quantity: number;
    switch (item.quantityRule.type) {
      case "perDay":
        quantity = tripDays * item.quantityRule.value;
        break;
      case "perNDays":
        quantity = Math.max(1, Math.ceil(tripDays / item.quantityRule.value));
        break;
      case "fixed":
        quantity = item.quantityRule.value;
        break;
    }

    result.push({
      itemName: item.name,
      category: item.category,
      quantity,
    });
  }

  return result;
}
