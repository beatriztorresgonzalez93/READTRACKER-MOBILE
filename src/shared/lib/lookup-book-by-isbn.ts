// Metadatos de libro por ISBN: Open Library (edición, obra, búsqueda) + Google Books.
import { Platform } from "react-native";

import { isbnCoverUrl, normalizeIsbn } from "@/shared/lib/isbn-utils";

export type BookMetadataFromIsbn = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  pages: string;
  publishedYear: string;
  genre: string;
  description: string;
  coverUrls: string[];
};

const FETCH_TIMEOUT_MS = 22_000;
const MAX_DESCRIPTION_CHARS = 4_000;

const OUTBOUND_HEADERS: Record<string, string> = {
  Accept: "application/json",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  "User-Agent":
    Platform.OS === "android"
      ? "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 ReadTracker/1.0"
      : "ReadTracker/1.0 (compatible; book-metadata)",
};

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: OUTBOUND_HEADERS, signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractYear(publishDate?: string | number): string {
  if (publishDate == null) return "";
  const text = String(publishDate);
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

export function flattenDescription(value: unknown): string {
  if (typeof value === "string") return stripHtml(value.trim());
  if (value && typeof value === "object" && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    return typeof inner === "string" ? stripHtml(inner.trim()) : "";
  }
  return "";
}

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_DESCRIPTION_CHARS);
}

type DescriptionCandidate = {
  text: string;
  /** Código ISO de Google Books u otra fuente (p. ej. "es", "en"). */
  lang?: string;
};

/** Preferimos español; inglés antes que francés u otros. */
export function guessTextLanguage(text: string): "es" | "en" | "fr" | "other" {
  const sample = text.slice(0, 800).toLowerCase();
  const spanishHits = (sample.match(/\b(el|la|los|las|del|de|que|con|una|por|para|como|más|pero|también|libro|novela|año|está|son|fue)\b/g) ?? [])
    .length;
  const frenchHits = (sample.match(/\b(le|la|les|des|une|dans|pour|avec|est|sont|cette|roman|livre|été|très|pas)\b/g) ?? [])
    .length;
  const hasSpanishAccents = /[ñáéíóúü¿¡]/i.test(text);

  if ((spanishHits >= 3 && spanishHits > frenchHits) || (hasSpanishAccents && spanishHits >= 2)) {
    return "es";
  }
  if (frenchHits >= 3 && frenchHits > spanishHits) return "fr";
  if (/\b(the|and|with|from|this|that|book|novel|was|were|his|her)\b/i.test(sample)) return "en";
  return "other";
}

function languagePriority(lang: string | undefined, text: string): number {
  const code = (lang ?? "").trim().toLowerCase().slice(0, 2);
  if (code === "es") return 100;
  const guessed = guessTextLanguage(text);
  if (guessed === "es") return 95;
  if (code === "en" || guessed === "en") return 60;
  if (guessed === "fr" || code === "fr") return 15;
  return 40;
}

export function pickBestDescription(candidates: DescriptionCandidate[]): string {
  const valid = candidates.map((c) => ({ ...c, text: c.text.trim() })).filter((c) => c.text.length > 0);
  if (valid.length === 0) return "";

  valid.sort((a, b) => {
    const scoreA = languagePriority(a.lang, a.text) + Math.min(a.text.length / 200, 15);
    const scoreB = languagePriority(b.lang, b.text) + Math.min(b.text.length / 200, 15);
    return scoreB - scoreA;
  });

  return valid[0].text;
}

type OpenLibraryAuthor = { name?: string };
type OpenLibraryPublisher = { name?: string };
type OpenLibrarySubject = { name?: string };

type OpenLibraryBookEntry = {
  title?: string;
  authors?: OpenLibraryAuthor[];
  publishers?: OpenLibraryPublisher[];
  number_of_pages?: number;
  publish_date?: string;
  subjects?: OpenLibrarySubject[];
  description?: unknown;
  covers?: number[];
};

type OpenLibraryBooksResponse = Record<string, OpenLibraryBookEntry | undefined>;

type OpenLibraryIsbnEdition = {
  title?: string;
  authors?: { name?: string }[];
  publishers?: string[];
  number_of_pages?: number;
  publish_date?: string;
  subjects?: { name?: string }[] | string[];
  works?: { key?: string }[];
  covers?: number[];
};

type OpenLibraryWork = {
  description?: unknown;
  subjects?: { name?: string }[] | string[];
};

type OpenLibrarySearchDoc = {
  title?: string;
  author_name?: string[];
  publisher?: string[];
  number_of_pages_median?: number;
  first_publish_year?: number;
  subject?: string[];
  cover_i?: number;
  isbn?: string[];
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDoc[];
};

