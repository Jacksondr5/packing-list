import { getWeatherIconFromCode } from "@/lib/weatherIcons";
import type { DailyForecast } from "@/lib/generatePackingList";
import { cn } from "@/lib/utils";

interface WeatherSummaryProps {
  forecasts: DailyForecast[];
}

function getWeatherGradient(weatherCode: number): string {
  if (weatherCode === 0) return "from-amber-900/20 to-transparent";
  if (weatherCode <= 3) return "from-slate-700/20 to-transparent";
  if (weatherCode <= 48) return "from-slate-600/20 to-transparent";
  if (weatherCode <= 67) return "from-blue-900/20 to-transparent";
  if (weatherCode <= 77) return "from-sky-900/20 to-transparent";
  if (weatherCode <= 82) return "from-blue-800/20 to-transparent";
  return "from-purple-900/20 to-transparent";
}

export default function WeatherSummary({ forecasts }: WeatherSummaryProps) {
  if (forecasts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Weather Forecast
      </h3>
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2">
        {forecasts.map((day) => {
          const WeatherIcon = getWeatherIconFromCode(day.weatherCode);

          return (
            <div
              key={day.date}
              className={cn(
                "flex min-w-[88px] snap-start flex-col items-center rounded-xl border border-border/50 bg-linear-to-b p-3 text-center",
                getWeatherGradient(day.weatherCode),
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </span>
              <WeatherIcon
                className="mt-1.5 size-5 text-foreground/70"
                aria-label={day.condition}
              />
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-sm font-semibold">
                  {Math.round(day.highTemp)}°
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(day.lowTemp)}°
                </span>
              </div>
              {day.precipProbability > 0 && (
                <span className="mt-1 text-[10px] text-info-foreground">
                  {day.precipProbability}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
