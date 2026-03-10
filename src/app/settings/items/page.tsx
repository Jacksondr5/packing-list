"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SETTINGS_TRIP_TYPES } from "@/lib/tripTypes";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Clothing",
  "Toiletries",
  "Electronics",
  "Documents",
  "Accessories",
  "Health/Medicine",
  "Miscellaneous",
];

const QUANTITY_RULE_TYPES = [
  { value: "fixed", label: "Fixed", description: "Always pack this many" },
  {
    value: "perDay",
    label: "Per Day",
    description: "This many per day of trip",
  },
  {
    value: "perNDays",
    label: "Per N Days",
    description: "One per this many days",
  },
];

type QuantityRuleType = "fixed" | "perDay" | "perNDays";
type TemperatureDirection = "above" | "below";

interface ItemFormState {
  name: string;
  category: string;
  tripTypes: string[];
  quantityRuleType: QuantityRuleType;
  quantityRuleValue: number;
  weatherEnabled: boolean;
  temperature: string;
  temperatureDirection: TemperatureDirection;
  rain: boolean;
  snow: boolean;
}

const DEFAULT_NEW_ITEM_FORM: ItemFormState = {
  name: "",
  category: "",
  tripTypes: ["all"],
  quantityRuleType: "fixed",
  quantityRuleValue: 1,
  weatherEnabled: false,
  temperature: "",
  temperatureDirection: "above",
  rain: false,
  snow: false,
};

function initItemForm(item: Doc<"items">): ItemFormState {
  const wc = item.weatherConditions;
  const derivedDirection: TemperatureDirection = wc?.direction ?? "above";

  return {
    name: item.name,
    category: item.category,
    tripTypes: [...item.tripTypes],
    quantityRuleType: item.quantityRule.type,
    quantityRuleValue: item.quantityRule.value,
    weatherEnabled: wc !== null,
    temperature: wc?.temperature !== undefined ? String(wc.temperature) : "",
    temperatureDirection: derivedDirection,
    rain: wc?.rain ?? false,
    snow: wc?.snow ?? false,
  };
}

function toggleTripTypeSelection(tripTypes: string[], value: string) {
  if (value === "all") {
    return tripTypes.includes("all") ? [] : ["all"];
  }

  const without = tripTypes.filter((tripType) => {
    return tripType !== "all" && tripType !== value;
  });

  if (tripTypes.includes(value)) {
    return without;
  }

  return [...without, value];
}

function normalizeWeatherConditions(form: ItemFormState) {
  if (!form.weatherEnabled) {
    return null;
  }

  const parsedTemperature =
    form.temperature.trim() === "" ? null : Number(form.temperature);

  const weatherConditions = {
    ...(parsedTemperature !== null && Number.isFinite(parsedTemperature)
      ? {
          temperature: parsedTemperature,
          direction: form.temperatureDirection,
        }
      : {}),
    ...(form.rain ? { rain: true as const } : {}),
    ...(form.snow ? { snow: true as const } : {}),
  };

  return Object.keys(weatherConditions).length === 0 ? null : weatherConditions;
}

function buildItemPayload(form: ItemFormState) {
  return {
    name: form.name,
    category: form.category,
    tripTypes: form.tripTypes,
    quantityRule: {
      type: form.quantityRuleType,
      value: form.quantityRuleValue,
    },
    weatherConditions: normalizeWeatherConditions(form),
  };
}

