"use client";

import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Link href="/settings/items">
          <Card className="hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Item Library</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Manage your master list of items that can be packed
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/luggage">
          <Card className="hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Luggage</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Manage your bags and their transport compatibility
            </CardContent>
          </Card>
        </Link>
      </main>
    </div>
  );
}
