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
        <p className="text-muted-foreground">Loading...</p>
      </AppShell>
    );
  }
  if (trip === null) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Trip not found.</p>
      </AppShell>
    );
  }

  const isCompleted = trip.status === "completed";
  const isPacking = trip.status === "packing";
  const isPlanning = trip.status === "planning";
  const allPacked = tripItems.every((item) => item.packed);
  const weatherWarning = getTripWeatherWarning(trip.weather);

  return (
    <AppShell className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{trip.destination}</h2>
          <Badge variant={isCompleted ? "secondary" : "default"}>
            {trip.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {trip.departureDate} - {trip.returnDate} | {trip.tripType} |{" "}
          {trip.transportMode}
        </p>
      </div>

      {trip.weather && (
        <WeatherSummary forecasts={trip.weather.dailyForecasts} />
      )}

      {weatherWarning && (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
          {weatherWarning}
        </p>
      )}

      {isPlanning && (
        <Button
          className="w-full"
          onClick={() => updateStatus({ tripId: trip._id, status: "packing" })}
        >
          Start Packing
        </Button>
      )}

      <PackingChecklist items={tripItems} readOnly={isCompleted} />

      {isPacking && allPacked && (
        <Button
          className="w-full"
          onClick={() =>
            updateStatus({ tripId: trip._id, status: "completed" })
          }
        >
          Done Packing!
        </Button>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push("/")}
      >
        Back to Trips
      </Button>
    </AppShell>
  );
}
