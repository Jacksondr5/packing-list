"use client";

import { WIZARD_TRIP_TYPES } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Umbrella,
  Tent,
  Building2,
  type LucideIcon,
} from "lucide-react";

const tripTypeIcons: Record<string, LucideIcon> = {
  business: Briefcase,
  vacation: Umbrella,
  camping: Tent,
  cityBreak: Building2,
};

interface TripTypeStepProps {
  selected: string;
  onSelect: (type: string) => void;
}

export default function TripTypeStep({
  selected,
  onSelect,
}: TripTypeStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        What kind of trip is this?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {WIZARD_TRIP_TYPES.map((type) => {
          const Icon = tripTypeIcons[type.value] || Briefcase;
          const isSelected = selected === type.value;

          return (
            <div
              key={type.value}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              className={cn(
                "flex cursor-pointer select-none flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200",
                "hover:bg-accent/60 active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border/50 bg-card",
              )}
              onClick={() => onSelect(type.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(type.value);
                }
              }}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg transition-colors",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{type.label}</p>
                <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                  {type.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
