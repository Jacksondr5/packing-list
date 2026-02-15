export interface TripTypeOption {
  value: "business" | "vacation" | "camping" | "cityBreak";
  label: string;
  description: string;
}

export const WIZARD_TRIP_TYPES: TripTypeOption[] = [
  {
    value: "business",
    label: "Business",
    description: "Work meetings, conferences",
  },
  {
    value: "vacation",
    label: "Vacation / Beach",
    description: "Relaxation, sun, swimming",
  },
  {
    value: "camping",
    label: "Camping / Outdoors",
    description: "Hiking, nature, adventure",
  },
  {
    value: "cityBreak",
    label: "City Break",
    description: "Sightseeing, culture, food",
  },
];

export const SETTINGS_TRIP_TYPES = [
  { value: "all", label: "All Trip Types" },
  ...WIZARD_TRIP_TYPES.map(({ value, label }) => ({ value, label })),
] as const;
