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

  if (response.status === 503) {
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = (await response.json()) as ApiErrorBody;
    } catch {
      /* ignore */
    }
    if (parsed?.code === "AI_NOT_CONFIGURED") {
      return null;
    }
  }

  if (!response.ok) {
    const raw = await response.text();
    let message = raw.slice(0, 300);
    try {
      const parsed = JSON.parse(raw) as ApiErrorBody;
      message = parsed.message ?? parsed.error ?? message;
    } catch {
      /* ignore */
    }
    const err = new Error(message || `Error ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  const json = (await response.json()) as ApiResponse<T>;
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
