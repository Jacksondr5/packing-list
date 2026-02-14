import { describe, expect, it } from "vitest";
import {
  SETTINGS_TRIP_TYPES,
  WIZARD_TRIP_TYPES,
} from "../src/lib/tripTypes";

describe("shared trip type options", () => {
  it("keeps wizard and settings options in sync", () => {
    expect(WIZARD_TRIP_TYPES.map((t) => t.value)).toEqual([
      "business",
      "vacation",
      "camping",
      "cityBreak",
    ]);

    expect(SETTINGS_TRIP_TYPES.map((t) => t.value)).toEqual([
      "all",
      ...WIZARD_TRIP_TYPES.map((t) => t.value),
    ]);
  });
});
