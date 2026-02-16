import { describe, expect, it } from "vitest";
import { getCreateTripErrorMessage } from "../src/lib/createTripError";

describe("getCreateTripErrorMessage", () => {
  it("includes the original error message for Error objects", () => {
    expect(getCreateTripErrorMessage(new Error("weather unavailable"))).toBe(
      "Failed to create trip: weather unavailable",
    );
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(getCreateTripErrorMessage("boom")).toBe(
      "Failed to create trip. Please try again.",
    );
  });
});
