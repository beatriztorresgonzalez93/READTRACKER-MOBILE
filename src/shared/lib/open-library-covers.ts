// Utilidades Open Library (app nativa; Android suele necesitar User-Agent explícito).
import { Platform } from "react-native";

type OpenLibrarySearchDoc = {
  cover_i?: number | string;
  cover_edition_key?: string | string[];
  isbn?: string[];
};

const RESULT_LIMIT = 8;
const FETCH_TIMEOUT_MS = 18_000;

const OPEN_LIBRARY_HEADERS: Record<string, string> = {
  Accept: "application/json",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  "User-Agent":
    Platform.OS === "android"
      ? "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 ReadTracker/1.0"
      : "ReadTracker/1.0 (compatible; OpenLibrary)",
};

function editionKeyToOlid(key: string | string[] | undefined): string | null {
  if (!key) return null;
  const raw = Array.isArray(key) ? key[0] : key;
  if (!raw?.trim()) return null;
  return raw.replace(/^\/?books\//, "").replace(/^\/?editions\//, "").trim();
}

function coverIdFromDoc(doc: OpenLibrarySearchDoc): number | null {
  const raw = doc.cover_i;
  if (raw == null) return null;
  const id = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function extractOpenLibraryCoverUrls(docs: OpenLibrarySearchDoc[]): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const doc of docs) {
    const candidates: string[] = [];

    const coverId = coverIdFromDoc(doc);
    if (coverId != null) {
      candidates.push(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`);
    }

    const olid = editionKeyToOlid(doc.cover_edition_key);
    if (olid) {
      candidates.push(`https://covers.openlibrary.org/b/olid/${olid}-M.jpg`);
    }

    const isbn = doc.isbn?.find((value) => typeof value === "string" && value.trim());
    if (isbn) {
      candidates.push(`https://covers.openlibrary.org/b/isbn/${isbn.trim()}-M.jpg`);
    }

    for (const url of candidates) {
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
      if (urls.length >= RESULT_LIMIT) return urls;
    }
  }

  return urls;
}

function buildOpenLibrarySearchUrl(params: Record<string, string>): string {
  const parts = ["limit=16"];
  for (const [key, value] of Object.entries(params)) {
    if (!value.trim()) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.trim())}`);
  }
  return `https://openlibrary.org/search.json?${parts.join("&")}`;
}

async function fetchOpenLibraryDocs(params: Record<string, string>): Promise<OpenLibrarySearchDoc[]> {
  const url = buildOpenLibrarySearchUrl(params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: OPEN_LIBRARY_HEADERS,
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { docs?: OpenLibrarySearchDoc[] };
    return data.docs ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchOpenLibraryCovers(
  params: Record<string, string>,
): Promise<string[]> {
  const docs = await fetchOpenLibraryDocs(params);
  return extractOpenLibraryCoverUrls(docs);
}

export async function searchOpenLibraryByTitleAuthor(
  title: string,
  author?: string,
): Promise<string[]> {
  const trimmedTitle = title.trim();
  const trimmedAuthor = author?.trim() ?? "";
  if (!trimmedTitle) return [];

  const attempts: Record<string, string>[] = [];
  if (trimmedAuthor) {
    attempts.push({ q: `${trimmedTitle} ${trimmedAuthor}` });
    attempts.push({ title: trimmedTitle, author: trimmedAuthor });
  }
  attempts.push({ q: trimmedTitle });
  attempts.push({ title: trimmedTitle });

  for (const params of attempts) {
    const covers = await searchOpenLibraryCovers(params);
    if (covers.length > 0) return covers;
  }
  return [];
}
