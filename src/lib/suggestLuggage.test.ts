import { describe, it, expect } from "vitest";
import { suggestLuggage, getLuggageWarning } from "./suggestLuggage";

// --- Factory helper ---

let idCounter = 0;

function makeBag(
  overrides: Partial<{
    _id: string;
    name: string;
    transportModes: string[];
    size: "small" | "medium" | "large";
  }> = {},
) {
  idCounter++;
  return {
    _id: overrides._id ?? `bag_${idCounter}`,
    name: overrides.name ?? `Bag ${idCounter}`,
    transportModes: overrides.transportModes ?? ["car", "plane", "train"],
    size: overrides.size ?? "medium",
  };
}

// --- suggestLuggage ---

describe("suggestLuggage", () => {
  it("only returns bags compatible with the transport mode", () => {
    const bags = [
      makeBag({ name: "Car Bag", transportModes: ["car"] }),
      makeBag({ name: "Plane Bag", transportModes: ["plane"] }),
    ];
    const result = suggestLuggage(bags, "plane", 10);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Plane Bag");
  });

  it("returns empty array when no bags match transport mode", () => {
    const bags = [makeBag({ transportModes: ["car"] })];
    const result = suggestLuggage(bags, "plane", 10);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    const result = suggestLuggage([], "car", 10);
    expect(result).toEqual([]);
  });

  it("picks largest bags first (greedy)", () => {
    const bags = [
      makeBag({ name: "Small", size: "small" }),
      makeBag({ name: "Large", size: "large" }),
      makeBag({ name: "Medium", size: "medium" }),
    ];
    const result = suggestLuggage(bags, "car", 40);
    expect(result[0].name).toBe("Large");
  });

  it("stops picking bags once capacity is met", () => {
    const bags = [
      makeBag({ name: "Large", size: "large" }),  // capacity 50
      makeBag({ name: "Medium", size: "medium" }), // capacity 30
    ];
    const result = suggestLuggage(bags, "car", 30);
    // Large (50) is enough for 30 items
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Large");
  });

  it("picks multiple bags when one is not enough", () => {
    const bags = [
      makeBag({ name: "Large", size: "large" }),  // capacity 50
      makeBag({ name: "Medium", size: "medium" }), // capacity 30
    ];
    const result = suggestLuggage(bags, "car", 60);
    expect(result).toHaveLength(2);
  });

  it("picks all bags when total capacity is still insufficient", () => {
    const bags = [
      makeBag({ name: "Small 1", size: "small" }), // 15
      makeBag({ name: "Small 2", size: "small" }), // 15
    ];
    const result = suggestLuggage(bags, "car", 100);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when totalItemCount is 0", () => {
    const bags = [makeBag({ size: "large" })];
    const result = suggestLuggage(bags, "car", 0);
    expect(result).toEqual([]);
  });

  it("uses correct size capacities (small=15, medium=30, large=50)", () => {
    // Need exactly 15 items → small bag should suffice
    const smallBag = [makeBag({ name: "Small", size: "small", transportModes: ["car"] })];
    expect(suggestLuggage(smallBag, "car", 15)).toHaveLength(1);

    // Need 16 items → small bag (15) is not enough, still picks it but won't stop
    // Actually the greedy loop: remainingCapacity = 16, picks small (15), remaining = 1, no more bags
    expect(suggestLuggage(smallBag, "car", 16)).toHaveLength(1);

    // Two smalls for 16 items
    const twoSmall = [
      makeBag({ name: "Small 1", size: "small", transportModes: ["car"] }),
      makeBag({ name: "Small 2", size: "small", transportModes: ["car"] }),
    ];
    expect(suggestLuggage(twoSmall, "car", 16)).toHaveLength(2);
  });

  it("does not mutate the input array", () => {
    const bags = [
      makeBag({ name: "Small", size: "small" }),
      makeBag({ name: "Large", size: "large" }),
      makeBag({ name: "Medium", size: "medium" }),
    ];
    const originalOrder = bags.map((b) => b.name);
    suggestLuggage(bags, "car", 40);
    expect(bags.map((b) => b.name)).toEqual(originalOrder);
  });
});

// --- getLuggageWarning ---

describe("getLuggageWarning", () => {
  it("returns null when capacity >= 70% of items", () => {
    // 1 large bag = 50 capacity, 50 items, 50 >= 50*0.7 (35) → null
    const bags = [makeBag({ size: "large" })];
    expect(getLuggageWarning(bags, 50)).toBeNull();
  });

  it("returns warning when capacity < 70% of items", () => {
    // 1 small bag = 15 capacity, 100 items, 15 < 100*0.7 (70) → warning
    const bags = [makeBag({ size: "small" })];
    expect(getLuggageWarning(bags, 100)).not.toBeNull();
  });

  it("returns null at exactly 70% boundary", () => {
    // 1 medium bag = 30 capacity, items where 30 = items * 0.7 → items = 30/0.7 ≈ 42.857
    // At 42 items: 30 < 42*0.7 (29.4) → 30 >= 29.4 → null
    // At 43 items: 30 < 43*0.7 (30.1) → 30 < 30.1 → warning
    const bags = [makeBag({ size: "medium" })];
    expect(getLuggageWarning(bags, 42)).toBeNull();
    expect(getLuggageWarning(bags, 43)).not.toBeNull();
  });

  it("returns null for empty luggage with 0 items", () => {
    // 0 capacity < 0 * 0.7 (0) → 0 < 0 is false → null
    expect(getLuggageWarning([], 0)).toBeNull();
  });

  it("returns warning for empty luggage with non-zero items", () => {
    // 0 capacity < 10 * 0.7 (7) → 0 < 7 → warning
    expect(getLuggageWarning([], 10)).not.toBeNull();
  });

  it("sums capacity across multiple bags", () => {
    // small(15) + medium(30) = 45 capacity
    // 60 items: 45 < 60*0.7 (42) → 45 >= 42 → null
    const bags = [makeBag({ size: "small" }), makeBag({ size: "medium" })];
    expect(getLuggageWarning(bags, 60)).toBeNull();
  });

  it("returns the exact warning message text", () => {
    const bags = [makeBag({ size: "small" })];
    expect(getLuggageWarning(bags, 100)).toBe(
      "Your selected luggage might be too small for this trip. Consider a larger bag.",
    );
  });
});
