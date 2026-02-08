"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DatesStepProps {
  departureDate: string;
  returnDate: string;
  onDepartureChange: (date: string) => void;
  onReturnChange: (date: string) => void;
}

export default function DatesStep({
  departureDate,
  returnDate,
  onDepartureChange,
  onReturnChange,
}: DatesStepProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="departure">Departure date</Label>
        <Input
          id="departure"
          type="date"
          min={today}
          value={departureDate}
          onChange={(e) => onDepartureChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="return">Return date</Label>
        <Input
          id="return"
          type="date"
          min={departureDate || today}
          value={returnDate}
          onChange={(e) => onReturnChange(e.target.value)}
        />
      </div>
      {departureDate && returnDate && (
        <p className="text-muted-foreground text-sm">
          {Math.ceil(
            (new Date(returnDate).getTime() -
              new Date(departureDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1}{" "}
          days
        </p>
      )}
    </div>
  );
}
