import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { WEATHER_CODE_CATEGORIES } from "./weatherCodes";

export function getWeatherIconFromCode(code: number): LucideIcon {
  if (WEATHER_CODE_CATEGORIES.clear.includes(code)) return Sun;
  if (WEATHER_CODE_CATEGORIES.cloudy.includes(code)) return Cloud;
  if (WEATHER_CODE_CATEGORIES.fog.includes(code)) return CloudFog;
  if (WEATHER_CODE_CATEGORIES.rain.includes(code)) return CloudRain;
  if (WEATHER_CODE_CATEGORIES.snow.includes(code)) return CloudSnow;
  if (WEATHER_CODE_CATEGORIES.thunderstorm.includes(code)) return CloudLightning;

  return Cloud;
}
