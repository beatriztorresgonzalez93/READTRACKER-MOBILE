// Cliente de endpoints de sesiones de lectura registradas.
import { apiRequest } from "@/shared/api/client";
import type { ReadingSession } from "@/shared/types/reading-session";

export async function getReadingSessions(token: string): Promise<ReadingSession[]> {
  const response = await apiRequest<{ data?: ReadingSession[] } | ReadingSession[]>("/reading-sessions", { token });
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}

export async function deleteReadingSession(token: string, sessionId: string): Promise<void> {
  const attempts = [`/reading-sessions/${sessionId}`, `/reading-sessions/${sessionId}/delete`];
  let lastError: Error | null = null;

  for (const path of attempts) {
    try {
      await apiRequest(path, {
        method: "DELETE",
        token,
      });
      return;
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError ?? new Error("No se pudo eliminar la sesion.");
}

