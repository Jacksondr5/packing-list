"use client";

import type { ReactNode } from "react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
}

export default function AppShell({
  children,
  className,
  showHeader = true,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header />}
      <main className={cn("mx-auto w-full max-w-lg px-4 py-6", className)}>
        {children}
      </main>
    </div>
  );
}
