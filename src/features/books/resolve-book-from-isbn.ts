// ISBN → APIs públicas → IA (Groq) → traducción local si hace falta.
import {
  discoverBookFromIsbnWithAi,
  enrichBookMetadataWithAi,
} from "@/shared/api/book-metadata-api";
import { enrichBookMetadataLocally } from "@/shared/lib/enrich-book-metadata-local";
import {
  IsbnLookupError,
  guessTextLanguage,
  lookupBookByIsbn,
  type BookMetadataFromIsbn,
} from "@/shared/lib/lookup-book-by-isbn";
import { isbnCoverUrl, normalizeIsbn } from "@/shared/lib/isbn-utils";

export type ResolveBookFromIsbnOptions = {
  token?: string | null;
  onStage?: (stage: "lookup" | "prepare" | "ai") => void;
};

function applyEnrichedFields(
  base: BookMetadataFromIsbn,
  enriched: Partial<BookMetadataFromIsbn>,
  options?: { preferAiDescription?: boolean },
): BookMetadataFromIsbn {
  const aiDescription = enriched.description?.trim() ?? "";
  const baseDescription = base.description?.trim() ?? "";
  let description = baseDescription;

  if (aiDescription) {
    if (options?.preferAiDescription) {
      description = aiDescription;
    } else if (aiDescription.length >= 20) {
      description = aiDescription;
    } else if (baseDescription && guessTextLanguage(baseDescription) !== "es") {
      description = aiDescription;
    } else if (guessTextLanguage(aiDescription) === "es") {
      description = aiDescription;
    }
  }

  return {
    ...base,
    title: enriched.title?.trim() || base.title,
    author: enriched.author?.trim() || base.author,
    publisher: enriched.publisher?.trim() || base.publisher,
    pages: enriched.pages?.trim() || base.pages,
    publishedYear: enriched.publishedYear?.trim() || base.publishedYear,
    genre: enriched.genre?.trim() || base.genre,
    description,
    coverUrls: base.coverUrls?.length ? base.coverUrls : enriched.coverUrls ?? base.coverUrls,
  };
}

async function lookupFromPublicApis(isbn: string): Promise<BookMetadataFromIsbn> {
  return lookupBookByIsbn(isbn);
}

async function lookupWithAiFallback(
  isbn: string,
  token: string | null | undefined,
): Promise<BookMetadataFromIsbn> {
  try {
    return await lookupFromPublicApis(isbn);
  } catch (error) {
    if (!(error instanceof IsbnLookupError) || !token?.trim()) {
      throw error;
    }

    const discovered = await discoverBookFromIsbnWithAi(token, isbn);
    if (!discovered?.title?.trim()) {
      throw error;
    }

    return {
      isbn,
      title: discovered.title.trim(),
      author: discovered.author?.trim() ?? "",
      publisher: discovered.publisher?.trim() ?? "",
      pages: discovered.pages?.trim() ?? "",
      publishedYear: discovered.publishedYear?.trim() ?? "",
      genre: discovered.genre?.trim() ?? "",
      description: discovered.description?.trim() ?? "",
      coverUrls: [isbnCoverUrl(isbn)],
    };
  }
}

export async function resolveBookFromIsbn(
  rawIsbn: string,
  options: ResolveBookFromIsbnOptions = {},
): Promise<BookMetadataFromIsbn> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) {
    throw new IsbnLookupError("ISBN no válido. Escanea el código de barras del libro (978… o 979…).");
  }

  options.onStage?.("lookup");
  let metadata = await lookupWithAiFallback(isbn, options.token);

  if (options.token?.trim()) {
    options.onStage?.("ai");
    try {
      const enriched = await enrichBookMetadataWithAi(options.token, metadata);
      if (enriched) {
        metadata = applyEnrichedFields(metadata, enriched, { preferAiDescription: true });
      }
    } catch {
      /* sigue con local */
    }

    const descriptionOk =
      !metadata.description?.trim() || guessTextLanguage(metadata.description) === "es";
    if (metadata.genre?.trim() && descriptionOk) {
      return metadata;
    }
  }

  options.onStage?.("prepare");
  return enrichBookMetadataLocally(metadata);
}
