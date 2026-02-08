import { isRainCode, isSnowCode } from "./weatherCodes";

interface WeatherConditions {
  minTemp?: number;
  maxTemp?: number;
  rain?: boolean;
  snow?: boolean;
}

interface QuantityRule {
  type: "perDay" | "perNDays" | "fixed";
  value: number;
}

interface MasterItem {
  _id: string;
  name: string;
  category: string;
  tripTypes: string[];
  weatherConditions: WeatherConditions | null;
  quantityRule: QuantityRule;
}

interface DailyForecast {
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
  weather: { dailyForecasts: DailyForecast[] } | null;
}

interface GeneratedItem {
  itemName: string;
  category: string;
  quantity: number;
}

export function generatePackingList(
  masterItems: MasterItem[],
  trip: TripDetails
): GeneratedItem[] {
  const { tripType, tripDays, weather } = trip;

  // Compute weather summary across ALL forecast days
  let minHighTemp = Infinity;   // lowest high temp across all days
  let maxLowTemp = -Infinity;   // highest low temp across all days
  let hasRain = false;
  let hasSnow = false;

  if (weather?.dailyForecasts.length) {
    for (const day of weather.dailyForecasts) {
      if (day.highTemp < minHighTemp) minHighTemp = day.highTemp;
      if (day.lowTemp > maxLowTemp) maxLowTemp = day.lowTemp;
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

      // minTemp: suggest when forecast high is at or below this (cold gear)
      if (wc.minTemp !== undefined && minHighTemp <= wc.minTemp) {
        weatherMatch = true;
      }
      // maxTemp: suggest when forecast low is at or above this (warm gear)
      if (wc.maxTemp !== undefined && maxLowTemp >= wc.maxTemp) {
        weatherMatch = true;
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
