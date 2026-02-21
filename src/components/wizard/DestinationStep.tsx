"use client";

import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Search, Check } from "lucide-react";

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

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="destination"
            placeholder="Search for a city..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {selected && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-primary/50 bg-primary/5 p-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Check className="size-4" />
          </div>
          <span className="text-sm font-medium">{selected.name}</span>
        </div>
      )}

      {searching && (
        <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <div className="size-3 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r) => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-accent/60 active:scale-[0.99] active:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => {
                onSelect({
                  name: `${r.name}, ${r.country}`,
                  latitude: r.latitude,
                  longitude: r.longitude,
                });
                setResults([]);
                setQuery(`${r.name}, ${r.country}`);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect({
                    name: `${r.name}, ${r.country}`,
                    latitude: r.latitude,
                    longitude: r.longitude,
                  });
                  setResults([]);
                  setQuery(`${r.name}, ${r.country}`);
                }
              }}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <MapPin className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.admin1 ? `${r.admin1}, ` : ""}
                  {r.country}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
