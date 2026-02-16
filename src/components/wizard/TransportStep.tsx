"use client";

import { Card, CardContent } from "@/components/ui/card";

const TRANSPORT_MODES = [
  { value: "plane", label: "Plane", description: "Flying to destination" },
  { value: "train", label: "Train", description: "Rail travel" },
  { value: "car", label: "Car", description: "Driving to destination" },
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
      <p className="text-muted-foreground text-sm">
        How are you getting there?
      </p>
      {TRANSPORT_MODES.map((mode) => (
        <Card
          key={mode.value}
          className={`cursor-pointer transition-colors hover:bg-accent/80 active:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            selected === mode.value ? "border-primary bg-primary/5" : ""
          }`}
          role="button"
          tabIndex={0}
          aria-pressed={selected === mode.value}
          onClick={() => onSelect(mode.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(mode.value);
            }
          }}
        >
          <CardContent className="py-3">
            <p className="font-medium">{mode.label}</p>
            <p className="text-muted-foreground text-sm">{mode.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
