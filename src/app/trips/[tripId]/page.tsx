"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import AppShell from "@/components/AppShell";
import PackingChecklist from "@/components/PackingChecklist";
import WeatherSummary from "@/components/WeatherSummary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getTripWeatherWarning } from "@/lib/weatherWarnings";
import {
  ArrowLeft,
  Calendar,
  Plane,
  Train,
  Car,
  type LucideIcon,
} from "lucide-react";

const transportIcons: Record<string, LucideIcon> = {
  plane: Plane,
  train: Train,
  car: Car,
};

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as Id<"trips">;

  const trip = useQuery(api.trips.getById, { tripId });
  const tripItems = useQuery(api.tripItems.listByTrip, { tripId });
  const updateStatus = useMutation(api.trips.updateStatus);

  if (trip === undefined || tripItems === undefined) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }
  if (trip === null) {
    return (
      <AppShell>
        <p className="py-12 text-center text-muted-foreground">
          Trip not found.
        </p>
      </AppShell>
    );
  }

  const isCompleted = trip.status === "completed";
  const isPacking = trip.status === "packing";
  const isPlanning = trip.status === "planning";
  const allPacked = tripItems.every((item) => item.packed);
  const weatherWarning = getTripWeatherWarning(trip.weather);
  const TransportIcon = transportIcons[trip.transportMode] || Plane;

  return (
    <AppShell className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to trips
      </button>

      {/* Trip header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {trip.destination}
          </h2>
          <Badge
            variant={isCompleted ? "secondary" : "default"}
            className="shrink-0 capitalize"
          >
            {trip.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {trip.departureDate} — {trip.returnDate}
          </span>
          <span className="flex items-center gap-1.5">
            <TransportIcon className="size-3.5" />
            {trip.tripType} · {trip.transportMode}
          </span>
        </div>
      </div>

      {/* Weather */}
      {trip.weather && (
        <WeatherSummary forecasts={trip.weather.dailyForecasts} />
      )}

      {weatherWarning && (
        <p className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning-foreground">
          {weatherWarning}
        </p>
      )}

      {/* Start Packing CTA */}
      {isPlanning && (
        <Button
          className="h-12 w-full text-base font-medium"
          onClick={() => updateStatus({ tripId: trip._id, status: "packing" })}
        >
          Start Packing
        </Button>
      )}

      {/* Packing checklist */}
      <PackingChecklist items={tripItems} readOnly={isCompleted} />

      {/* Done Packing CTA */}
      {isPacking && allPacked && (
        <Button
          className="h-12 w-full text-base font-medium"
          onClick={() =>
            updateStatus({ tripId: trip._id, status: "completed" })
          }
        >
          Done Packing!
        </Button>
      )}
    </AppShell>
  );
}
