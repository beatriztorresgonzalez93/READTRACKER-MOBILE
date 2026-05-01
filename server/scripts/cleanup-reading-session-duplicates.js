/* eslint-disable no-console */
require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en las variables de entorno");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const deletedResult = await client.query(`
      WITH duplicates AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, book_id, current_page, recorded_at
            ORDER BY created_at DESC, id DESC
          ) AS rn
        FROM reading_sessions
      )
      DELETE FROM reading_sessions rs
      USING duplicates d
      WHERE rs.id = d.id
        AND d.rn > 1
      RETURNING rs.id;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_sessions_dedupe
      ON reading_sessions(user_id, book_id, current_page, recorded_at);
    `);

    await client.query("COMMIT");
    console.log(
      `[cleanup-reading-session-duplicates] Sesiones duplicadas eliminadas: ${deletedResult.rowCount ?? 0}`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[cleanup-reading-session-duplicates] Error limpiando duplicados:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void run();