type GoogleIndustryIdentifier = {
  type?: string;
  identifier?: string;
};

type GoogleVolumeInfo = {
  title?: string;
  authors?: string[];
  publisher?: string;
  pageCount?: number;
  publishedDate?: string;
  categories?: string[];
  description?: string;
  language?: string;
  industryIdentifiers?: GoogleIndustryIdentifier[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    medium?: string;
    large?: string;
  };
};

type GoogleBooksResponse = {
  items?: { volumeInfo?: GoogleVolumeInfo }[];
};

/** Metadatos internos al fusionar (no se devuelven al formulario). */
type PartialWithDescLang = Partial<BookMetadataFromIsbn> & {
  descriptionLang?: string;
  /** true si Google Books declaró este ISBN en industryIdentifiers */
  isbnMatch?: boolean;
};

function googleVolumeMatchesIsbn(info: GoogleVolumeInfo, isbn: string): boolean {
  const target = normalizeIsbn(isbn);
  if (!target) return false;
  return (info.industryIdentifiers ?? []).some(
    (id) => normalizeIsbn(id.identifier ?? "") === target,
  );
}

function openLibraryDocMatchesIsbn(doc: OpenLibrarySearchDoc, isbn: string): boolean {
  const target = normalizeIsbn(isbn);
  if (!target) return false;
  return (doc.isbn ?? []).some((listed) => normalizeIsbn(listed) === target);
}

