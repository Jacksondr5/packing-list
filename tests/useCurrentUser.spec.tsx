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

  it("bootstraps a signed-in user when the Convex user record is missing", async () => {
    const getOrCreateUser = vi.fn().mockResolvedValue("user_123");
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: true });
    useQueryMock.mockReturnValue(null);
    useMutationMock.mockReturnValue(getOrCreateUser);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(getOrCreateUser).toHaveBeenCalledTimes(1));
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
