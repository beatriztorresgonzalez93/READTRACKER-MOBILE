// Capa de acceso a datos en PostgreSQL (Neon) para libros.
import { randomUUID } from "crypto";
import { pool } from "../config/db";
import { Book, BookListPageFilters, BookSortKey, CreateBookDto, LibrarySummaryDto, UpdateBookDto } from "../types/book";

interface BookRow {
  id: string;
  title: string;
  author: string;
  publisher: string;
  genre: string;
  pages: number | null;
  publication_year: number | null;
  status: Book["status"];
  rating: number | null;
  review: string | null;
  review_tags: string[] | null;
  synopsis: string | null;
  read_at: string | null;
  times_read: string | null;
  favorite_quote: string | null;
  would_recommend: "si" | "depende" | "no" | null;
  progress: number | null;
  current_page: number | null;
  last_page_marked_at: Date | null;
  cover_url: string | null;
  is_favorite: boolean;
  created_at: Date;
  updated_at: Date;
}

const mapRow = (row: BookRow): Book => ({
  id: row.id,
  title: row.title,
  author: row.author,
  publisher: row.publisher,
  genre: row.genre,
  pages: row.pages ?? undefined,
  publicationYear: row.publication_year ?? undefined,
  status: row.status,
  rating: row.rating ?? undefined,
  review: row.review ?? undefined,
  reviewTags: row.review_tags ?? undefined,
  synopsis: row.synopsis ?? undefined,
  readAt: row.read_at ?? undefined,
  timesRead: row.times_read ?? undefined,
  favoriteQuote: row.favorite_quote ?? undefined,
  wouldRecommend: row.would_recommend ?? undefined,
  progress: row.progress ?? undefined,
  currentPage: row.current_page ?? undefined,
  lastPageMarkedAt: row.last_page_marked_at?.toISOString(),
  coverUrl: row.cover_url ?? undefined,
  isFavorite: row.is_favorite,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString()
});

const orderByClause = (sort: BookSortKey) => {
  switch (sort) {
    case "titulo":
      return "ORDER BY title ASC";
    case "autor":
      return "ORDER BY author ASC";
    case "genero":
      return "ORDER BY genre ASC";
    case "valoracion":
      return "ORDER BY rating DESC NULLS LAST, created_at DESC";
    default:
      return "ORDER BY created_at DESC";
  }
};

const buildWhereFragments = (
  userId: string,
  search?: string | null,
  hookStatus?: string | null,
  shelf?: string | null,
  genre?: string | null
): { where: string; values: unknown[] } => {
  const parts: string[] = ["user_id = $1"];
  const values: unknown[] = [userId];
  let i = 2;

  const s = search?.replace(/\u200B|\uFEFF/g, "").trim();
  if (s) {
    const pattern = `%${s}%`;
    const yearMatch = s.match(/\b(19|20)\d{2}\b/);
    const yearFromSearch = yearMatch ? Number.parseInt(yearMatch[0], 10) : Number.NaN;
    const hasYearFromSearch = Number.isInteger(yearFromSearch);
    parts.push(
      hasYearFromSearch
        ? `(title ILIKE $${i} OR author ILIKE $${i} OR publisher ILIKE $${i} OR genre ILIKE $${i} OR publication_year::text ILIKE $${i} OR publication_year = $${i + 1})`
        : `(title ILIKE $${i} OR author ILIKE $${i} OR publisher ILIKE $${i} OR genre ILIKE $${i} OR publication_year::text ILIKE $${i})`
    );
    if (hasYearFromSearch) {
      values.push(pattern, yearFromSearch);
      i += 2;
    } else {
      values.push(pattern);
      i += 1;
    }
  }

  const hs = hookStatus?.trim();
  if (hs && hs !== "todos") {
    parts.push(`status = $${i}`);
    values.push(hs);
    i += 1;
  }

  const sh = shelf?.trim() ?? "todos";
  if (sh !== "todos") {
    if (sh === "favoritos") {
      parts.push("is_favorite = true");
    } else {
      parts.push(`status = $${i}`);
      values.push(sh);
      i += 1;
    }
  }

  const g = genre?.trim();
  if (g) {
    parts.push(`LOWER(TRIM(genre)) = LOWER(TRIM($${i}))`);
    values.push(g);
    i += 1;
  }

  return { where: parts.join(" AND "), values };
};

export class BooksRepository {
  async listPage(
    userId: string,
    filters: BookListPageFilters,
    limit: number,
    offset: number
  ): Promise<{ rows: Book[]; total: number }> {
    const { where, values } = buildWhereFragments(
      userId,
      filters.search,
      filters.hookStatus,
      filters.shelf,
      filters.genre ?? null
    );
    const order = orderByClause(filters.sort);

    const countResult = await pool.query<{ c: string }>(`SELECT COUNT(*)::int AS c FROM books WHERE ${where}`, values);
    const total = Number(countResult.rows[0]?.c ?? 0);

    const limIdx = values.length + 1;
    const offIdx = values.length + 2;
    const dataResult = await pool.query<BookRow>(
      `SELECT * FROM books WHERE ${where} ${order} LIMIT $${limIdx} OFFSET $${offIdx}`,
      [...values, limit, offset]
    );
    return { rows: dataResult.rows.map(mapRow), total };
  }

