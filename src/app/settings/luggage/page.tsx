"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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

export default function LuggageSettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const luggageList = useQuery(
    api.luggage.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const createLuggage = useMutation(api.luggage.create);
  const removeLuggage = useMutation(api.luggage.remove);

  const [name, setName] = useState("");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [modes, setModes] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleMode = (mode: string) => {
    setModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    );
  };

  const handleAdd = async () => {
    if (!user || !name || modes.length === 0) return;
    await createLuggage({
      userId: user._id,
      name,
      transportModes: modes,
      size,
    });
    setName("");
    setSize("medium");
    setModes([]);
    setDialogOpen(false);
  };

  return (
    <AppShell className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Luggage</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add Bag</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Luggage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="luggage-name">Name</Label>
                <Input
                  id="luggage-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Blue carry-on"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="luggage-size">Size</Label>
                <Select
                  value={size}
                  onValueChange={(v) =>
                    setSize(v as "small" | "medium" | "large")
                  }
                >
                  <SelectTrigger id="luggage-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Compatible transport</Label>
                <div className="space-y-2">
                  {["plane", "train", "car"].map((mode) => (
                    <label
                      key={mode}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={modes.includes(mode)}
                        onCheckedChange={() => toggleMode(mode)}
                      />
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleAdd}
                disabled={!user || !name || modes.length === 0}
              >
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!luggageList || luggageList.length === 0) && (
        <p className="text-sm text-muted-foreground">
          No luggage added yet. Add your bags to get luggage suggestions when
          creating trips.
        </p>
      )}

      <div className="space-y-2">
        {luggageList?.map((bag) => (
          <div
            key={bag._id}
            className="flex items-center justify-between rounded-lg bg-card p-3"
          >
            <div>
              <p className="text-sm font-medium">{bag.name}</p>
              <div className="mt-1 flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  {bag.size}
                </Badge>
                {bag.transportModes.map((mode) => (
                  <Badge key={mode} variant="outline" className="text-xs">
                    {mode}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeLuggage({ id: bag._id })}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