function ItemDialogContent({
  title,
  form,
  setForm,
  saving,
  error,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  form: ItemFormState;
  setForm: Dispatch<SetStateAction<ItemFormState>>;
  saving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
}) {
  const toggleTripType = (value: string) => {
    setForm((current) => ({
      ...current,
      tripTypes: toggleTripTypeSelection(current.tripTypes, value),
    }));
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quantity Rule</Label>
          <Select
            value={form.quantityRuleType}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                quantityRuleType: v as QuantityRuleType,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUANTITY_RULE_TYPES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {
                QUANTITY_RULE_TYPES.find(
                  (r) => r.value === form.quantityRuleType,
                )?.description
              }
            </Label>
            <Input
              type="number"
              min={1}
              value={form.quantityRuleValue}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  quantityRuleValue: Math.max(1, Number(e.target.value)),
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Trip Types</Label>
          <div className="space-y-2">
            {SETTINGS_TRIP_TYPES.map((tt) => (
              <label key={tt.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.tripTypes.includes(tt.value)}
                  onCheckedChange={() => toggleTripType(tt.value)}
                />
                {tt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={form.weatherEnabled}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, weatherEnabled: checked === true }))
              }
            />
            Weather Conditions
          </label>
          {form.weatherEnabled && (
            <div className="space-y-3 rounded-xl border border-muted p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Temperature (°F)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 70"
                    value={form.temperature}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, temperature: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Include when forecast high or low is{" "}
                    {form.temperatureDirection} this
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Direction</Label>
                  <Select
                    value={form.temperatureDirection}
                    onValueChange={(value: TemperatureDirection) =>
                      setForm((f) => ({
                        ...f,
                        temperatureDirection: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Example: above 70°F or below 40°F
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.rain}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, rain: checked === true }))
                    }
                  />
                  Rain
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.snow}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, snow: checked === true }))
                    }
                  />
                  Snow
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {error && (
            <p
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
              className="mr-auto text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void onSubmit()}
            disabled={!form.name || !form.category || saving}
          >
            {saving ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function EditItemDialog({
  item,
  onClose,
}: {
  item: Doc<"items">;
  onClose: () => void;
}) {
  const updateItem = useMutation(api.items.update);
  const [form, setForm] = useState<ItemFormState>(() => initItemForm(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateItem({
        id: item._id,
        ...buildItemPayload(form),
      });
      onClose();
    } catch {
      setError("Failed to save item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ItemDialogContent
      title="Edit Item"
      form={form}
      setForm={setForm}
      saving={saving}
      error={error}
      submitLabel="Save"
      onSubmit={handleSave}
      onClose={onClose}
    />
  );
}

function AddItemDialog({
  userId,
  onClose,
}: {
  userId: Id<"users">;
  onClose: () => void;
}) {
  const createItem = useMutation(api.items.create);
  const [form, setForm] = useState<ItemFormState>(DEFAULT_NEW_ITEM_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      await createItem({
        userId,
        ...buildItemPayload(form),
      });
      setForm(DEFAULT_NEW_ITEM_FORM);
      onClose();
    } catch {
      setError("Failed to create item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ItemDialogContent
      title="Add Item"
      form={form}
      setForm={setForm}
      saving={saving}
      error={error}
      submitLabel="Add"
      onSubmit={handleCreate}
      onClose={onClose}
    />
  );
}

export default function ItemsSettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const items = useQuery(
    api.items.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const removeItem = useMutation(api.items.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<Doc<"items"> | null>(null);

  const filteredItems =
    filterCategory === "all"
      ? items
      : items?.filter((i) => i.category === filterCategory);

  const formatQuantityRule = (rule: { type: string; value: number }) => {
    switch (rule.type) {
      case "perDay":
        return `${rule.value}/day`;
      case "perNDays":
        return `1 per ${rule.value} days`;
      case "fixed":
        return `${rule.value} fixed`;
      default:
        return String(rule.value);
    }
  };

  return (
    <AppShell className="space-y-4">
      <Link
        href="/settings"
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Settings
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Item Library
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add Item
            </Button>
          </DialogTrigger>
          {dialogOpen && user ? (
            <AddItemDialog
              userId={user._id}
              onClose={() => setDialogOpen(false)}
            />
          ) : null}
        </Dialog>
      </div>

      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-sm text-muted-foreground">
        {filteredItems?.length ?? 0} items
      </p>

      <div className="space-y-1">
        {filteredItems?.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between rounded-xl bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatQuantityRule(item.quantityRule)}
                </Badge>
                {item.tripTypes.includes("all") ? null : (
                  <Badge variant="outline" className="text-xs">
                    {item.tripTypes.length} trip type
                    {item.tripTypes.length !== 1 ? "s" : ""}
                  </Badge>
                )}
                {item.weatherConditions !== null && (
                  <Badge variant="outline" className="text-xs">
                    Weather
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setEditingItem(item)}
                aria-label="Edit item"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => removeItem({ id: item._id })}
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
      >
        {editingItem && (
          <EditItemDialog
            key={editingItem._id}
            item={editingItem}
            onClose={() => setEditingItem(null)}
          />
        )}
      </Dialog>
    </AppShell>
  );
}
