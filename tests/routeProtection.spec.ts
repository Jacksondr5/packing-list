import { describe, expect, it } from "vitest";
import { isPublicPathname } from "../src/lib/routeProtection";

describe("isPublicPathname", () => {
  it("treats the home page as public", () => {
    expect(isPublicPathname("/")).toBe(true);
  });

  it("treats auth pages as public", () => {
    expect(isPublicPathname("/sign-in")).toBe(true);
    expect(isPublicPathname("/sign-in/sso-callback")).toBe(true);
    expect(isPublicPathname("/sign-up")).toBe(true);
  });

  it("treats app pages as protected", () => {
    expect(isPublicPathname("/trips/new")).toBe(false);
    expect(isPublicPathname("/trips/abc123")).toBe(false);
    expect(isPublicPathname("/settings")).toBe(false);
  });
});
