// Búsqueda de URLs de portada vía Open Library y fallback a Google Books.

export class CoversSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoversSearchError";
  }
}

type OpenLibrarySearchDoc = {
  cover_i?: number;
  cover_edition_key?: string | string[];
  isbn?: string[];
};

type OpenLibrarySearchJson = {
  docs?: OpenLibrarySearchDoc[];
};

type GoogleVolumeItem = {
  volumeInfo?: {
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      medium?: string;
    };
  };
};

type GoogleBooksJson = {
  items?: GoogleVolumeItem[];
};

const OPEN_LIBRARY_LIMIT = 16;
const RESULT_LIMIT = 8;

/** Algunos proveedores devuelven 403 si la petición no lleva User-Agent (típico en Node). */
const OUTBOUND_FETCH_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "ReadTracker/1.0 (+https://github.com/beatriztorresgonzalez93/READTRACKER)",
};

function editionKeyToOlid(key: string | string[] | undefined): string | null {
  if (!key) return null;
  const raw = Array.isArray(key) ? key[0] : key;
  if (!raw?.trim()) return null;
  return raw.replace(/^\/?books\//, "").replace(/^\/?editions\//, "").trim();
}

export function extractOpenLibraryCoverUrls(docs: OpenLibrarySearchDoc[]): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const doc of docs) {
    const candidates: string[] = [];

    if (typeof doc.cover_i === "number") {
      candidates.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`);
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

export class CoversService {
  private async searchOpenLibrary(
    params: Record<string, string>,
  ): Promise<string[]> {
    const searchParams = new URLSearchParams({
      limit: String(OPEN_LIBRARY_LIMIT),
      ...params,
    });

    const response = await fetch(
      `https://openlibrary.org/search.json?${searchParams.toString()}`,
      { headers: OUTBOUND_FETCH_HEADERS },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as OpenLibrarySearchJson;
    return extractOpenLibraryCoverUrls(data.docs ?? []);
  }

  private async searchGoogleBooks(title: string, author?: string): Promise<string[]> {
    const parts = [title.trim()];
    if (author?.trim()) parts.push(author.trim());
    const googleQuery = parts.join(" ");

    const googleBooksResponse = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleQuery)}&maxResults=12`,
      { headers: OUTBOUND_FETCH_HEADERS },
    );

    if (!googleBooksResponse.ok) {
      console.warn(
        "[ReadTracker] CoversService: Google Books respondió",
        googleBooksResponse.status,
        googleBooksResponse.statusText,
      );
      return [];
    }

    const googleData = (await googleBooksResponse.json()) as GoogleBooksJson;

    return (googleData.items ?? [])
      .map(
        (item) =>
          item.volumeInfo?.imageLinks?.thumbnail ??
          item.volumeInfo?.imageLinks?.smallThumbnail ??
          item.volumeInfo?.imageLinks?.medium,
      )
      .filter((url): url is string => typeof url === "string" && url.length > 0)
      .map((url) => url.replace("http://", "https://").replace("&edge=curl", ""))
      .slice(0, RESULT_LIMIT);
  }

  async searchByTitle(title: string, author?: string): Promise<string[]> {
    const trimmedTitle = title.trim();
    const trimmedAuthor = author?.trim() ?? "";

    if (!trimmedTitle) {
      return [];
    }

    const openLibraryAttempts: Record<string, string>[] = [];

    if (trimmedAuthor) {
      openLibraryAttempts.push({ q: `${trimmedTitle} ${trimmedAuthor}` });
      openLibraryAttempts.push({ title: trimmedTitle, author: trimmedAuthor });
    }
    openLibraryAttempts.push({ q: trimmedTitle });
    openLibraryAttempts.push({ title: trimmedTitle });

    for (const params of openLibraryAttempts) {
      const covers = await this.searchOpenLibrary(params);
      if (covers.length > 0) {
        return covers;
      }
    }

    return this.searchGoogleBooks(trimmedTitle, trimmedAuthor || undefined);
  }
}
