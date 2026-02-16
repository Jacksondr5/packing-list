import { describe, expect, it } from "vitest";
import { getLocalDateString } from "../src/lib/date";

describe("getLocalDateString", () => {
  it("formats a date as local YYYY-MM-DD", () => {
    const sample = new Date(2026, 1, 16, 9, 30, 0);
    expect(getLocalDateString(sample)).toBe("2026-02-16");
  });

  it("pads single-digit month and day", () => {
    const sample = new Date(2026, 0, 5, 0, 0, 0);
    expect(getLocalDateString(sample)).toBe("2026-01-05");
  });
});
