// Enriquecimiento y descubrimiento de metadatos vía IA en el backend (Groq, etc.).
import { env } from "@/shared/config/env";
import type { BookMetadataFromIsbn } from "@/shared/lib/lookup-book-by-isbn";

export type EnrichedBookMetadata = Pick<
  BookMetadataFromIsbn,
  "title" | "author" | "publisher" | "pages" | "publishedYear" | "genre" | "description"
>;

type ApiResponse<T> = { data?: T };
type ApiErrorBody = { code?: string; message?: string; error?: string };

async function postMetadata<T>(token: string, path: string, body: unknown): Promise<T | null> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  let parsed: ApiErrorBody | null = null;
  const raw = await response.text();
  if (raw.trim()) {
    try {
      parsed = JSON.parse(raw) as ApiErrorBody;
    } catch {
      /* ignore */
    }
  }

  if (response.status === 503 && parsed?.code === "AI_NOT_CONFIGURED") {
    return null;
  }

  // Servidor en Render aún sin desplegar /books/metadata/* → no romper el escaneo.
  if (response.status === 404 && parsed?.code === "NOT_FOUND") {
    return null;
  }

  if (response.status === 404 && parsed?.code === "BOOK_NOT_FOUND") {
    return null;
  }

  if (!response.ok) {
    const message =
      (parsed?.message ?? parsed?.error ?? raw.slice(0, 300)) || `Error ${response.status}`;
    throw new Error(message);
  }

  if (!raw.trim()) {
    return null;
  }

  const json = JSON.parse(raw) as ApiResponse<T>;
  return json.data ?? null;
}

export async function enrichBookMetadataWithAi(
  token: string,
  metadata: BookMetadataFromIsbn,
): Promise<EnrichedBookMetadata | null> {
  return postMetadata<EnrichedBookMetadata>(token, "/books/metadata/enrich", {
    isbn: metadata.isbn,
    title: metadata.title,
    author: metadata.author,
    publisher: metadata.publisher,
    pages: metadata.pages,
    publishedYear: metadata.publishedYear,
    genre: metadata.genre,
    description: metadata.description,
  });
}

export async function discoverBookFromIsbnWithAi(
  token: string,
  isbn: string,
): Promise<EnrichedBookMetadata | null> {
  return postMetadata<EnrichedBookMetadata>(token, "/books/metadata/discover-isbn", { isbn });
}
