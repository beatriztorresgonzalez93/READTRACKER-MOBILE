// Migración de sesiones: crea tabla reading_sessions e índices de soporte.
import { Migration } from "./types";

export const migration003ReadingSessions: Migration = {
  version: "003",
  name: "reading_sessions",
  up: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        previous_page INTEGER,
        current_page INTEGER NOT NULL CHECK (current_page >= 0),
        pages_read INTEGER NOT NULL DEFAULT 0 CHECK (pages_read >= 0),
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_recorded_at ON reading_sessions(user_id, recorded_at DESC);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_sessions_dedupe
      ON reading_sessions(user_id, book_id, current_page, recorded_at);
    `);
  }
};
