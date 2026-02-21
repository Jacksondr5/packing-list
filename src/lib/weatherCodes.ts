const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export const WEATHER_CODE_CATEGORIES: {
  clear: readonly number[];
  cloudy: readonly number[];
  fog: readonly number[];
  rain: readonly number[];
  snow: readonly number[];
  thunderstorm: readonly number[];
} = {
  clear: [0],
  cloudy: [1, 2, 3],
  fog: [45, 48],
  rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  snow: [71, 73, 75, 77, 85, 86],
  thunderstorm: [95, 96, 99],
};

export function getConditionFromCode(code: number): string {
  return WMO_CODES[code] ?? "Unknown";
}

export function isRainCode(code: number): boolean {
  return (
    WEATHER_CODE_CATEGORIES.rain.includes(code) ||
    WEATHER_CODE_CATEGORIES.thunderstorm.includes(code)
  );
}

export function isSnowCode(code: number): boolean {
  return WEATHER_CODE_CATEGORIES.snow.includes(code);
}
