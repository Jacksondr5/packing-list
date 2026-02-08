"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const CATEGORIES = [
  "Clothing",
  "Toiletries",
  "Electronics",
  "Documents",
  "Accessories",
  "Health/Medicine",
  "Miscellaneous",
];

export default function ItemsSettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const items = useQuery(
    api.items.listByUser,
    user ? { userId: user._id } : "skip"
  );
  const createItem = useMutation(api.items.create);
  const removeItem = useMutation(api.items.remove);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
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

        <p className="text-sm text-muted-foreground">
          {filteredItems?.length ?? 0} items
        </p>

        <div className="space-y-1">
          {filteredItems?.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between rounded-lg bg-card p-3"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem({ id: item._id })}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
