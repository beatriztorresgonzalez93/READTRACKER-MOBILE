// Búsqueda de URLs de portada vía backend (Open Library / Google Books con User-Agent correcto).
import { apiRequest } from "@/shared/api/client";

export async function searchCoverCandidates(title: string, author?: string): Promise<string[]> {
  const q = new URLSearchParams();
  q.set("title", title.trim());
  const authorTrim = author?.trim();
  if (authorTrim) q.set("author", authorTrim);
  const response = await apiRequest<{ data?: string[] }>(`/covers/search?${q.toString()}`);
  return Array.isArray(response.data) ? response.data : [];
}
