// Normaliza respuestas de libros de la API a tipos internos.
import { resolveBookCoverUrl } from "@/shared/lib/resolve-media-url";
import type { Book, BookDetail } from "@/shared/types/books";

function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function pickNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function pickYear(v: unknown): number | undefined {
  const direct = pickNumber(v);
  if (direct && direct >= 1000 && direct <= 9999) return direct;
  if (typeof v === "string" && v.trim()) {
    const raw = v.trim();
    const parsedDate = new Date(raw);
    if (!Number.isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      if (year >= 1000 && year <= 9999) return year;
    }
    const match = raw.match(/\b(1[0-9]{3}|20[0-9]{2}|2100)\b/);
    if (match) return Number(match[1]);
  }
  return undefined;
}

function pickCoverRaw(r: Record<string, unknown>): string | undefined {
  return (
    pickString(r.coverUrl) ??
    pickString(r.cover_url) ??
    pickString(r.cover) ??
    pickString(r.imageUrl) ??
    pickString(r.image_url) ??
    pickString(r.image)
  );
}

function normalizeStatus(v: unknown): Book["status"] | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.toLowerCase();
  if (s === "pendiente" || s === "pending") return "pendiente";
  if (s === "leyendo" || s === "reading" || s === "in_progress" || s === "in progress") return "leyendo";
  if (s === "leido" || s === "read" || s === "completed") return "leido";
  return undefined;
}

function pickProgress(r: Record<string, unknown>): number | undefined {
  const direct =
    pickNumber(r.progress) ??
    pickNumber(r.progressPercent) ??
    pickNumber(r.progress_percent) ??
    pickNumber(r.progress_pct);
  return direct;
}

function pickStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const values = v
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return values.length > 0 ? values : undefined;
}

function pickStringFromObject(v: unknown, keys: string[]): string | undefined {
  if (!v || typeof v !== "object") return undefined;
  const record = v as Record<string, unknown>;
  for (const key of keys) {
    const value = pickString(record[key]);
    if (value) return value;
  }
  return undefined;
}

function pickReviewText(r: Record<string, unknown>): string | undefined {
  return (
    pickString(r.review) ??
    pickString(r.reviewText) ??
    pickString(r.review_text) ??
    pickString(r.resena) ??
    pickString(r.reseña)
  );
}

export function normalizeBook(raw: unknown): Book {
  if (!raw || typeof raw !== "object") {
    return { id: "", title: "Sin titulo" };
  }
  const r = raw as Record<string, unknown>;
  const coverRaw = pickCoverRaw(r);
  const coverUrl = coverRaw ? resolveBookCoverUrl(coverRaw) : null;

  const fav = r.isFavorite ?? r.is_favorite;
  const isFavorite = typeof fav === "boolean" ? fav : undefined;

  return {
    id: String(r.id ?? ""),
    title: pickString(r.title) ?? "Sin titulo",
    author: pickString(r.author),
    coverUrl: coverUrl ?? undefined,
    pages: pickNumber(r.pages),
    progress: pickProgress(r),
    status: normalizeStatus(r.status),
    genre: pickString(r.genre),
    rating: r.rating === null ? null : pickNumber(r.rating),
    isFavorite,
    publishedYear:
      pickYear(r.publishedYear) ??
      pickYear(r.published_year) ??
      pickYear(r.publishedDate) ??
      pickYear(r.published_date) ??
      pickYear(r.publicationYear) ??
      pickYear(r.publication_year) ??
      pickYear(r.publishedAt) ??
      pickYear(r.published_at) ??
      pickYear(r.publicationDate) ??
      pickYear(r.publication_date) ??
      pickYear(r.releaseDate) ??
      pickYear(r.release_date) ??
      pickYear(r.year),
    updatedAt: pickString(r.updatedAt) ?? pickString(r.updated_at),
    lastPageMarkedAt: pickString(r.lastPageMarkedAt) ?? pickString(r.last_page_marked_at) ?? null,
    tags:
      pickStringArray(r.tags) ??
      pickStringArray(r.etiquetas) ??
      pickStringArray(r.tagNames) ??
      pickStringArray(r.tag_names) ??
      pickStringArray(r.reviewTags) ??
      pickStringArray(r.review_tags),
    publisher:
      pickString(r.publisher) ??
      pickString(r.editorial) ??
      pickString(r.publisher_name) ??
      pickString(r.publisherName) ??
      pickStringFromObject(r.publisher, ["name", "nombre", "title"]) ??
      pickStringFromObject(r.editorial, ["name", "nombre", "title"]),
    reviewText: pickReviewText(r),
  };
}

export function normalizeBookDetail(raw: unknown): BookDetail {
  const base = normalizeBook(raw);
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const r = raw as Record<string, unknown>;
  const description =
    pickString(r.description) ??
    pickString(r.descripcion) ??
    pickString(r.resumen) ??
    pickString(r.summary) ??
    pickString(r.overview) ??
    pickString(r.plot) ??
    pickString(r.plotSummary) ??
    pickString(r.plot_summary) ??
    pickString(r.synopsis) ??
    pickString(r.sinopsis) ??
    pickString(r.blurb);
  const progressPercent = pickNumber(r.progressPercent) ?? pickNumber(r.progress_percent);
  const readCount = pickNumber(r.readCount) ?? pickNumber(r.read_count) ?? pickNumber(r.timesRead) ?? pickNumber(r.times_read);
  const readAt =
    pickString(r.readAt) ??
    pickString(r.read_at) ??
    pickString(r.lastReadAt) ??
    pickString(r.last_read_at) ??
    pickString(r.finishedAt) ??
    pickString(r.finished_at);
  const timesRead =
    pickString(r.timesRead) ??
    pickString(r.times_read) ??
    pickString(r.readTimes) ??
    pickString(r.read_times);
  const favoriteQuote =
    pickString(r.favoriteQuote) ??
    pickString(r.favorite_quote) ??
    pickString(r.favoriteCitation) ??
    pickString(r.favorite_citation);
  const recommendation =
    pickString(r.wouldRecommend) ??
    pickString(r.would_recommend) ??
    pickString(r.recommendation) ??
    pickString(r.recommendationText) ??
    pickString(r.recommendation_text);
  return {
    ...base,
    description,
    progressPercent: progressPercent ?? base.progress,
    readCount,
    readAt,
    timesRead,
    favoriteQuote,
    recommendation,
  };
}
