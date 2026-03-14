import { describe, expect, it } from "vitest";
import { getCreateTripErrorMessage } from "../src/lib/createTripError";

describe("getCreateTripErrorMessage", () => {
  it("returns a generic message for backend errors", () => {
    expect(getCreateTripErrorMessage(new Error("weather unavailable"))).toBe(
      "We couldn't create this trip right now. Please try again.",
    );
  });

  it("returns an auth-specific message for session errors", () => {
    expect(getCreateTripErrorMessage(new Error("Unauthorized"))).toBe(
      "Your session expired while creating the trip. Please sign in again.",
    );
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(getCreateTripErrorMessage("boom")).toBe(
      "We couldn't create this trip right now. Please try again.",
    );
  });
});
