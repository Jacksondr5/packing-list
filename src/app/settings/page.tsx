"use client";

import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Link href="/settings/items">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-base">Item Library</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage your master list of items that can be packed
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/luggage">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-base">Luggage</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage your bags and their transport compatibility
            </CardContent>
          </Card>
        </Link>
      </main>
    </div>
  );
}
