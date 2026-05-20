// ISBN → APIs públicas → corrección local → IA (Groq) en servidor.
import {
  BookMetadataApiError,
  discoverBookFromIsbnWithAi,
  enrichBookMetadataWithAi,
} from "@/shared/api/book-metadata-api";
import {
  enrichBookMetadataLocally,
  isTranslationApiNoise,
  sanitizeBookDescription,
} from "@/shared/lib/enrich-book-metadata-local";
import { guessTextLanguage, IsbnLookupError, lookupBookByIsbn, type BookMetadataFromIsbn } from "@/shared/lib/lookup-book-by-isbn";
import { isbnCoverUrl, normalizeIsbn } from "@/shared/lib/isbn-utils";

export type ResolveBookFromIsbnOptions = {
  token?: string | null;
  onStage?: (stage: "lookup" | "prepare" | "ai") => void;
};

function metadataFromAi(
  isbn: string,
  enriched: NonNullable<Awaited<ReturnType<typeof enrichBookMetadataWithAi>>>,
): BookMetadataFromIsbn {
  return {
    isbn,
    title: enriched.title?.trim() ?? "",
    author: enriched.author?.trim() ?? "",
    publisher: enriched.publisher?.trim() ?? "",
    pages: enriched.pages?.trim() ?? "",
    publishedYear: enriched.publishedYear?.trim() ?? "",
    genre: enriched.genre?.trim() ?? "",
    description: sanitizeBookDescription(enriched.description ?? ""),
    coverUrls: [isbnCoverUrl(isbn)],
  };
}

function applyEnrichedFields(
  base: BookMetadataFromIsbn,
  enriched: Partial<BookMetadataFromIsbn>,
): BookMetadataFromIsbn {
  const aiDescription = sanitizeBookDescription(enriched.description ?? "");
  const useAiDescription =
    aiDescription.length >= 15 &&
    !isTranslationApiNoise(aiDescription) &&
    guessTextLanguage(aiDescription) === "es";

  // Título/autor ya vienen de APIs o ISBN: la IA solo corrige sinopsis y género.
  const lockIdentity = Boolean(base.title?.trim() && base.author?.trim());

  return {
    ...base,
    title: lockIdentity ? base.title : enriched.title?.trim() || base.title,
    author: lockIdentity ? base.author : enriched.author?.trim() || base.author,
    publisher: lockIdentity ? base.publisher : enriched.publisher?.trim() || base.publisher,
    pages: enriched.pages?.trim() || base.pages,
    publishedYear: enriched.publishedYear?.trim() || base.publishedYear,
    genre: enriched.genre?.trim() || base.genre,
    description: useAiDescription ? aiDescription : base.description,
    coverUrls: base.coverUrls?.length ? base.coverUrls : enriched.coverUrls ?? base.coverUrls,
  };
}

async function tryFillFromAiByIsbn(
  isbn: string,
  token: string,
): Promise<BookMetadataFromIsbn | null> {
  const emptyPayload: BookMetadataFromIsbn = {
    isbn,
    title: "",
    author: "",
    publisher: "",
    pages: "",
    publishedYear: "",
    genre: "",
    description: "",
    coverUrls: [isbnCoverUrl(isbn)],
  };

  try {
    let enriched = await discoverBookFromIsbnWithAi(token, isbn);
    if (!enriched?.title?.trim()) {
      enriched = await enrichBookMetadataWithAi(token, emptyPayload);
    }

    if (!enriched?.title?.trim()) return null;
    return metadataFromAi(isbn, enriched);
  } catch (error) {
    if (error instanceof BookMetadataApiError) {
      throw error;
    }
    return null;
  }
}

async function lookupWithAiFallback(
  isbn: string,
  token: string | null | undefined,
): Promise<BookMetadataFromIsbn> {
  try {
    return await lookupBookByIsbn(isbn);
  } catch (error) {
    if (!(error instanceof IsbnLookupError) || !token?.trim()) {
      throw error;
    }

    try {
      const fromAi = await tryFillFromAiByIsbn(isbn, token);
      if (fromAi) return fromAi;
    } catch (error) {
      if (error instanceof BookMetadataApiError) {
        if (error.code === "AI_NOT_CONFIGURED") {
          throw new IsbnLookupError(
            "El servidor no tiene la clave de IA activa. En Render: Environment → GROQ_API_KEY (gsk_…) y GROQ_MODEL → Save, Clear build cache & Deploy.",
          );
        }
        if (error.code === "ROUTE_NOT_FOUND") {
          throw new IsbnLookupError(
            "El servidor en Render no tiene el código nuevo. Cambia la rama de deploy a version-pro (o fusiona con main) y redespliega.",
          );
        }
      }
      throw error;
    }

    throw new IsbnLookupError(
      "No encontramos este ISBN en bases públicas y la IA no pudo identificarlo. Puedes rellenar el formulario a mano.",
    );
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

  metadata = {
    ...metadata,
    description: sanitizeBookDescription(metadata.description),
  };

  if (options.token?.trim()) {
    options.onStage?.("ai");
    try {
      const enriched = await enrichBookMetadataWithAi(options.token, metadata);
      if (enriched) {
        metadata = applyEnrichedFields(metadata, enriched);
      }
    } catch {
      /* sin IA en servidor */
    }
  }

  const needsLocal =
    !metadata.genre?.trim() ||
    !metadata.description?.trim() ||
    (metadata.description && guessTextLanguage(metadata.description) !== "es");

  if (needsLocal) {
    options.onStage?.("prepare");
    metadata = await enrichBookMetadataLocally(metadata);
  }

  return metadata;
}
