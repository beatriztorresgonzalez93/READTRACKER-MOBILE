// Búsqueda de portadas: Open Library en el dispositivo (nativo) y API Render como respaldo.
import { Platform } from "react-native";

import { apiRequest } from "@/shared/api/client";
import { searchOpenLibraryByTitleAuthor } from "@/shared/lib/open-library-covers";

async function fetchCoversFromApi(title: string, author?: string): Promise<string[]> {
  const q = new URLSearchParams();
  q.set("title", title);
  const authorTrim = author?.trim();
  if (authorTrim) q.set("author", authorTrim);
  const response = await apiRequest<{ data?: string[] }>(`/covers/search?${q.toString()}`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function searchCoverCandidates(title: string, author?: string): Promise<string[]> {
  const trimmedTitle = title.trim();
  const authorTrim = author?.trim();
  if (!trimmedTitle) return [];

  // En Android la API a menudo devuelve [] (Google Books sin cuota); Open Library directo es más fiable.
  if (Platform.OS !== "web") {
    const localCovers = await searchOpenLibraryByTitleAuthor(trimmedTitle, authorTrim);
    if (localCovers.length > 0) {
      return localCovers;
    }
  }

  try {
    const fromApi = await fetchCoversFromApi(trimmedTitle, authorTrim);
    if (fromApi.length > 0) {
      return fromApi;
    }
  } catch {
    /* API no disponible */
  }

  if (Platform.OS === "web") {
    return [];
  }

  return searchOpenLibraryByTitleAuthor(trimmedTitle, authorTrim);
}
