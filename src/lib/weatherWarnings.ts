interface TripWeather {
  dailyForecasts: unknown[];
  fetchedAt?: number;
}

export function getTripWeatherWarning(weather: TripWeather | null): string | null {
  if (weather) return null;

  return "Unable to fetch weather for this trip. Weather-conditional items were skipped when generating this list.";
}
