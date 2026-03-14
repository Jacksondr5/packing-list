export function getCreateTripErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("Not authenticated") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("User not found")
    ) {
      return "Your session expired while creating the trip. Please sign in again.";
    }
  }

  return "We couldn't create this trip right now. Please try again.";
}
