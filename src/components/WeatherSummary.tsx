import { getWeatherIconFromCode } from "@/lib/weatherIcons";

interface DailyForecast {
  date: string;
  highTemp: number;
  lowTemp: number;
  precipProbability: number;
  weatherCode: number;
  condition: string;
}

interface WeatherSummaryProps {
  forecasts: DailyForecast[];
}

export default function WeatherSummary({ forecasts }: WeatherSummaryProps) {
  if (forecasts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Weather</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {forecasts.map((day) => {
          const WeatherIcon = getWeatherIconFromCode(day.weatherCode);

          return (
            <div
              key={day.date}
              className="flex min-w-[80px] flex-col items-center rounded-lg border p-2 text-center text-xs"
            >
              <span className="font-medium">
                {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <WeatherIcon
                className="mt-1 size-4 text-muted-foreground"
                aria-label={day.condition}
              />
              <span className="text-muted-foreground">{day.condition}</span>
              <span>
                {Math.round(day.highTemp)}° / {Math.round(day.lowTemp)}°
              </span>
              {day.precipProbability > 0 && (
                <span className="text-info-foreground">
                  {day.precipProbability}% rain
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
