"use client";

import { cn } from "@/lib/utils";
import { Plane, Train, Car, type LucideIcon } from "lucide-react";

const TRANSPORT_MODES: {
  value: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "plane", label: "Plane", icon: Plane },
  { value: "train", label: "Train", icon: Train },
  { value: "car", label: "Car", icon: Car },
];

interface TransportStepProps {
  selected: string;
  onSelect: (mode: string) => void;
}

export default function TransportStep({
  selected,
  onSelect,
}: TransportStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        How are you getting there?
      </p>
      <div className="grid grid-cols-3 gap-3">
        {TRANSPORT_MODES.map((mode) => {
          const isSelected = selected === mode.value;

          return (
            <div
              key={mode.value}
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
              onClick={() => onSelect(mode.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(mode.value);
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
                <mode.icon className="size-5" />
              </div>
              <p className="text-sm font-medium">{mode.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
