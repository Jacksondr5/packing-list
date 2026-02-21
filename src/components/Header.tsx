"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="font-display text-xl font-semibold tracking-tight text-primary">
            PackPal
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <AuthLoading>
            <div className="size-8 animate-pulse rounded-full bg-muted" />
          </AuthLoading>
          <Unauthenticated>
            <SignInButton mode="modal" />
          </Unauthenticated>
          <Authenticated>
            <Link
              href="/settings"
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-accent/80"
              aria-label="Settings"
            >
              <Settings className="size-5" />
            </Link>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
