"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Id } from "../../convex/_generated/dataModel";

interface TripItem {
  _id: Id<"tripItems">;
  itemName: string;
  category: string;
  quantity: number;
  packed: boolean;
}

interface PackingChecklistProps {
  items: TripItem[];
  readOnly?: boolean;
}

export default function PackingChecklist({
  items,
  readOnly = false,
}: PackingChecklistProps) {
  const togglePacked = useMutation(api.tripItems.togglePacked);

  // Group by category
  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, TripItem[]>,
  );

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.packed).length;
  const progressPercent = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  // Sort categories: put ones with unpacked items first
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aUnpacked = grouped[a].filter((i) => !i.packed).length;
    const bUnpacked = grouped[b].filter((i) => !i.packed).length;
    if (aUnpacked > 0 && bUnpacked === 0) return -1;
    if (aUnpacked === 0 && bUnpacked > 0) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>
            {packedItems} of {totalItems} items packed
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {sortedCategories.map((category) => {
        const categoryItems = grouped[category];
        const categoryPacked = categoryItems.filter((i) => i.packed).length;

        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{category}</h3>
              <span className="text-muted-foreground text-xs">
                {categoryPacked}/{categoryItems.length}
              </span>
            </div>
            <div className="space-y-1">
              {categoryItems.map((item) => (
                <div
                  key={item._id}
                  role="button"
                  tabIndex={readOnly ? -1 : 0}
                  aria-disabled={readOnly}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                    item.packed
                      ? "bg-muted/50 text-muted-foreground"
                      : "bg-card hover:bg-accent/80 active:bg-accent/90"
                  } ${readOnly ? "cursor-default" : "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"}`}
                  onClick={() => {
                    if (!readOnly) togglePacked({ id: item._id });
                  }}
                  onKeyDown={(e) => {
                    if (readOnly) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePacked({ id: item._id });
                    }
                  }}
                >
                  <Checkbox
                    checked={item.packed}
                    tabIndex={-1}
                    className="pointer-events-none"
                  />
                  <span
                    className={`flex-1 ${item.packed ? "line-through" : ""}`}
                  >
                    {item.itemName}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground text-sm">
                      x{item.quantity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
