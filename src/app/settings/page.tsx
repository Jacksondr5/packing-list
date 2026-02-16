"use client";

import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <AppShell className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <Link
        href="/settings/items"
        className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card className="transition-colors group-hover:bg-accent/80 group-active:bg-accent/90">
          <CardHeader>
            <CardTitle className="text-base">Item Library</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Manage your master list of items that can be packed
          </CardContent>
        </Card>
      </Link>
      <Link
        href="/settings/luggage"
        className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card className="transition-colors group-hover:bg-accent/80 group-active:bg-accent/90">
          <CardHeader>
            <CardTitle className="text-base">Luggage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Manage your bags and their transport compatibility
          </CardContent>
        </Card>
      </Link>
    </AppShell>
  );
}
