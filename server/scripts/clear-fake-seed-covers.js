/* eslint-disable no-console */
/**
 * Quita URLs de portada inventadas del seed (Open Library sin imagen real).
 * La app mostrará color + título automáticamente.
 *
 *   node scripts/clear-fake-seed-covers.js --email tu@correo.com
 */
require("dotenv").config();
const { Pool } = require("pg");

async function main() {
  const email = process.argv
    .slice(2)
    .find((a, i, arr) => a === "--email" && arr[i + 1])
    ? process.argv[process.argv.indexOf("--email") + 1]?.trim().toLowerCase()
    : process.env.SEED_USER_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error("Indica --email tu@correo.com");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta DATABASE_URL en server/.env");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const user = await pool.query(
    "SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1",
    [email],
  );
  const userId = user.rows[0]?.id;
  if (!userId) throw new Error(`Usuario no encontrado: ${email}`);

  const result = await pool.query(
    `UPDATE books
     SET cover_url = NULL, updated_at = NOW()
     WHERE user_id = $1
       AND cover_url ~* 'covers\\.openlibrary\\.org/b/isbn/97884083[0-9]{5}'`,
    [userId],
  );

  console.log(`Portadas ficticias limpiadas: ${result.rowCount ?? 0} libros`);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
