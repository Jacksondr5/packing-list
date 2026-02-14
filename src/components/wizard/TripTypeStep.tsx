"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WIZARD_TRIP_TYPES } from "@/lib/tripTypes";

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
      <p className="text-muted-foreground text-sm">
        What kind of trip is this?
      </p>
      {WIZARD_TRIP_TYPES.map((type) => (
        <Card
          key={type.value}
          role="button"
          tabIndex={0}
          aria-pressed={selected === type.value}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(type.value);
            }
          }}
          className={`hover:bg-accent cursor-pointer transition-colors ${
            selected === type.value ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => onSelect(type.value)}
        >
          <CardContent className="py-3">
            <p className="font-medium">{type.label}</p>
            <p className="text-muted-foreground text-sm">{type.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
