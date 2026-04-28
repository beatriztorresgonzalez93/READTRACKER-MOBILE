import { apiRequest } from "@/shared/api/client";
import { normalizeBook, normalizeBookDetail } from "@/shared/lib/normalize-book";
import type {
  BookDetail,
  BooksSummary,
  CreateReadingSessionPayload,
  LibraryBooksQuery,
  PaginatedBooks,
} from "@/shared/types/books";

type PaginationPayload = {
  total?: number;
  limit?: number;
  offset?: number;
};

function toBooksPage(payload: unknown, offset: number, limit: number): PaginatedBooks {
  if (Array.isArray(payload)) {
    const items = (payload as unknown[]).map((row) => normalizeBook(row));
    return { items, offset, limit, total: items.length, hasMore: items.length === limit };
  }

  const response = payload as {
    data?: unknown[];
    books?: unknown[];
    items?: unknown[];
    pagination?: PaginationPayload;
    meta?: PaginationPayload;
  };

  const rawItems = response.data ?? response.books ?? response.items ?? [];
  const items = rawItems.map((row) => normalizeBook(row));
  const pagination = response.pagination ?? response.meta;
  const normalizedOffset = pagination?.offset ?? offset;
  const normalizedLimit = pagination?.limit ?? limit;
  const total = pagination?.total ?? items.length;
  const hasMore = normalizedOffset + items.length < total;

  return {
    items,
    offset: normalizedOffset,
    total,
    limit: normalizedLimit,
    hasMore,
  };
}

function buildBooksListQueryString(offset: number, limit: number, query: LibraryBooksQuery): string {
  const q = new URLSearchParams();
  if (query.search.trim()) q.set("search", query.search.trim());
  q.set("status", query.status);
  q.set("shelf", query.shelf);
  if (query.genre?.trim()) q.set("genre", query.genre.trim());
  q.set("sort", query.sort);
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  return q.toString();
}

export async function getBooksPage(
  token: string,
  offset: number,
  limit = 12,
  listQuery: LibraryBooksQuery,
): Promise<PaginatedBooks> {
  const qs = buildBooksListQueryString(offset, limit, listQuery);
  const response = await apiRequest<unknown>(`/books?${qs}`, { token });
  return toBooksPage(response, offset, limit);
}

export async function getBooksSummary(token: string): Promise<BooksSummary> {
  const response = await apiRequest<{ data?: BooksSummary } | BooksSummary>("/books/summary", { token });
  if ("data" in response && response.data) return response.data;
  return response as BooksSummary;
}

export async function getBookById(token: string, bookId: string): Promise<BookDetail> {
  const response = await apiRequest<{ data?: unknown } | Record<string, unknown>>(`/books/${bookId}`, { token });
  const raw = "data" in response && response.data ? response.data : response;
  return normalizeBookDetail(raw);
}

export async function createReadingSession(
  token: string,
  payload: CreateReadingSessionPayload,
): Promise<void> {
  await apiRequest("/reading-sessions", {
    method: "POST",
    token,
    body: payload,
  });
}

