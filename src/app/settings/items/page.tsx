"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import Header from "@/components/Header";
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
  { value: "perDay", label: "Per Day", description: "This many per day of trip" },
  {
    value: "perNDays",
    label: "Per N Days",
    description: "One per this many days",
  },
];

type QuantityRuleType = "fixed" | "perDay" | "perNDays";
type TemperatureDirection = "above" | "below";

interface EditFormState {
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

function initEditForm(item: Doc<"items">): EditFormState {
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

function EditItemDialog({
  item,
  onClose,
}: {
  item: Doc<"items">;
  onClose: () => void;
}) {
  const updateItem = useMutation(api.items.update);
  const [form, setForm] = useState<EditFormState>(() => initEditForm(item));

  const toggleTripType = (value: string) => {
    if (value === "all") {
      setForm((f) => ({
        ...f,
        tripTypes: f.tripTypes.includes("all") ? [] : ["all"],
      }));
      return;
    }
    setForm((f) => {
      const without = f.tripTypes.filter((t) => t !== "all" && t !== value);
      if (f.tripTypes.includes(value)) {
        return { ...f, tripTypes: without };
      }
      return { ...f, tripTypes: [...without, value] };
    });
  };

  const handleSave = async () => {
    const weatherConditions = form.weatherEnabled
      ? {
          ...(form.temperature !== ""
            ? {
                temperature: Number(form.temperature),
                direction: form.temperatureDirection,
              }
            : {}),
          ...(form.rain ? { rain: true as const } : {}),
          ...(form.snow ? { snow: true as const } : {}),
        }
      : null;

    await updateItem({
      id: item._id,
      name: form.name,
      category: form.category,
      tripTypes: form.tripTypes.length > 0 ? form.tripTypes : ["all"],
      quantityRule: {
        type: form.quantityRuleType,
        value: form.quantityRuleValue,
      },
      weatherConditions,
    });
    onClose();
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Item</DialogTitle>
      </DialogHeader>
      <div className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
          >
            <SelectTrigger>
              <SelectValue />
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

        {/* Quantity Rule */}
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
            <Label className="text-muted-foreground text-xs">
              {QUANTITY_RULE_TYPES.find((r) => r.value === form.quantityRuleType)
                ?.description}
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

        {/* Trip Types */}
        <div className="space-y-2">
          <Label>Trip Types</Label>
          <div className="space-y-2">
            {SETTINGS_TRIP_TYPES.map((tt) => (
              <label
                key={tt.value}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={form.tripTypes.includes(tt.value)}
                  onCheckedChange={() => toggleTripType(tt.value)}
                />
                {tt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Weather Conditions */}
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
            <div className="border-muted space-y-3 rounded-md border p-3">
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
                  <p className="text-muted-foreground text-xs">
                    Include when forecast high or low is {form.temperatureDirection}
                    {" "}this
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
                  <p className="text-muted-foreground text-xs">
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!form.name || !form.category}>
            Save
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function ItemsSettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const items = useQuery(
    api.items.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const createItem = useMutation(api.items.create);
  const removeItem = useMutation(api.items.remove);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<Doc<"items"> | null>(null);

  const filteredItems =
    filterCategory === "all"
      ? items
      : items?.filter((i) => i.category === filterCategory);

  const handleAdd = async () => {
    if (!user || !newName || !newCategory) return;
    await createItem({
      userId: user._id,
      name: newName,
      category: newCategory,
      tripTypes: ["all"],
      weatherConditions: null,
      quantityRule: { type: "fixed", value: 1 },
    });
    setNewName("");
    setNewCategory("");
    setDialogOpen(false);
  };

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
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Item Library</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
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
                <Button onClick={handleAdd} disabled={!newName || !newCategory}>
                  Add
                </Button>
              </div>
            </DialogContent>
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

        <p className="text-muted-foreground text-sm">
          {filteredItems?.length ?? 0} items
        </p>

        <div className="space-y-1">
          {filteredItems?.map((item) => (
            <div
              key={item._id}
              className="bg-card flex items-center justify-between rounded-lg p-3"
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
                  size="sm"
                  onClick={() => setEditingItem(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem({ id: item._id })}
                >
                  Remove
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
      </main>
    </div>
  );
}
