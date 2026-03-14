// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAuthMock = vi.fn();
const useMutationMock = vi.fn();
const useQueryMock = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

import { useCurrentUser } from "../src/lib/useCurrentUser";

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns authLoading when Clerk is not yet loaded", () => {
    useAuthMock.mockReturnValue({ isLoaded: false, isSignedIn: false });
    useQueryMock.mockReturnValue(undefined);
    useMutationMock.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toMatchObject({
      error: null,
      status: "authLoading",
      user: null,
    });
  });

  it("returns signedOut when the user is not signed in", () => {
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: false });
    useQueryMock.mockReturnValue(undefined);
    useMutationMock.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toMatchObject({
      error: null,
      status: "signedOut",
      user: null,
    });
  });

  it("bootstraps a signed-in user when the Convex user record is missing", async () => {
    const getOrCreateUser = vi.fn().mockResolvedValue("user_123");
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: true });
    useQueryMock.mockReturnValue(null);
    useMutationMock.mockReturnValue(getOrCreateUser);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(getOrCreateUser).toHaveBeenCalledTimes(1));
  });

  it("returns an error when bootstrapping the user fails", async () => {
    const getOrCreateUser = vi.fn().mockRejectedValue(new Error("boom"));
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: true });
    useQueryMock.mockReturnValue(null);
    useMutationMock.mockReturnValue(getOrCreateUser);

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "error",
        error: "We couldn't finish setting up your account.",
        user: null,
      }),
    );
  });

  it("returns the current user when the record already exists", () => {
    const user = { _id: "user_123", clerkId: "clerk_123", email: "a@b.com" };
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: true });
    useQueryMock.mockReturnValue(user);
    useMutationMock.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toMatchObject({
      error: null,
      status: "ready",
      user,
    });
  });
});
