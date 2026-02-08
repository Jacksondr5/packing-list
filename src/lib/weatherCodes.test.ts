import { describe, it, expect } from "vitest";
import { getConditionFromCode, isRainCode, isSnowCode } from "./weatherCodes";

describe("getConditionFromCode", () => {
  it("returns the correct condition for known codes", () => {
    expect(getConditionFromCode(0)).toBe("Clear sky");
    expect(getConditionFromCode(3)).toBe("Overcast");
    expect(getConditionFromCode(65)).toBe("Heavy rain");
    expect(getConditionFromCode(75)).toBe("Heavy snow");
    expect(getConditionFromCode(95)).toBe("Thunderstorm");
  });

  it('returns "Unknown" for an unrecognized code', () => {
    expect(getConditionFromCode(999)).toBe("Unknown");
  });

  it('returns "Unknown" for a negative code', () => {
    expect(getConditionFromCode(-1)).toBe("Unknown");
  });
});

describe("isRainCode", () => {
  const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

  it("returns true for all rain codes", () => {
    for (const code of RAIN_CODES) {
      expect(isRainCode(code), `expected ${code} to be a rain code`).toBe(true);
    }
  });

  it("returns false for non-rain codes", () => {
    expect(isRainCode(0)).toBe(false);
    expect(isRainCode(3)).toBe(false);
    expect(isRainCode(45)).toBe(false);
    expect(isRainCode(71)).toBe(false);
    expect(isRainCode(75)).toBe(false);
  });
});

describe("isSnowCode", () => {
  const SNOW_CODES = [71, 73, 75, 77, 85, 86];

  it("returns true for all snow codes", () => {
    for (const code of SNOW_CODES) {
      expect(isSnowCode(code), `expected ${code} to be a snow code`).toBe(true);
    }
  });

  it("returns false for non-snow codes", () => {
    expect(isSnowCode(0)).toBe(false);
    expect(isSnowCode(3)).toBe(false);
    expect(isSnowCode(61)).toBe(false);
    expect(isSnowCode(95)).toBe(false);
  });
});

describe("rain and snow code sets", () => {
  it("have no overlap", () => {
    const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
    const SNOW_CODES = [71, 73, 75, 77, 85, 86];
    const overlap = RAIN_CODES.filter((c) => SNOW_CODES.includes(c));
    expect(overlap).toEqual([]);
  });
});