function coverUrlsFromOpenLibrary(isbn: string, coverId?: number): string[] {
  const urls: string[] = [isbnCoverUrl(isbn)];
  if (typeof coverId === "number" && coverId > 0) {
    urls.unshift(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`);
  }
  return [...new Set(urls)];
}

function googleCoverUrls(info: GoogleVolumeInfo): string[] {
  const thumb =
    info.imageLinks?.large ??
    info.imageLinks?.medium ??
    info.imageLinks?.thumbnail ??
    info.imageLinks?.smallThumbnail;
  if (!thumb) return [];
  return [thumb.replace("http://", "https://").replace("&edge=curl", "")];
}

function partialFromOpenLibraryEntry(isbn: string, entry: OpenLibraryBookEntry): Partial<BookMetadataFromIsbn> {
  const authors = (entry.authors ?? [])
    .map((a) => a.name?.trim())
    .filter((name): name is string => Boolean(name));
  const subjects = (entry.subjects ?? [])
    .map((s) => s.name?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);

  return {
    isbn,
    title: entry.title?.trim() ?? "",
    author: authors.join(", "),
    publisher: entry.publishers?.[0]?.name?.trim() ?? "",
    pages: entry.number_of_pages != null && entry.number_of_pages > 0 ? String(entry.number_of_pages) : "",
    publishedYear: extractYear(entry.publish_date),
    genre: subjects.join(", "),
    description: flattenDescription(entry.description),
    coverUrls: coverUrlsFromOpenLibrary(isbn, entry.covers?.[0]),
  };
}

async function lookupOpenLibraryBooksApi(isbn: string): Promise<Partial<BookMetadataFromIsbn>> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
  const data = await fetchJson<OpenLibraryBooksResponse>(url);
  const entry = data?.[`ISBN:${isbn}`];
  if (!entry?.title?.trim()) return {};
  return partialFromOpenLibraryEntry(isbn, entry);
}

async function lookupOpenLibraryWorkDescription(workKey: string): Promise<string> {
  const key = workKey.startsWith("/") ? workKey : `/${workKey}`;
  const work = await fetchJson<OpenLibraryWork>(`https://openlibrary.org${key}.json`);
  return flattenDescription(work?.description);
}

function subjectsToGenre(subjects: OpenLibraryIsbnEdition["subjects"]): string {
  if (!subjects?.length) return "";
  const names = subjects
    .map((s) => (typeof s === "string" ? s : s.name))
    .filter((n): n is string => Boolean(n?.trim()))
    .slice(0, 3);
  return names.join(", ");
}

async function lookupOpenLibraryIsbnEdition(isbn: string): Promise<Partial<BookMetadataFromIsbn>> {
  const edition = await fetchJson<OpenLibraryIsbnEdition>(`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`);
  if (!edition?.title?.trim()) return {};

  const authors = (edition.authors ?? [])
    .map((a) => a.name?.trim())
    .filter((name): name is string => Boolean(name));

  let description = "";
  const workKey = edition.works?.[0]?.key;
  if (workKey) {
    description = await lookupOpenLibraryWorkDescription(workKey);
  }

  return {
    isbn,
    title: edition.title.trim(),
    author: authors.join(", "),
    publisher: edition.publishers?.[0]?.trim() ?? "",
    pages: edition.number_of_pages != null && edition.number_of_pages > 0 ? String(edition.number_of_pages) : "",
    publishedYear: extractYear(edition.publish_date),
    genre: subjectsToGenre(edition.subjects),
    description,
    coverUrls: coverUrlsFromOpenLibrary(isbn, edition.covers?.[0]),
  };
}

async function lookupOpenLibrarySearch(isbn: string): Promise<Partial<BookMetadataFromIsbn>> {
  const params = new URLSearchParams({
    isbn,
    limit: "5",
    fields: "title,author_name,publisher,first_publish_year,number_of_pages_median,subject,cover_i",
  });
  const data = await fetchJson<OpenLibrarySearchResponse>(
    `https://openlibrary.org/search.json?${params.toString()}`,
  );
  const doc =
    data?.docs?.find((d) => d.title?.trim() && openLibraryDocMatchesIsbn(d, isbn)) ??
    data?.docs?.find((d) => d.title?.trim()) ??
    data?.docs?.[0];
  if (!doc?.title?.trim()) return {};

  return {
    isbn,
    title: doc.title.trim(),
    author: (doc.author_name ?? []).slice(0, 4).join(", "),
    publisher: doc.publisher?.[0]?.trim() ?? "",
    pages:
      doc.number_of_pages_median != null && doc.number_of_pages_median > 0
        ? String(doc.number_of_pages_median)
        : "",
    publishedYear: doc.first_publish_year != null ? String(doc.first_publish_year) : "",
    genre: (doc.subject ?? []).slice(0, 3).join(", "),
    description: "",
    coverUrls: coverUrlsFromOpenLibrary(isbn, doc.cover_i),
  };
}

function partialFromGoogleVolume(
  isbn: string,
  info: GoogleVolumeInfo,
  options?: { isbnMatch?: boolean },
): PartialWithDescLang {
  const covers = googleCoverUrls(info);
  const lang = info.language?.trim().toLowerCase().slice(0, 2);
  return {
    isbn,
    title: info.title?.trim() ?? "",
    author: (info.authors ?? []).join(", "),
    publisher: info.publisher?.trim() ?? "",
    pages: info.pageCount != null && info.pageCount > 0 ? String(info.pageCount) : "",
    publishedYear: extractYear(info.publishedDate),
    genre: (info.categories ?? []).slice(0, 3).join(", "),
    description: info.description ? stripHtml(info.description) : "",
    descriptionLang: lang,
    coverUrls: covers.length > 0 ? covers : [isbnCoverUrl(isbn)],
    isbnMatch: options?.isbnMatch ?? googleVolumeMatchesIsbn(info, isbn),
  };
}

async function lookupGoogleBooksByIsbn(isbn: string, langRestrict?: string): Promise<PartialWithDescLang> {
  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    maxResults: "5",
    printType: "books",
  });
  if (langRestrict) params.set("langRestrict", langRestrict);

  const data = await fetchJson<GoogleBooksResponse>(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
  );
  const items = data?.items ?? [];
  if (items.length === 0) return {};

  const infos = items
    .map((item) => item.volumeInfo)
    .filter((info): info is GoogleVolumeInfo => Boolean(info?.title?.trim()));

  const matched = infos.filter((info) => googleVolumeMatchesIsbn(info, isbn));
  const pool = matched.length > 0 ? matched : infos;

  const partials = pool.map((info) =>
    partialFromGoogleVolume(isbn, info, { isbnMatch: matched.length > 0 }),
  );

  return mergeManyPartials(isbn, partials);
}

async function lookupGoogleBooksByTitleAuthor(
  isbn: string,
  title: string,
  author: string,
  langRestrict?: string,
): Promise<PartialWithDescLang> {
  const query = [title.trim(), author.trim()].filter(Boolean).join(" ");
  if (!query) return {};

  const params = new URLSearchParams({ q: query, maxResults: "8", printType: "books" });
  if (langRestrict) params.set("langRestrict", langRestrict);

  const data = await fetchJson<GoogleBooksResponse>(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
  );
  const partials = (data?.items ?? [])
    .map((item) => item.volumeInfo)
    .filter((info): info is GoogleVolumeInfo => Boolean(info?.description?.trim() || info?.title?.trim()))
    .map((info) => partialFromGoogleVolume(isbn, info));

  return mergeManyPartials(isbn, partials);
}

function descriptionCandidatesFromPartials(partials: PartialWithDescLang[]): DescriptionCandidate[] {
  return partials
    .filter((p) => p.description?.trim())
    .map((p) => ({
      text: p.description!.trim(),
      lang: p.descriptionLang,
    }));
}

