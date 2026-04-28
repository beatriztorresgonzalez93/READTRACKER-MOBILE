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
  if (s === "pendiente" || s === "leyendo" || s === "leido") return s;
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
    updatedAt: pickString(r.updatedAt) ?? pickString(r.updated_at),
    lastPageMarkedAt: pickString(r.lastPageMarkedAt) ?? pickString(r.last_page_marked_at) ?? null,
  };
}

export function normalizeBookDetail(raw: unknown): BookDetail {
  const base = normalizeBook(raw);
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const r = raw as Record<string, unknown>;
  const description = pickString(r.description) ?? pickString(r.summary);
  const progressPercent = pickNumber(r.progressPercent) ?? pickNumber(r.progress_percent);
  return {
    ...base,
    description,
    progressPercent: progressPercent ?? base.progress,
  };
}
