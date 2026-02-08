"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function TripList() {
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const user = useQuery(api.users.getCurrentUser);
  const trips = useQuery(
    api.trips.listByUser,
    user ? { userId: user._id } : "skip"
  );

  useEffect(() => {
    getOrCreateUser();
  }, [getOrCreateUser]);

  const tripsLoaded = trips !== undefined;
  const activeTrips = trips?.filter((t) => t.status !== "completed") ?? [];
  const pastTrips = trips?.filter((t) => t.status === "completed") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Trips</h2>
        <Button asChild>
          <Link href="/trips/new">New Trip</Link>
        </Button>
      </div>

      {tripsLoaded && activeTrips.length === 0 && pastTrips.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No trips yet. Create your first trip to get started!
          </CardContent>
        </Card>
      )}

      {activeTrips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
          {activeTrips.map((trip) => (
            <Link key={trip._id} href={`/trips/${trip._id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {trip.destination}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {trip.departureDate} - {trip.returnDate} | {trip.tripType} |{" "}
                  {trip.transportMode}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pastTrips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Past Trips
          </h3>
          {pastTrips.map((trip) => (
            <Link key={trip._id} href={`/trips/${trip._id}`}>
              <Card className="opacity-60 transition-colors hover:bg-accent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {trip.destination}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {trip.departureDate} - {trip.returnDate} | {trip.tripType}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6">
        <Unauthenticated>
          <div className="space-y-4 text-center py-12">
            <h2 className="text-2xl font-bold">Smart Packing Lists</h2>
            <p className="text-muted-foreground">
              Generate weather-aware packing lists for your trips. Never forget
              an item again.
            </p>
          </div>
        </Unauthenticated>
        <Authenticated>
          <TripList />
        </Authenticated>
      </main>
    </div>
  );
}
