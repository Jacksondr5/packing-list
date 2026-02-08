"use client";

import { Card, CardContent } from "@/components/ui/card";

const TRIP_TYPES = [
  {
    value: "business",
    label: "Business",
    description: "Work meetings, conferences",
  },
  {
    value: "vacation",
    label: "Vacation / Beach",
    description: "Relaxation, sun, swimming",
  },
  {
    value: "camping",
    label: "Camping / Outdoors",
    description: "Hiking, nature, adventure",
  },
  {
    value: "cityBreak",
    label: "City Break",
    description: "Sightseeing, culture, food",
  },
];

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
      {TRIP_TYPES.map((type) => (
        <Card
          key={type.value}
          className={`cursor-pointer transition-colors hover:bg-accent ${
            selected === type.value ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => onSelect(type.value)}
        >
          <CardContent className="py-3">
            <p className="font-medium">{type.label}</p>
            <p className="text-sm text-muted-foreground">
              {type.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
