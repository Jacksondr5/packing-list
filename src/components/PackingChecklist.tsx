"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";
import { Check } from "lucide-react";

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
    <div className="space-y-5">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">
            {packedItems} of {totalItems} packed
          </span>
          <span className="font-display text-2xl font-semibold text-primary">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Category groups */}
      {sortedCategories.map((category) => {
        const categoryItems = grouped[category];
        const categoryPacked = categoryItems.filter((i) => i.packed).length;
        const allCategoryPacked = categoryPacked === categoryItems.length;

        return (
          <div key={category} className="space-y-1.5">
            <div className="flex items-center justify-between px-1 py-1">
              <h3
                className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  allCategoryPacked
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground",
                )}
              >
                {category}
              </h3>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  allCategoryPacked
                    ? "text-primary/60"
                    : "text-muted-foreground",
                )}
              >
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
                  aria-pressed={item.packed}
                  className={cn(
                    "flex w-full select-none items-center gap-3 rounded-xl px-3 py-3.5 text-left transition-all duration-200",
                    item.packed
                      ? "bg-muted/30 text-muted-foreground/60"
                      : "bg-card hover:bg-accent/60 active:bg-accent/80",
                    readOnly
                      ? "cursor-default"
                      : "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
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
                  {/* Custom checkbox */}
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200",
                      item.packed
                        ? "border-primary/40 bg-primary/20 text-primary"
                        : "border-border bg-transparent",
                    )}
                  >
                    {item.packed && (
                      <Check className="size-3.5" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    className={cn(
                      "flex-1 text-sm transition-all duration-200",
                      item.packed && "line-through",
                    )}
                  >
                    {item.itemName}
                  </span>
                  {item.quantity > 1 && (
                    <span className="rounded-md bg-muted/50 px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
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
