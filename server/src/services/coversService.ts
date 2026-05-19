// Búsqueda de URLs de portada vía Open Library y fallback a Google Books.

export class CoversSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoversSearchError";
  }
}

type OpenLibrarySearchDoc = { cover_i?: number };

type OpenLibrarySearchJson = {
  docs?: OpenLibrarySearchDoc[];
};

type GoogleVolumeItem = {
  volumeInfo?: {
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

type GoogleBooksJson = {
  items?: GoogleVolumeItem[];
};

const OPEN_LIBRARY_LIMIT = 12;
const RESULT_LIMIT = 8;

/** Algunos proveedores devuelven 403 si la petición no lleva User-Agent (típico en Node). */
const OUTBOUND_FETCH_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "ReadTracker/1.0 (+https://github.com/beatriztorresgonzalez93/READTRACKER)"
};

export class CoversService {
  async searchByTitle(title: string, author?: string): Promise<string[]> {
    const openLibraryParams = new URLSearchParams({
      title,
      limit: String(OPEN_LIBRARY_LIMIT)
    });
    if (author?.trim()) {
      openLibraryParams.set("author", author.trim());
    }
    const openLibraryResponse = await fetch(`https://openlibrary.org/search.json?${openLibraryParams.toString()}`, {
      headers: OUTBOUND_FETCH_HEADERS
    });

    if (openLibraryResponse.ok) {
      const data = (await openLibraryResponse.json()) as OpenLibrarySearchJson;
      const covers = (data.docs ?? [])
        .filter((doc) => typeof doc.cover_i === "number")
        .map((doc) => `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`)
        .slice(0, RESULT_LIMIT);

      if (covers.length > 0) {
        return covers;
      }
    }

    const googleQuery = author?.trim() ? `intitle:${title} inauthor:${author.trim()}` : title;
    const googleBooksResponse = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleQuery)}&maxResults=10`,
      { headers: OUTBOUND_FETCH_HEADERS }
    );

    if (!googleBooksResponse.ok) {
      // No lanzamos error: el cliente ya muestra "no se encontraron portadas" con lista vacía.
      console.warn(
        "[ReadTracker] CoversService: Google Books respondió",
        googleBooksResponse.status,
        googleBooksResponse.statusText
      );
      return [];
    }

    const googleData = (await googleBooksResponse.json()) as GoogleBooksJson;

    return (googleData.items ?? [])
      .map(
        (item) =>
          item.volumeInfo?.imageLinks?.thumbnail ?? item.volumeInfo?.imageLinks?.smallThumbnail
      )
      .filter((url): url is string => typeof url === "string")
      .map((url) => url.replace("http://", "https://"))
      .slice(0, RESULT_LIMIT);
  }
}
