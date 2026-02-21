"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import { Package, ShoppingBag, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell className="space-y-6">
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        Settings
      </h2>

      <div className="space-y-2">
        <Link
          href="/settings/items"
          className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:bg-accent/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Item Library</p>
            <p className="text-sm text-muted-foreground">
              Manage your master list of packable items
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/settings/luggage"
          className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:bg-accent/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingBag className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Luggage</p>
            <p className="text-sm text-muted-foreground">
              Manage your bags and transport compatibility
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </AppShell>
  );
}
