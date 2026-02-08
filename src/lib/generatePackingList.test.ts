import { describe, it, expect } from "vitest";
import {
  generatePackingList,
  type MasterItem,
  type DailyForecast,
} from "./generatePackingList";

// --- Factory helpers ---

function makeForecast(overrides: Partial<DailyForecast> = {}): DailyForecast {
  return {
    date: "2025-07-01",
    highTemp: 25,
    lowTemp: 15,
    precipProbability: 0,
    snowfall: 0,
    weatherCode: 0,
    condition: "Clear sky",
    ...overrides,
  };
}

function makeItem(overrides: Partial<MasterItem> = {}): MasterItem {
  return {
    name: "Test Item",
    category: "General",
    tripTypes: ["all"],
    weatherConditions: null,
    quantityRule: { type: "fixed", value: 1 },
    ...overrides,
  };
}

function makeTrip(
  overrides: Partial<{
    tripType: string;
    tripDays: number;
    weather: { dailyForecasts: DailyForecast[]; fetchedAt?: number } | null;
  }> = {},
) {
  return {
    tripType: "vacation",
    tripDays: 3,
    weather: { dailyForecasts: [makeForecast()] },
    ...overrides,
  };
}

// --- Trip type filtering ---

describe("trip type filtering", () => {
  it('includes items with "all" tripType', () => {
    const items = [makeItem({ name: "Universal", tripTypes: ["all"] })];
    const result = generatePackingList(items, makeTrip());
    expect(result).toHaveLength(1);
    expect(result[0].itemName).toBe("Universal");
  });

  it("includes items matching the specific tripType", () => {
    const items = [makeItem({ name: "Beach Towel", tripTypes: ["beach"] })];
    const result = generatePackingList(items, makeTrip({ tripType: "beach" }));
    expect(result).toHaveLength(1);
    expect(result[0].itemName).toBe("Beach Towel");
  });

  it("excludes items with a non-matching tripType", () => {
    const items = [makeItem({ name: "Beach Towel", tripTypes: ["beach"] })];
    const result = generatePackingList(items, makeTrip({ tripType: "business" }));
    expect(result).toHaveLength(0);
  });

  it("handles items with multiple tripTypes", () => {
    const items = [
      makeItem({ name: "Versatile", tripTypes: ["beach", "camping"] }),
    ];
    const result = generatePackingList(items, makeTrip({ tripType: "camping" }));
    expect(result).toHaveLength(1);
    expect(result[0].itemName).toBe("Versatile");
  });
});

// --- Weather condition filtering ---

