import { AppError } from "../middleware/errorHandler";

// The Slot model was removed in the schema redesign.
// Scheduling is now handled via Order pickup/delivery notes.
// These stubs preserve the existing route/controller shape until
// the slot feature is re-implemented or replaced.

export async function getAvailability(_params: {
  date: string;
  type?: "PICKUP" | "DELIVERY";
  serviceId?: string;
}): Promise<unknown[]> {
  return [];
}

export async function create(_data: unknown): Promise<never> {
  throw new AppError("Slot management is not yet available", 501);
}

export async function createBulk(
  _slots: unknown[],
): Promise<{ count: number }> {
  throw new AppError("Slot management is not yet available", 501);
}

export async function findById(_id: string): Promise<never> {
  throw new AppError("Slot management is not yet available", 501);
}
