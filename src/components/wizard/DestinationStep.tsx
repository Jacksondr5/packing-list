"use client";

import { useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface DestinationStepProps {
  onSelect: (result: {
    name: string;
    latitude: number;
    longitude: number;
  }) => void;
  selected: { name: string; latitude: number; longitude: number } | null;
}

export default function DestinationStep({
  onSelect,
  selected,
}: DestinationStepProps) {
  const [query, setQuery] = useState(selected?.name ?? "");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const geocode = useAction(api.weather.geocodeCity);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (value.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await geocode({ cityName: value });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="destination">Where are you going?</Label>
        <Input
          id="destination"
          placeholder="Search for a city..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {selected && (
        <div className="rounded-md border border-primary bg-primary/5 p-3 text-sm">
          Selected: <strong>{selected.name}</strong>
        </div>
      )}

      {searching && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <Card
              key={r.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => {
                onSelect({
                  name: `${r.name}, ${r.country}`,
                  latitude: r.latitude,
                  longitude: r.longitude,
                });
                setResults([]);
                setQuery(`${r.name}, ${r.country}`);
              }}
            >
              <CardContent className="py-3">
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-muted-foreground">
                  {r.admin1 ? `${r.admin1}, ` : ""}
                  {r.country}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
