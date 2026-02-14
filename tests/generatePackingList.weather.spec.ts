import { describe, expect, it } from "vitest";
import {
  generatePackingList,
  type MasterItem,
} from "../src/lib/generatePackingList";

const baseTrip = {
  tripType: "vacation",
  tripDays: 4,
};

describe("generatePackingList weather direction thresholds", () => {
  it("includes an item when direction is above and either high or low crosses threshold", () => {
    const masterItems: MasterItem[] = [
      {
        name: "Shorts",
        category: "Clothing",
        tripTypes: ["all"],
        weatherConditions: { temperature: 70, direction: "above" },
        quantityRule: { type: "fixed" as const, value: 1 },
      },
    ];

    const result = generatePackingList(masterItems, {
      ...baseTrip,
      weather: {
        dailyForecasts: [
          {
            date: "2026-03-01",
            highTemp: 72,
            lowTemp: 68,
            precipProbability: 0,
            snowfall: 0,
            weatherCode: 0,
            condition: "Clear",
          },
        ],
      },
    });

    expect(result.map((i) => i.itemName)).toContain("Shorts");
  });

  it("includes an item when direction is below and either high or low crosses threshold", () => {
    const masterItems: MasterItem[] = [
      {
        name: "Thermals",
        category: "Clothing",
        tripTypes: ["all"],
        weatherConditions: { temperature: 50, direction: "below" },
        quantityRule: { type: "fixed" as const, value: 1 },
      },
    ];

    const result = generatePackingList(masterItems, {
      ...baseTrip,
      weather: {
        dailyForecasts: [
          {
            date: "2026-03-01",
            highTemp: 75,
            lowTemp: 45,
            precipProbability: 0,
            snowfall: 0,
            weatherCode: 0,
            condition: "Clear",
          },
        ],
      },
    });

    expect(result.map((i) => i.itemName)).toContain("Thermals");
  });

  it("includes both warm and cold items when trip has temperature swings", () => {
    const masterItems: MasterItem[] = [
      {
        name: "Winter coat",
        category: "Clothing",
        tripTypes: ["all"],
        weatherConditions: { temperature: 40, direction: "below" },
        quantityRule: { type: "fixed" as const, value: 1 },
      },
      {
        name: "Swimsuit",
        category: "Clothing",
        tripTypes: ["all"],
        weatherConditions: { temperature: 70, direction: "above" },
        quantityRule: { type: "fixed" as const, value: 1 },
      },
    ];

    const result = generatePackingList(masterItems, {
      ...baseTrip,
      weather: {
        dailyForecasts: [
          {
            date: "2026-03-01",
            highTemp: 36,
            lowTemp: 28,
            precipProbability: 0,
            snowfall: 0,
            weatherCode: 0,
            condition: "Clear",
          },
          {
            date: "2026-03-02",
            highTemp: 75,
            lowTemp: 65,
            precipProbability: 0,
            snowfall: 0,
            weatherCode: 0,
            condition: "Clear",
          },
        ],
      },
    });

    expect(result.map((i) => i.itemName)).toContain("Winter coat");
    expect(result.map((i) => i.itemName)).toContain("Swimsuit");
  });
});
