// Cliente de endpoints de libros, filtros y operaciones asociadas.
import { apiRequest } from "@/shared/api/client";
import { normalizeBook, normalizeBookDetail } from "@/shared/lib/normalize-book";
import type {
  BookDetail,
  BooksSummary,
  CreateReadingSessionPayload,
  Book,
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
  const container = "data" in response && response.data ? response.data : response;
  const c = container as Record<string, unknown>;
  const raw = c.book ?? c.item ?? c.data ?? container;
  return normalizeBookDetail(raw);
}

export async function createReadingSession(
  token: string,
  payload: CreateReadingSessionPayload,
): Promise<void> {
  const currentPage = Math.max(1, Math.round(payload.currentPage));
  const previousPage = payload.previousPage != null ? Math.max(0, Math.round(payload.previousPage)) : undefined;
  const attempts: { path: string; body: Record<string, unknown> }[] = [
    {
      path: "/reading-sessions",
      body: {
        bookId: payload.bookId,
        currentPage,
        previousPage,
        recordedAt: payload.recordedAt,
      },
    },
    {
      path: "/reading-sessions",
      body: {
        book_id: payload.bookId,
        current_page: currentPage,
        previous_page: previousPage,
        recorded_at: payload.recordedAt,
      },
    },
    {
      path: `/books/${payload.bookId}/reading-sessions`,
      body: {
        currentPage,
        previousPage,
        recordedAt: payload.recordedAt,
      },
    },
    {
      path: `/books/${payload.bookId}/reading-sessions`,
      body: {
        current_page: currentPage,
        previous_page: previousPage,
        recorded_at: payload.recordedAt,
      },
    },
  ];

  let lastError: Error | null = null;
  for (const attempt of attempts) {
    try {
      await apiRequest(attempt.path, {
        method: "POST",
        token,
        body: attempt.body,
      });
      return;
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError ?? new Error("No se pudo guardar la sesion de lectura.");
}

export async function updateBookStatus(
  token: string,
  bookId: string,
  status: NonNullable<Book["status"]>,
): Promise<BookDetail> {
  const englishStatusMap: Record<NonNullable<Book["status"]>, string> = {
    pendiente: "pending",
    leyendo: "reading",
    leido: "read",
  };
  const statusEn = englishStatusMap[status];

  const attempts: {
    method: "PATCH" | "PUT";
    path: string;
    body: Record<string, unknown>;
  }[] = [
    { method: "PATCH", path: `/books/${bookId}`, body: { status } },
    { method: "PATCH", path: `/books/${bookId}`, body: { status: statusEn } },
    { method: "PATCH", path: `/books/${bookId}`, body: { readingStatus: status } },
    { method: "PATCH", path: `/books/${bookId}`, body: { readingStatus: statusEn } },
    { method: "PATCH", path: `/books/${bookId}`, body: { state: status } },
    { method: "PATCH", path: `/books/${bookId}`, body: { state: statusEn } },
    { method: "PATCH", path: `/books/${bookId}/status`, body: { status } },
    { method: "PATCH", path: `/books/${bookId}/status`, body: { status: statusEn } },
    { method: "PATCH", path: `/books/${bookId}/status`, body: { readingStatus: status } },
    { method: "PATCH", path: `/books/${bookId}/status`, body: { readingStatus: statusEn } },
    { method: "PUT", path: `/books/${bookId}`, body: { status } },
    { method: "PUT", path: `/books/${bookId}`, body: { status: statusEn } },
    { method: "PUT", path: `/books/${bookId}/status`, body: { status } },
    { method: "PUT", path: `/books/${bookId}/status`, body: { status: statusEn } },
  ];

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const response = await apiRequest<{ data?: unknown } | Record<string, unknown>>(attempt.path, {
        method: attempt.method,
        token,
        body: attempt.body,
      });
      const container = "data" in response && response.data ? response.data : response;
      const c = container as Record<string, unknown>;
      const raw = c.book ?? c.item ?? c.data ?? container;
      return normalizeBookDetail(raw);
    } catch (error) {
      errors.push((error as Error).message);
    }
  }

  const uniqueErrors = [...new Set(errors)].filter(Boolean);
  throw new Error(uniqueErrors[0] ?? "No se pudo actualizar el estado del libro.");
}

export type CreateBookPayload = {
  title: string;
  author: string;
  pages?: number;
  publishedYear?: number;
  genre?: string;
  publisher?: string;
  description?: string;
  coverUrl?: string;
  status?: NonNullable<Book["status"]>;
};

