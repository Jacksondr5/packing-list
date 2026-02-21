"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLocalDateString } from "@/lib/date";
import { Calendar } from "lucide-react";

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
  const today = getLocalDateString();
  const tripDays =
    departureDate && returnDate
      ? (() => {
          const returnTime = new Date(returnDate).getTime();
          const departureTime = new Date(departureDate).getTime();

          if (returnTime < departureTime) return null;

          return Math.ceil((returnTime - departureTime) / (1000 * 60 * 60 * 24)) + 1;
        })()
      : null;

  return (
    <div className="space-y-5">
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
      {tripDays !== null && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Calendar className="size-4 text-primary" />
          <span className="text-sm font-medium">
            {tripDays} {tripDays === 1 ? "day" : "days"}
          </span>
        </div>
      )}
    </div>
  );
}
