"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, MapPin, Calendar, ChevronRight } from "lucide-react";

function TripList() {
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const user = useQuery(api.users.getCurrentUser);
  const trips = useQuery(
    api.trips.listByUser,
    user ? { userId: user._id } : "skip",
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
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          My Trips
        </h2>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/trips/new">
            <Plus className="size-4" />
            New Trip
          </Link>
        </Button>
      </div>

      {tripsLoaded && activeTrips.length === 0 && pastTrips.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No trips yet. Create your first trip to get started!
          </p>
        </div>
      )}

      {activeTrips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active
          </h3>
          {activeTrips.map((trip) => (
            <Link
              key={trip._id}
              href={`/trips/${trip._id}`}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all group-hover:border-primary/30 group-hover:bg-accent/60 group-active:scale-[0.98]">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{trip.destination}</p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>
                      {trip.departureDate} — {trip.returnDate}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {pastTrips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Past Trips
          </h3>
          {pastTrips.map((trip) => (
            <Link
              key={trip._id}
              href={`/trips/${trip._id}`}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/50 p-4 opacity-60 transition-all group-hover:opacity-80 group-active:scale-[0.98]">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{trip.destination}</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.departureDate} — {trip.returnDate}
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground/30" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppShell>
      <Unauthenticated>
        <div className="space-y-6 py-16 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Pack smarter,
            <br />
            travel lighter
          </h2>
          <p className="mx-auto max-w-xs text-muted-foreground">
            Weather-aware packing lists that know exactly what you need. Never
            forget an item again.
          </p>
        </div>
      </Unauthenticated>
      <Authenticated>
        <TripList />
      </Authenticated>
    </AppShell>
  );
}
