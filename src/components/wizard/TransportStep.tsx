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
      <p className="text-sm text-muted-foreground">
        How are you getting there?
      </p>
      {TRANSPORT_MODES.map((mode) => (
        <Card
          key={mode.value}
          className={`cursor-pointer transition-colors hover:bg-accent ${
            selected === mode.value ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => onSelect(mode.value)}
        >
          <CardContent className="py-3">
            <p className="font-medium">{mode.label}</p>
            <p className="text-sm text-muted-foreground">
              {mode.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