describe("weather condition filtering", () => {
  it("skips weather-conditional items when weather is null", () => {
    const items = [
      makeItem({
        name: "Umbrella",
        weatherConditions: { rain: true },
      }),
    ];
    const result = generatePackingList(items, makeTrip({ weather: null }));
    expect(result).toHaveLength(0);
  });

  it("includes non-weather items regardless of weather data", () => {
    const items = [makeItem({ name: "Socks", weatherConditions: null })];
    const result = generatePackingList(items, makeTrip({ weather: null }));
    expect(result).toHaveLength(1);
  });

  it("includes cold gear when forecast high <= minTemp threshold", () => {
    const items = [
      makeItem({
        name: "Winter Jacket",
        weatherConditions: { minTemp: 10 },
      }),
    ];
    // highTemp of 5 is <= 10
    const trip = makeTrip({
      weather: { dailyForecasts: [makeForecast({ highTemp: 5 })] },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
    expect(result[0].itemName).toBe("Winter Jacket");
  });

  it("excludes cold gear when forecast high > minTemp threshold", () => {
    const items = [
      makeItem({
        name: "Winter Jacket",
        weatherConditions: { minTemp: 10 },
      }),
    ];
    // highTemp of 15 is > 10
    const trip = makeTrip({
      weather: { dailyForecasts: [makeForecast({ highTemp: 15 })] },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(0);
  });

  it("includes warm gear when forecast low >= maxTemp threshold", () => {
    const items = [
      makeItem({
        name: "Sunscreen",
        weatherConditions: { maxTemp: 25 },
      }),
    ];
    // lowTemp of 28 is >= 25
    const trip = makeTrip({
      weather: { dailyForecasts: [makeForecast({ lowTemp: 28 })] },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
    expect(result[0].itemName).toBe("Sunscreen");
  });

  it("excludes warm gear when forecast low < maxTemp threshold", () => {
    const items = [
      makeItem({
        name: "Sunscreen",
        weatherConditions: { maxTemp: 25 },
      }),
    ];
    // lowTemp of 20 is < 25
    const trip = makeTrip({
      weather: { dailyForecasts: [makeForecast({ lowTemp: 20 })] },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(0);
  });

  it("triggers rain when precipProbability > 40", () => {
    const items = [
      makeItem({
        name: "Umbrella",
        weatherConditions: { rain: true },
      }),
    ];
    const trip = makeTrip({
      weather: {
        dailyForecasts: [makeForecast({ precipProbability: 41 })],
      },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
  });

  it("does NOT trigger rain when precipProbability is exactly 40", () => {
    const items = [
      makeItem({
        name: "Umbrella",
        weatherConditions: { rain: true },
      }),
    ];
    const trip = makeTrip({
      weather: {
        dailyForecasts: [makeForecast({ precipProbability: 40 })],
      },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(0);
  });

  it("triggers rain via a rain weather code", () => {
    const items = [
      makeItem({
        name: "Umbrella",
        weatherConditions: { rain: true },
      }),
    ];
    const trip = makeTrip({
      weather: {
        dailyForecasts: [makeForecast({ weatherCode: 61 })],
      },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
  });

  it("triggers snow via snowfall > 0", () => {
    const items = [
      makeItem({
        name: "Snow Boots",
        weatherConditions: { snow: true },
      }),
    ];
    const trip = makeTrip({
      weather: {
        dailyForecasts: [makeForecast({ snowfall: 2 })],
      },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
  });

  it("triggers snow via a snow weather code", () => {
    const items = [
      makeItem({
        name: "Snow Boots",
        weatherConditions: { snow: true },
      }),
    ];
    const trip = makeTrip({
      weather: {
        dailyForecasts: [makeForecast({ weatherCode: 73 })],
      },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
  });

  it("matches when any single weather condition is met (OR logic)", () => {
    const items = [
      makeItem({
        name: "Multi-condition",
        weatherConditions: { rain: true, snow: true },
      }),
    ];
    // Only rain condition met, no snow
    const trip = makeTrip({
      weather: {
        dailyForecasts: [
          makeForecast({ precipProbability: 80, snowfall: 0, weatherCode: 0 }),
        ],
      },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
  });

  it("aggregates weather across multiple forecast days", () => {
    const items = [
      makeItem({
        name: "Winter Jacket",
        weatherConditions: { minTemp: 10 },
      }),
    ];
    // Day 1: high 20, Day 2: high 8 → min of highs = 8, which is <= 10
    const trip = makeTrip({
      weather: {
        dailyForecasts: [
          makeForecast({ highTemp: 20 }),
          makeForecast({ highTemp: 8 }),
        ],
      },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
  });

  it("uses max of lows across forecast days for maxTemp check", () => {
    const items = [
      makeItem({
        name: "Sunscreen",
        weatherConditions: { maxTemp: 25 },
      }),
    ];
    // Day 1: low 10, Day 2: low 26 → max of lows = 26, which is >= 25
    const trip = makeTrip({
      weather: {
        dailyForecasts: [
          makeForecast({ lowTemp: 10 }),
          makeForecast({ lowTemp: 26 }),
        ],
      },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
  });

  it("excludes weather-conditional items when dailyForecasts is empty", () => {
    const items = [
      makeItem({
        name: "Umbrella",
        weatherConditions: { rain: true },
      }),
    ];
    const trip = makeTrip({
      weather: { dailyForecasts: [] },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(0);
  });

  it("includes non-weather items when dailyForecasts is empty", () => {
    const items = [makeItem({ name: "Socks", weatherConditions: null })];
    const trip = makeTrip({
      weather: { dailyForecasts: [] },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(1);
  });
});

// --- Quantity calculation ---

describe("quantity calculation", () => {
  it("calculates perDay: tripDays * value", () => {
    const items = [
      makeItem({
        name: "Shirt",
        quantityRule: { type: "perDay", value: 2 },
      }),
    ];
    const result = generatePackingList(items, makeTrip({ tripDays: 5 }));
    expect(result[0].quantity).toBe(10);
  });

  it("calculates perNDays: ceil(tripDays / value), minimum 1", () => {
    const items = [
      makeItem({
        name: "Detergent",
        quantityRule: { type: "perNDays", value: 3 },
      }),
    ];
    const result = generatePackingList(items, makeTrip({ tripDays: 7 }));
    // ceil(7/3) = 3
    expect(result[0].quantity).toBe(3);
  });

  it("perNDays returns at least 1 for a single-day trip", () => {
    const items = [
      makeItem({
        name: "Detergent",
        quantityRule: { type: "perNDays", value: 7 },
      }),
    ];
    const result = generatePackingList(items, makeTrip({ tripDays: 1 }));
    // Math.max(1, ceil(1/7)) = Math.max(1, 1) = 1
    expect(result[0].quantity).toBe(1);
  });

  it("calculates fixed: value unchanged regardless of tripDays", () => {
    const items = [
      makeItem({
        name: "Passport",
        quantityRule: { type: "fixed", value: 1 },
      }),
    ];
    const resultShort = generatePackingList(items, makeTrip({ tripDays: 1 }));
    const resultLong = generatePackingList(items, makeTrip({ tripDays: 30 }));
    expect(resultShort[0].quantity).toBe(1);
    expect(resultLong[0].quantity).toBe(1);
  });
});

// --- Error handling ---

describe("error handling", () => {
  it("throws on tripDays <= 0 when items match", () => {
    const items = [makeItem({ name: "Socks" })];
    expect(() =>
      generatePackingList(items, makeTrip({ tripDays: 0 })),
    ).toThrow("tripDays must be > 0");
  });

  it("throws on tripDays negative when items match", () => {
    const items = [makeItem({ name: "Socks" })];
    expect(() =>
      generatePackingList(items, makeTrip({ tripDays: -1 })),
    ).toThrow("tripDays must be > 0");
  });

  it("throws on quantityRule.value <= 0", () => {
    const items = [
      makeItem({
        name: "Bad Item",
        quantityRule: { type: "fixed", value: 0 },
      }),
    ];
    expect(() => generatePackingList(items, makeTrip())).toThrow(
      "quantityRule.value must be > 0",
    );
  });

  it("does NOT throw for tripDays <= 0 when no items match", () => {
    const items = [makeItem({ name: "Beach Only", tripTypes: ["beach"] })];
    // tripType is "vacation" so the item won't match, never reaches the check
    expect(() =>
      generatePackingList(items, makeTrip({ tripDays: 0, tripType: "vacation" })),
    ).not.toThrow();
  });
});

// --- Integration ---

describe("integration", () => {
  it("item must match BOTH trip type AND weather to appear", () => {
    const items = [
      makeItem({
        name: "Beach Umbrella",
        tripTypes: ["beach"],
        weatherConditions: { rain: true },
      }),
    ];
    // Correct trip type but no rain → excluded
    const trip = makeTrip({
      tripType: "beach",
      weather: { dailyForecasts: [makeForecast({ precipProbability: 0 })] },
    });
    const result = generatePackingList(items, trip);
    expect(result).toHaveLength(0);
  });

  it("handles a realistic 7-day mixed-weather trip", () => {
    const items: MasterItem[] = [
      makeItem({
        name: "T-Shirt",
        tripTypes: ["all"],
        quantityRule: { type: "perDay", value: 1 },
      }),
      makeItem({
        name: "Underwear",
        tripTypes: ["all"],
        quantityRule: { type: "perDay", value: 1 },
      }),
      makeItem({
        name: "Laundry Bag",
        tripTypes: ["all"],
        quantityRule: { type: "perNDays", value: 3 },
      }),
      makeItem({
        name: "Passport",
        tripTypes: ["all"],
        quantityRule: { type: "fixed", value: 1 },
      }),
      makeItem({
        name: "Rain Jacket",
        tripTypes: ["all"],
        weatherConditions: { rain: true },
        quantityRule: { type: "fixed", value: 1 },
      }),
      makeItem({
        name: "Snow Boots",
        tripTypes: ["all"],
        weatherConditions: { snow: true },
        quantityRule: { type: "fixed", value: 1 },
      }),
      makeItem({
        name: "Ski Goggles",
        tripTypes: ["skiing"],
        weatherConditions: { snow: true },
        quantityRule: { type: "fixed", value: 1 },
      }),
    ];

    const forecasts: DailyForecast[] = [
      makeForecast({ highTemp: 22, lowTemp: 14, precipProbability: 10 }),
      makeForecast({ highTemp: 20, lowTemp: 12, precipProbability: 20 }),
      makeForecast({ highTemp: 18, lowTemp: 10, precipProbability: 50 }), // rain
      makeForecast({ highTemp: 15, lowTemp: 8, precipProbability: 60 }),  // rain
      makeForecast({ highTemp: 12, lowTemp: 5, precipProbability: 30, snowfall: 1 }), // snow
      makeForecast({ highTemp: 14, lowTemp: 6, precipProbability: 10 }),
      makeForecast({ highTemp: 20, lowTemp: 12, precipProbability: 5 }),
    ];

    const trip = makeTrip({
      tripType: "vacation",
      tripDays: 7,
      weather: { dailyForecasts: forecasts },
    });

    const result = generatePackingList(items, trip);
    const byName = Object.fromEntries(result.map((r) => [r.itemName, r.quantity]));

    expect(byName["T-Shirt"]).toBe(7);       // perDay * 7
    expect(byName["Underwear"]).toBe(7);      // perDay * 7
    expect(byName["Laundry Bag"]).toBe(3);    // ceil(7/3) = 3
    expect(byName["Passport"]).toBe(1);       // fixed
    expect(byName["Rain Jacket"]).toBe(1);    // rain detected
    expect(byName["Snow Boots"]).toBe(1);     // snow detected
    expect(byName["Ski Goggles"]).toBeUndefined(); // wrong tripType
  });
});