export function mergeManyPartials(isbn: string, partials: PartialWithDescLang[]): PartialWithDescLang {
  const valid = partials.filter((p) => p.title?.trim() || p.author?.trim() || p.description?.trim());
  if (valid.length === 0) return {};

  const trusted = valid.filter((p) => p.isbnMatch);
  const pool = trusted.length > 0 ? trusted : valid;

  const title = pool.map((p) => p.title?.trim() ?? "").find(Boolean) ?? "";
  const author = pool.map((p) => p.author?.trim() ?? "").find(Boolean) ?? "";

  return {
    isbn,
    title,
    author,
    publisher: pool.map((p) => p.publisher?.trim() ?? "").find(Boolean) ?? "",
    pages: pool.map((p) => p.pages?.trim() ?? "").find(Boolean) ?? "",
    publishedYear: pool.map((p) => p.publishedYear?.trim() ?? "").find(Boolean) ?? "",
    genre: pool.map((p) => p.genre?.trim() ?? "").find(Boolean) ?? "",
    description: pickBestDescription(descriptionCandidatesFromPartials(pool)),
    coverUrls: [...new Set(pool.flatMap((p) => p.coverUrls ?? []))],
  };
}

function mergeTwo(
  a: Partial<BookMetadataFromIsbn>,
  b: Partial<BookMetadataFromIsbn>,
  isbn: string,
): BookMetadataFromIsbn {
  return mergeManyPartials(isbn, [a, b]) as BookMetadataFromIsbn;
}

export class IsbnLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IsbnLookupError";
  }
}

export async function lookupBookByIsbn(rawIsbn: string): Promise<BookMetadataFromIsbn> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) {
    throw new IsbnLookupError("ISBN no válido. Escanea el código de barras del libro (978… o 979…).");
  }

  const [
    olBooksApi,
    olIsbnEdition,
    olSearch,
    googleIsbn,
    googleIsbnEs,
  ] = await Promise.all([
    lookupOpenLibraryBooksApi(isbn),
    lookupOpenLibraryIsbnEdition(isbn),
    lookupOpenLibrarySearch(isbn),
    lookupGoogleBooksByIsbn(isbn),
    lookupGoogleBooksByIsbn(isbn, "es"),
  ]);

  // Google (especialmente langRestrict=es) antes que Open Library para la sinopsis.
  // Sinopsis solo desde Google al inicio; Open Library aporta título/autor/portada (suele venir en francés).
  let merged = mergeManyPartials(isbn, [
    googleIsbnEs,
    googleIsbn,
    { ...olBooksApi, description: "" },
    olSearch,
    { ...olIsbnEdition, description: "" },
  ]) as BookMetadataFromIsbn;

  const needsSpanishDescription =
    !merged.description?.trim() ||
    guessTextLanguage(merged.description) === "fr" ||
    guessTextLanguage(merged.description) === "other";

  if (needsSpanishDescription && merged.title?.trim()) {
    const byTitleEs = await lookupGoogleBooksByTitleAuthor(isbn, merged.title, merged.author, "es");
    merged = mergeTwo(merged, byTitleEs, isbn);
  }

  if (
    merged.description?.trim() &&
    guessTextLanguage(merged.description) !== "es" &&
    merged.title?.trim()
  ) {
    const byTitleEs = await lookupGoogleBooksByTitleAuthor(isbn, merged.title, merged.author, "es");
    const esDesc = byTitleEs.description?.trim();
    if (esDesc && guessTextLanguage(esDesc) === "es") {
      merged = { ...merged, description: esDesc };
    }
  }

  if (!merged.description?.trim() && merged.title?.trim()) {
    const workKey = (await fetchJson<OpenLibraryIsbnEdition>(
      `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`,
    ))?.works?.[0]?.key;
    if (workKey) {
      const fromWork = await lookupOpenLibraryWorkDescription(workKey);
      const workLang = fromWork ? guessTextLanguage(fromWork) : "other";
      if (fromWork && workLang !== "fr") {
        merged = { ...merged, description: fromWork };
      }
    }
  }

  if (!merged.description?.trim() && olIsbnEdition.description?.trim()) {
    const olDesc = olIsbnEdition.description.trim();
    if (guessTextLanguage(olDesc) !== "fr") {
      merged = { ...merged, description: olDesc };
    }
  }

  if (!merged.title?.trim()) {
    throw new IsbnLookupError(
      "No encontramos datos para ese ISBN. Algunos libros nuevos en español aún no están en las bases públicas; puedes rellenar el formulario a mano.",
    );
  }

  if (!merged.coverUrls?.length) {
    merged.coverUrls = [isbnCoverUrl(isbn)];
  }

  return merged;
}
