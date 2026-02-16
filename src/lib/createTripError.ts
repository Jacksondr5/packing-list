export function getCreateTripErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `Failed to create trip: ${error.message}`;
  }

  return "Failed to create trip. Please try again.";
}
