"use client";

import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import WizardShell from "@/components/wizard/WizardShell";
import DestinationStep from "@/components/wizard/DestinationStep";
import DatesStep from "@/components/wizard/DatesStep";
import TripTypeStep from "@/components/wizard/TripTypeStep";
import TransportStep from "@/components/wizard/TransportStep";
import {
  generatePackingList,
  type DailyForecast,
} from "@/lib/generatePackingList";
import { getConditionFromCode } from "@/lib/weatherCodes";
import { getCreateTripErrorMessage } from "@/lib/createTripError";

const STEPS = ["Destination", "Dates", "Trip Type", "Transport"];

export default function NewTripPage() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const items = useQuery(
    api.items.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const luggage = useQuery(
    api.luggage.listByUser,
    user ? { userId: user._id } : "skip",
  );

  const createTrip = useMutation(api.trips.create);
  const deleteTrip = useMutation(api.trips.deleteTrip);
  const createTripItems = useMutation(api.tripItems.createMany);
  const fetchForecast = useAction(api.weather.fetchForecast);

  const [destination, setDestination] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [tripType, setTripType] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const canProceedForStep = (step: number) => {
    switch (step) {
      case 0:
        return destination !== null;
      case 1:
        return (
          departureDate !== "" &&
          returnDate !== "" &&
          returnDate >= departureDate
        );
      case 2:
        return tripType !== "";
      case 3:
        return transportMode !== "";
      default:
        return false;
    }
  };

  const handleComplete = async () => {
    if (!user || !destination || !items) return;
    setGenerating(true);
    setGenerationError(null);

    try {
      // Fetch weather
      let weather: {
        dailyForecasts: DailyForecast[];
        fetchedAt: number;
      } | null = null;
      try {
        const forecastData = await fetchForecast({
          latitude: destination.latitude,
          longitude: destination.longitude,
          startDate: departureDate,
          endDate: returnDate,
        });

        if (forecastData?.daily) {
          const dailyForecasts = forecastData.daily.time.map(
            (date: string, i: number) => ({
              date,
              highTemp: forecastData.daily.temperature_2m_max[i],
              lowTemp: forecastData.daily.temperature_2m_min[i],
              precipProbability:
                forecastData.daily.precipitation_probability_max[i],
              snowfall: forecastData.daily.snowfall_sum[i],
              weatherCode: forecastData.daily.weather_code[i],
              condition: getConditionFromCode(
                forecastData.daily.weather_code[i],
              ),
            }),
          );
          weather = { dailyForecasts, fetchedAt: Date.now() };
        }
      } catch {
        // Weather fetch failed — proceed without weather
      }

      // Suggest luggage
      const compatibleLuggage = (luggage ?? []).filter((bag) =>
        bag.transportModes.includes(transportMode),
      );
      const selectedLuggage = compatibleLuggage.map((bag) => bag._id);

      // Create trip
      const tripDays =
        Math.ceil(
          (new Date(returnDate).getTime() - new Date(departureDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;

      const tripId = await createTrip({
        userId: user._id,
        destination: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
        departureDate,
        returnDate,
        tripType,
        transportMode,
        selectedLuggage,
        weather,
      });

      try {
        // Generate packing list
        const packingList = generatePackingList(items, {
          tripType,
          tripDays,
          weather,
        });

        // Save trip items
        if (packingList.length > 0) {
          await createTripItems({
            items: packingList.map((item) => ({
              tripId,
              itemName: item.itemName,
              category: item.category,
              quantity: item.quantity,
              packed: false,
            })),
          });
        }
      } catch (error) {
        // Clean up the orphaned trip if packing list generation/saving fails
        await deleteTrip({ tripId });
        throw error;
      }

      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error("Failed to create trip:", error);
      setGenerationError(getCreateTripErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <AppShell className="flex flex-col items-center justify-center py-16">
        <div className="space-y-4 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <div>
            <p className="font-display text-lg font-medium">
              Generating your list...
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Fetching weather and calculating what you need
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {generationError && (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {generationError}
        </p>
      )}
      <WizardShell
        steps={STEPS}
        canProceed={canProceedForStep}
        onComplete={handleComplete}
      >
        {(step) => {
          switch (step) {
            case 0:
              return (
                <DestinationStep
                  selected={destination}
                  onSelect={setDestination}
                />
              );
            case 1:
              return (
                <DatesStep
                  departureDate={departureDate}
                  returnDate={returnDate}
                  onDepartureChange={setDepartureDate}
                  onReturnChange={setReturnDate}
                />
              );
            case 2:
              return (
                <TripTypeStep selected={tripType} onSelect={setTripType} />
              );
            case 3:
              return (
                <TransportStep
                  selected={transportMode}
                  onSelect={setTransportMode}
                />
              );
            default:
              return null;
          }
        }}
      </WizardShell>
    </AppShell>
  );
}
