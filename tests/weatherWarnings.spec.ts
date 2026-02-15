import { describe, expect, it } from "vitest";
import { getTripWeatherWarning } from "../src/lib/weatherWarnings";

describe("getTripWeatherWarning", () => {
  it("returns a warning when weather is unavailable", () => {
    expect(getTripWeatherWarning(null)).toBe(
      "Unable to fetch weather for this trip. Weather-conditional items were skipped when generating this list.",
    );
  });

  it("returns null when weather data exists", () => {
    expect(getTripWeatherWarning({ dailyForecasts: [] })).toBeNull();
  });
});
