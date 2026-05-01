import { randomUUID } from "crypto";
// Acceso a datos de sesiones de lectura con reglas de dedupe y recálculo.
import { pool } from "../config/db";
import { CreateReadingSessionDto, ReadingSession } from "../types/readingSession";

interface ReadingSessionRow {
  id: string;
  user_id: string;
  book_id: string;
  title: string;
  author: string;
  previous_page: number | null;
  current_page: number;
  pages_read: number;
  recorded_at: Date;
  created_at: Date;
}

const mapRow = (row: ReadingSessionRow): ReadingSession => ({
  id: row.id,
  userId: row.user_id,
  bookId: row.book_id,
  title: row.title,
  author: row.author,
  previousPage: row.previous_page,
  currentPage: row.current_page,
  pagesRead: row.pages_read,
  recordedAt: row.recorded_at.toISOString(),
  createdAt: row.created_at.toISOString()
});

export class ReadingSessionsRepository {
  async findAllByUserId(userId: string): Promise<ReadingSession[]> {
    const result = await pool.query<ReadingSessionRow>(
      `SELECT rs.id, rs.user_id, rs.book_id, b.title, b.author, rs.previous_page, rs.current_page, rs.pages_read, rs.recorded_at, rs.created_at
       FROM reading_sessions rs
       INNER JOIN books b ON b.id = rs.book_id
       WHERE rs.user_id = $1
       ORDER BY rs.recorded_at DESC, rs.created_at DESC`,
      [userId]
    );
    return result.rows.map(mapRow);
  }

  async create(userId: string, data: CreateReadingSessionDto): Promise<ReadingSession | null> {
    const book = await pool.query<{ id: string }>(
      "SELECT id FROM books WHERE id = $1 AND user_id = $2 LIMIT 1",
      [data.bookId, userId]
    );
    if (!book.rows[0]) return null;

    const previousPage = data.previousPage ?? null;
    const pagesRead = Math.max(0, data.currentPage - (previousPage ?? 0));
    const recordedAt = data.recordedAt ? new Date(data.recordedAt) : new Date();

    const result = await pool.query<ReadingSessionRow>(
      `INSERT INTO reading_sessions (id, user_id, book_id, previous_page, current_page, pages_read, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, book_id, current_page, recorded_at) DO NOTHING
       RETURNING id, user_id, book_id, previous_page, current_page, pages_read, recorded_at, created_at`,
      [randomUUID(), userId, data.bookId, previousPage, data.currentPage, pagesRead, recordedAt]
    );

    let session = result.rows[0];
    if (!session) {
      const existing = await pool.query<ReadingSessionRow>(
        `SELECT id, user_id, book_id, previous_page, current_page, pages_read, recorded_at, created_at
         FROM reading_sessions
         WHERE user_id = $1 AND book_id = $2 AND current_page = $3 AND recorded_at = $4
         LIMIT 1`,
        [userId, data.bookId, data.currentPage, recordedAt]
      );
      session = existing.rows[0];
    }
    if (!session) return null;

    const bookMeta = await pool.query<{ title: string; author: string }>(
      "SELECT title, author FROM books WHERE id = $1 LIMIT 1",
      [session.book_id]
    );
    const meta = bookMeta.rows[0];
    return mapRow({
      ...session,
      title: meta?.title ?? "",
      author: meta?.author ?? ""
    });
  }

  async deleteById(userId: string, sessionId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const sessionResult = await client.query<{
        id: string;
        book_id: string;
      }>(
        "SELECT id, book_id FROM reading_sessions WHERE id = $1 AND user_id = $2 LIMIT 1",
        [sessionId, userId]
      );
      const session = sessionResult.rows[0];
      if (!session) {
        await client.query("ROLLBACK");
        return false;
      }

      await client.query("DELETE FROM reading_sessions WHERE id = $1 AND user_id = $2", [
        sessionId,
        userId
      ]);

      const latestResult = await client.query<{
        current_page: number;
        recorded_at: Date;
      }>(
        `SELECT current_page, recorded_at
         FROM reading_sessions
         WHERE user_id = $1 AND book_id = $2
         ORDER BY recorded_at DESC, created_at DESC
         LIMIT 1`,
        [userId, session.book_id]
      );
      const latest = latestResult.rows[0];

      const bookResult = await client.query<{ pages: number | null }>(
        "SELECT pages FROM books WHERE id = $1 AND user_id = $2 LIMIT 1",
        [session.book_id, userId]
      );
      const pages = bookResult.rows[0]?.pages ?? null;

      let progress = 0;
      let currentPage: number | null = null;
      let lastPageMarkedAt: Date | null = null;

      if (latest) {
        currentPage = latest.current_page;
        lastPageMarkedAt = latest.recorded_at;
        if (typeof pages === "number" && pages > 0) {
          progress = Math.round(Math.max(0, Math.min(100, (currentPage / pages) * 100)));
        }
      }

      await client.query(
        `UPDATE books
         SET current_page = $1,
             progress = $2,
             last_page_marked_at = $3,
             updated_at = $4
         WHERE id = $5 AND user_id = $6`,
        [currentPage, progress, lastPageMarkedAt, new Date(), session.book_id, userId]
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