  async getLibrarySummary(userId: string): Promise<LibrarySummaryDto> {
    const agg = await pool.query<{
      total: string;
      pendiente: string;
      leyendo: string;
      leido: string;
      favoritos: string;
      rated_sum: string;
      rated_count: string;
      latest_year: string;
    }>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'pendiente')::int AS pendiente,
         COUNT(*) FILTER (WHERE status = 'leyendo')::int AS leyendo,
         COUNT(*) FILTER (WHERE status = 'leido')::int AS leido,
         COUNT(*) FILTER (WHERE is_favorite = true)::int AS favoritos,
         COALESCE(SUM(rating) FILTER (WHERE status = 'leido' AND rating IS NOT NULL), 0)::float AS rated_sum,
         COUNT(*) FILTER (WHERE status = 'leido' AND rating IS NOT NULL AND rating > 0)::int AS rated_count,
         COALESCE(MAX(EXTRACT(YEAR FROM updated_at))::int, EXTRACT(YEAR FROM CURRENT_DATE)::int) AS latest_year
       FROM books
       WHERE user_id = $1`,
      [userId]
    );
    const row = agg.rows[0];
    const genresResult = await pool.query<{ genre: string; c: string }>(
      `SELECT TRIM(genre) AS genre, COUNT(*)::int AS c
       FROM books
       WHERE user_id = $1 AND TRIM(genre) <> ''
       GROUP BY TRIM(genre)
       ORDER BY c DESC, genre ASC`,
      [userId]
    );
    const genres = genresResult.rows.map((r) => ({ genre: r.genre, count: Number(r.c) }));
    return {
      total: Number(row?.total ?? 0),
      pendiente: Number(row?.pendiente ?? 0),
      leyendo: Number(row?.leyendo ?? 0),
      leido: Number(row?.leido ?? 0),
      favoritos: Number(row?.favoritos ?? 0),
      ratedSum: Number(row?.rated_sum ?? 0),
      ratedCount: Number(row?.rated_count ?? 0),
      latestYear: Number(row?.latest_year ?? new Date().getFullYear()),
      genres
    };
  }

  async findById(id: string, userId: string): Promise<Book | undefined> {
    const result = await pool.query<BookRow>(
      "SELECT * FROM books WHERE id = $1 AND user_id = $2 LIMIT 1",
      [id, userId]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async create(data: CreateBookDto, userId: string): Promise<Book> {
    const id = randomUUID();
    const result = await pool.query<BookRow>(
      `INSERT INTO books (id, user_id, title, author, publisher, genre, pages, publication_year, status, rating, review, review_tags, synopsis, read_at, times_read, favorite_quote, would_recommend, progress, current_page, last_page_marked_at, cover_url, is_favorite)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [
        id,
        userId,
        data.title,
        data.author,
        data.publisher,
        data.genre,
        data.pages ?? null,
        data.publicationYear ?? null,
        data.status,
        data.rating ?? null,
        data.review ?? null,
        data.reviewTags ?? [],
        data.synopsis ?? null,
        data.readAt ?? null,
        data.timesRead ?? null,
        data.favoriteQuote ?? null,
        data.wouldRecommend ?? null,
        data.progress ?? null,
        data.currentPage ?? null,
        data.lastPageMarkedAt ? new Date(data.lastPageMarkedAt) : null,
        data.coverUrl ?? null,
        data.isFavorite ?? false
      ]
    );
    return mapRow(result.rows[0]);
  }

  async update(id: string, data: UpdateBookDto, userId: string): Promise<Book | undefined> {
    const setParts: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const add = (column: string, value: unknown) => {
      setParts.push(`${column} = $${idx}`);
      values.push(value);
      idx += 1;
    };

    if (data.title !== undefined) add("title", data.title);
    if (data.author !== undefined) add("author", data.author);
    if (data.publisher !== undefined) add("publisher", data.publisher);
    if (data.genre !== undefined) add("genre", data.genre);
    if (data.pages !== undefined) add("pages", data.pages);
    if (data.publicationYear !== undefined) add("publication_year", data.publicationYear);
    if (data.status !== undefined) add("status", data.status);
    if (data.rating !== undefined) add("rating", data.rating);
    if (data.review !== undefined) add("review", data.review);
    if (data.reviewTags !== undefined) add("review_tags", data.reviewTags);
    if (data.synopsis !== undefined) add("synopsis", data.synopsis);
    if (data.readAt !== undefined) add("read_at", data.readAt);
    if (data.timesRead !== undefined) add("times_read", data.timesRead);
    if (data.favoriteQuote !== undefined) add("favorite_quote", data.favoriteQuote);
    if (data.wouldRecommend !== undefined) add("would_recommend", data.wouldRecommend);
    if (data.progress !== undefined) add("progress", data.progress);
    if (data.currentPage !== undefined) add("current_page", data.currentPage);
    if (data.lastPageMarkedAt !== undefined) add("last_page_marked_at", data.lastPageMarkedAt ? new Date(data.lastPageMarkedAt) : null);
    if (data.coverUrl !== undefined) add("cover_url", data.coverUrl);
    if (data.isFavorite !== undefined) add("is_favorite", data.isFavorite);

    add("updated_at", new Date());

    const result = await pool.query<BookRow>(
      `UPDATE books
       SET ${setParts.join(", ")}
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING *`,
      [...values, id, userId]
    );

    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query("DELETE FROM books WHERE id = $1 AND user_id = $2", [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}
