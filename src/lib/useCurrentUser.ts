"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type UseCurrentUserResult =
  | {
      error: null;
      status: "authLoading" | "signedOut" | "loading";
      user: null;
    }
  | {
      error: string;
      status: "error";
      user: null;
    }
  | {
      error: null;
      status: "ready";
      user: Doc<"users">;
    };

export function useCurrentUser(): UseCurrentUserResult {
  const { isLoaded, isSignedIn } = useAuth();
  const user = useQuery(api.users.getCurrentUser, {});
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const bootstrapRequestedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      bootstrapRequestedRef.current = false;
      return;
    }

    if (user === undefined || user !== null || bootstrapRequestedRef.current) {
      return;
    }

    bootstrapRequestedRef.current = true;

    void (async () => {
      setBootstrapError(null);

      try {
        await getOrCreateUser();
        setBootstrapError(null);
      } catch {
        bootstrapRequestedRef.current = false;
        setBootstrapError("We couldn't finish setting up your account.");
      }
    })();
  }, [getOrCreateUser, isLoaded, isSignedIn, user]);

  if (!isLoaded) {
    return { error: null, status: "authLoading", user: null };
  }

  if (!isSignedIn) {
    return { error: null, status: "signedOut", user: null };
  }

  if (user) {
    return { error: null, status: "ready", user };
  }

  if (bootstrapError) {
    return { error: bootstrapError, status: "error", user: null };
  }

  return { error: null, status: "loading", user: null };
}
