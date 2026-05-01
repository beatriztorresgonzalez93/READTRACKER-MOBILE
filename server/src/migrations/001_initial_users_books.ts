// Migración inicial: crea tablas base de usuarios y libros.
import { Migration } from "./types";

export const migration001InitialUsersBooks: Migration = {
  version: "001",
  name: "initial_users_books",
  up: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        publisher TEXT NOT NULL DEFAULT '',
        genre TEXT NOT NULL,
        pages INTEGER,
        status TEXT NOT NULL CHECK (status IN ('pendiente', 'leyendo', 'leido')),
        rating INTEGER,
        review TEXT,
        review_tags TEXT[] DEFAULT '{}'::TEXT[],
        read_at TEXT,
        times_read TEXT,
        favorite_quote TEXT,
        would_recommend TEXT,
        progress INTEGER,
        current_page INTEGER,
        last_page_marked_at TIMESTAMPTZ,
        cover_url TEXT,
        is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS publication_year INTEGER;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS pages INTEGER;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS publisher TEXT NOT NULL DEFAULT '';
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS current_page INTEGER;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS last_page_marked_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS synopsis TEXT;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS read_at TEXT;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS times_read TEXT;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS favorite_quote TEXT;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS would_recommend TEXT;
    `);

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS review_tags TEXT[] DEFAULT '{}'::TEXT[];
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
    `);
  }
};
