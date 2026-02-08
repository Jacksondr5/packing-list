interface LuggageItem {
  _id: string;
  name: string;
  transportModes: string[];
  size: "small" | "medium" | "large";
}

const SIZE_CAPACITY: Record<string, number> = {
  small: 15,
  medium: 30,
  large: 50,
};

export function suggestLuggage(
  allLuggage: LuggageItem[],
  transportMode: string,
  totalItemCount: number,
): LuggageItem[] {
  // Filter by transport compatibility
  const compatible = allLuggage.filter((bag) =>
    bag.transportModes.includes(transportMode),
  );

  if (compatible.length === 0) return [];

  // Sort by size descending (largest first for greedy packing)
  const sizeOrder: Record<string, number> = { small: 0, medium: 1, large: 2 };
  const sorted = [...compatible].sort(
    (a, b) => sizeOrder[b.size] - sizeOrder[a.size],
  );

  // Greedy: pick bags until we have enough capacity
  const suggestions: LuggageItem[] = [];
  let remainingCapacity = totalItemCount;

  for (const bag of sorted) {
    if (remainingCapacity <= 0) break;
    suggestions.push(bag);
    remainingCapacity -= SIZE_CAPACITY[bag.size];
  }

  return suggestions;
}

export function getLuggageWarning(
  selectedLuggage: LuggageItem[],
  totalItemCount: number,
): string | null {
  const totalCapacity = selectedLuggage.reduce(
    (sum, bag) => sum + SIZE_CAPACITY[bag.size],
    0,
  );

  if (totalCapacity < totalItemCount * 0.7) {
    return "Your selected luggage might be too small for this trip. Consider a larger bag.";
  }
  return null;
}
