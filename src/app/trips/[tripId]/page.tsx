"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Header from "@/components/Header";
import PackingChecklist from "@/components/PackingChecklist";
import WeatherSummary from "@/components/WeatherSummary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as Id<"trips">;

  const trip = useQuery(api.trips.getById, { tripId });
  const tripItems = useQuery(api.tripItems.listByTrip, { tripId });
  const updateStatus = useMutation(api.trips.updateStatus);

  if (trip === undefined || tripItems === undefined) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-6">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }
  if (trip === null) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-6">
          <p className="text-muted-foreground">Trip not found.</p>
        </main>
      </div>
    );
  }

  const isCompleted = trip.status === "completed";
  const isPacking = trip.status === "packing";
  const isPlanning = trip.status === "planning";
  const allPacked = tripItems.every((item) => item.packed);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{trip.destination}</h2>
            <Badge variant={isCompleted ? "secondary" : "default"}>
              {trip.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {trip.departureDate} - {trip.returnDate} | {trip.tripType} |{" "}
            {trip.transportMode}
          </p>
        </div>

        {trip.weather && (
          <WeatherSummary forecasts={trip.weather.dailyForecasts} />
        )}

        {!trip.weather && (
          <p className="text-muted-foreground text-sm">
            Weather forecast not available for this trip.
          </p>
        )}

        {isPlanning && (
          <Button
            className="w-full"
            onClick={() =>
              updateStatus({ tripId: trip._id, status: "packing" })
            }
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
      </main>
    </div>
  );
}
