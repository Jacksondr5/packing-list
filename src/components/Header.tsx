"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/">
          <h1 className="text-lg font-bold">PackPal</h1>
        </Link>
        <div className="flex items-center gap-3">
          <AuthLoading>
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          </AuthLoading>
          <Unauthenticated>
            <SignInButton mode="modal" />
          </Unauthenticated>
          <Authenticated>
            <Link
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Settings
            </Link>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
