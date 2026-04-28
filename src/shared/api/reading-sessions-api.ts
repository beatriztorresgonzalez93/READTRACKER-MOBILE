import { apiRequest } from "@/shared/api/client";
import type { ReadingSession } from "@/shared/types/reading-session";

export async function getReadingSessions(token: string): Promise<ReadingSession[]> {
  const response = await apiRequest<{ data?: ReadingSession[] } | ReadingSession[]>("/reading-sessions", { token });
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}