export async function createBook(token: string, payload: CreateBookPayload): Promise<BookDetail> {
  const attempts: { path: string; body: Record<string, unknown> }[] = [
    {
      path: "/books",
      body: {
        title: payload.title,
        author: payload.author,
        pages: payload.pages,
        pageCount: payload.pages,
        publishedYear: payload.publishedYear,
        publicationYear: payload.publishedYear,
        year: payload.publishedYear,
        published_date: payload.publishedYear,
        published_at: payload.publishedYear,
        genre: payload.genre,
        publisher: payload.publisher,
        editorial: payload.publisher,
        description: payload.description,
        synopsis: payload.description,
        sinopsis: payload.description,
        resumen: payload.description,
        coverUrl: payload.coverUrl,
        imageUrl: payload.coverUrl,
        cover: payload.coverUrl,
        status: payload.status ?? "pendiente",
        readingStatus: payload.status ?? "pendiente",
      },
    },
    {
      path: "/books",
      body: {
        title: payload.title,
        author: payload.author,
        pages: payload.pages,
        publishedYear: payload.publishedYear,
        genre: payload.genre,
        publisher: payload.publisher,
        description: payload.description,
        coverUrl: payload.coverUrl,
        status: payload.status ?? "pendiente",
      },
    },
    {
      path: "/books",
      body: {
        title: payload.title,
        author: payload.author,
        pageCount: payload.pages,
        year: payload.publishedYear,
        publicationYear: payload.publishedYear,
        genre: payload.genre,
        editorial: payload.publisher,
        synopsis: payload.description,
        imageUrl: payload.coverUrl,
        cover: payload.coverUrl,
        readingStatus: payload.status ?? "pendiente",
      },
    },
  ];

  const expectsPublishedYear = Number.isFinite(payload.publishedYear);
  const expectsDescription = Boolean(payload.description?.trim());
  let lastError: Error | null = null;
  const persistenceErrors: string[] = [];
  for (const attempt of attempts) {
    try {
      const response = await apiRequest<{ data?: unknown } | Record<string, unknown>>(attempt.path, {
        method: "POST",
        token,
        body: attempt.body,
      });
      const container = "data" in response && response.data ? response.data : response;
      const c = container as Record<string, unknown>;
      const raw = c.book ?? c.item ?? c.data ?? container;
      const created = normalizeBookDetail(raw);

      if (expectsPublishedYear && created.publishedYear !== payload.publishedYear) {
        persistenceErrors.push(`POST ${attempt.path} -> publication year not persisted`);
        continue;
      }
      if (expectsDescription && !created.description?.trim()) {
        persistenceErrors.push(`POST ${attempt.path} -> synopsis not persisted`);
        continue;
      }

      return created;
    } catch (error) {
      lastError = error as Error;
    }
  }
  if (persistenceErrors.length > 0) {
    throw new Error(persistenceErrors[0]);
  }
  throw lastError ?? new Error("No se pudo crear el libro.");
}

export type UpdateBookPayload = {
  title?: string;
  author?: string;
  pages?: number;
  publishedYear?: number;
  genre?: string;
  publisher?: string;
  description?: string;
  reviewText?: string;
  rating?: number;
  readAt?: string;
  timesRead?: string;
  favoriteQuote?: string;
  wouldRecommend?: "si" | "depende" | "no";
  reviewTags?: string[];
  coverUrl?: string;
  isFavorite?: boolean;
  status?: NonNullable<Book["status"]>;
};

export async function updateBook(token: string, bookId: string, payload: UpdateBookPayload): Promise<BookDetail> {
  const clean = (obj: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

  const toWebDto = (statusOverride?: NonNullable<Book["status"]>) =>
    clean({
      title: payload.title,
      author: payload.author,
      publisher: payload.publisher,
      genre: payload.genre,
      pages: payload.pages,
      publicationYear: payload.publishedYear,
      status: statusOverride ?? payload.status,
      synopsis: payload.description,
      review: payload.reviewText,
      rating: payload.rating,
      readAt: payload.readAt,
      timesRead: payload.timesRead,
      favoriteQuote: payload.favoriteQuote,
      wouldRecommend: payload.wouldRecommend,
      reviewTags: payload.reviewTags,
      coverUrl: payload.coverUrl,
      isFavorite: payload.isFavorite,
    });

  const verifyPersisted = async () => {
    const fresh = await getBookById(token, bookId);
    if (Number.isFinite(payload.publishedYear) && fresh.publishedYear !== payload.publishedYear) {
      throw new Error("publication year not persisted");
    }
    if (payload.description?.trim() && !fresh.description?.trim()) {
      throw new Error("synopsis not persisted");
    }
    return fresh;
  };

  const tryPutUpdate = async (body: Record<string, unknown>) => {
    await apiRequest<{ data?: unknown } | Record<string, unknown>>(`/books/${bookId}`, {
      method: "PUT",
      token,
      body,
    });
    return verifyPersisted();
  };

  try {
    return await tryPutUpdate(toWebDto());
  } catch (error) {
    const firstError = (error as Error).message;
    if (!/already read/i.test(firstError)) {
      throw new Error(firstError || "No se pudo actualizar el libro.");
    }

    try {
      await updateBookStatus(token, bookId, "leyendo");
    } catch (unlockError) {
      throw new Error(`unlock-status -> ${(unlockError as Error).message}`);
    }

    try {
      return await tryPutUpdate(toWebDto("leyendo"));
    } catch (retryError) {
      throw new Error((retryError as Error).message || "No se pudo actualizar el libro.");
    }
  }
}

export async function deleteBook(token: string, bookId: string): Promise<void> {
  await apiRequest(`/books/${bookId}`, {
    method: "DELETE",
    token,
  });
}

