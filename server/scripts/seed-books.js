/* eslint-disable no-console */
/**
 * Genera libros de prueba en PostgreSQL (no hace falta un JSON externo).
 *
 * Uso (desde server/ con DATABASE_URL en .env):
 *   node scripts/seed-books.js --email tu@correo.com
 *   node scripts/seed-books.js --email tu@correo.com --count 500
 *   node scripts/seed-books.js --user-id <uuid-local> --reset
 *   node scripts/seed-books.js --email tu@correo.com --write-json   # opcional: guarda server/seed/books-seed.json
 *
 * Variables de entorno:
 *   SEED_USER_EMAIL, SEED_USER_ID, SEED_COUNT (default 1000), SEED_RESET=true
 */
require("dotenv").config();
const { randomUUID } = require("crypto");
const { writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");
const { Pool } = require("pg");

const DEFAULT_COUNT = 1000;
const PROGRESS_EVERY = 100;
const STATUSES = ["pendiente", "leyendo", "leido"];
const GENRES = [
  "Novela",
  "Fantasía",
  "Thriller",
  "Ciencia ficción",
  "Romance",
  "Histórica",
  "Ensayo",
  "Biografía",
  "Misterio",
  "Juvenil",
  "Poesía",
  "Distopía",
];
const AUTHORS = [
  "Rebecca Yarros",
  "Sarah J. Maas",
  "Guillermo del Toro",
  "Cornelia Funke",
  "Javier Marías",
  "Julia Navarro",
  "Arturo Pérez-Reverte",
  "Elena Poniatowska",
  "Carlos Ruiz Zafón",
  "Isabel Allende",
  "Gabriel García Márquez",
  "Miguel de Cervantes",
  "Juan Gómez-Jurado",
  "Dolores Redondo",
  "Lucía Lijtmaer",
  "Samantha Shannon",
  "Brandon Sanderson",
  "Ursula K. Le Guin",
  "Tolkien",
  "Stephen King",
];
const PUBLISHERS = ["Planeta", "Booket", "Alfaguara", "Debolsillo", "Tusquets", "Anagrama", "Siruela", "Nova"];
const TITLE_STEMS = [
  "Alas de",
  "El jardín de",
  "La sombra del",
  "Crónicas de",
  "Memorias de",
  "El último",
  "La casa de",
  "Hijos de",
  "La ciudad",
  "El secreto de",
  "Cuando",
  "Bajo el cielo de",
  "La luz de",
  "Tras la tormenta",
  "El mapa de",
];
const TITLE_NOUNS = [
  "sangre",
  "hierro",
  "cristal",
  "ceniza",
  "mar",
  "invierno",
  "verano",
  "silencio",
  "trueno",
  "niebla",
  "fuego",
  "viento",
  "arena",
  "sombras",
  "estrellas",
  "laberinto",
  "puente",
  "reino",
  "profecía",
  "aurora",
];

function parseArgs(argv) {
  const out = { count: DEFAULT_COUNT, reset: false, writeJson: false, email: null, userId: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--reset") out.reset = true;
    else if (arg === "--write-json") out.writeJson = true;
    else if (arg === "--count" && argv[i + 1]) {
      out.count = Math.max(1, Math.min(10_000, Number.parseInt(argv[++i], 10) || DEFAULT_COUNT));
    } else if (arg === "--email" && argv[i + 1]) {
      out.email = argv[++i].trim().toLowerCase();
    } else if (arg === "--user-id" && argv[i + 1]) {
      out.userId = argv[++i].trim();
    }
  }
  if (!out.email && process.env.SEED_USER_EMAIL) {
    out.email = process.env.SEED_USER_EMAIL.trim().toLowerCase();
  }
  if (!out.userId && process.env.SEED_USER_ID) {
    out.userId = process.env.SEED_USER_ID.trim();
  }
  if (process.env.SEED_COUNT) {
    const n = Number.parseInt(process.env.SEED_COUNT, 10);
    if (Number.isFinite(n) && n > 0) out.count = Math.min(10_000, n);
  }
  if (process.env.SEED_RESET === "true") out.reset = true;
  return out;
}

function pick(arr, index) {
  return arr[index % arr.length];
}

/** Todos los libros del seed quedan en pendiente (no mezcla leyendo/leído). */
function generateBooks(count) {
  const books = [];
  const now = Date.now();

  for (let i = 0; i < count; i += 1) {
    const stem = pick(TITLE_STEMS, i * 3);
    const noun = pick(TITLE_NOUNS, i * 7 + 11);
    const suffix = i % 17 === 0 ? ` (${1 + (i % 3)})` : "";
    const title = `${stem} ${noun}${suffix}`.replace(/\s+/g, " ").trim();
    const author = pick(AUTHORS, i * 5 + 2);
    const genre = pick(GENRES, i * 13);
    const pages = 180 + (i % 620);
    const publicationYear = 1995 + (i % 30);
    const isFavorite = i % 23 === 0;
    const createdAt = new Date(now - i * 3_600_000).toISOString();

    books.push({
      id: randomUUID(),
      title,
      author,
      publisher: pick(PUBLISHERS, i),
      genre,
      pages,
      publicationYear,
      status: "pendiente",
      rating: null,
      review: null,
      reviewTags: [],
      synopsis:
        i % 4 === 0
          ? `Sinopsis de prueba para «${title}». Un argumento de ejemplo para medir listas largas y recargas en la biblioteca.`
          : null,
      readAt: null,
      timesRead: null,
      favoriteQuote: null,
      wouldRecommend: null,
      progress: null,
      currentPage: null,
      lastPageMarkedAt: null,
      coverUrl: null,
      isFavorite,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return books;
}

const INSERT_BOOK_SQL = `
  INSERT INTO books (
    id, user_id, title, author, publisher, genre, pages, publication_year,
    status, rating, review, review_tags, synopsis, read_at, times_read,
    favorite_quote, would_recommend, progress, current_page, last_page_marked_at,
    cover_url, is_favorite, created_at, updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8,
    $9, $10, $11, $12, $13, $14, $15,
    $16, $17, $18, $19, $20,
    $21, $22, $23, $24
  )
`;

function bookInsertParams(b, userId) {
  return [
    b.id,
    userId,
    b.title,
    b.author,
    b.publisher,
    b.genre,
    b.pages,
    b.publicationYear,
    b.status,
    b.rating,
    b.review,
    b.reviewTags,
    b.synopsis,
    b.readAt,
    b.timesRead,
    b.favoriteQuote,
    b.wouldRecommend,
    b.progress,
    b.currentPage,
    b.lastPageMarkedAt ? new Date(b.lastPageMarkedAt) : null,
    b.coverUrl,
    b.isFavorite,
    new Date(b.createdAt),
    new Date(b.updatedAt),
  ];
}

async function resolveUserId(client, { email, userId }) {
  if (userId) {
    const byId = await client.query("SELECT id, email FROM users WHERE id = $1 LIMIT 1", [userId]);
    if (!byId.rows[0]) throw new Error(`No hay usuario con id ${userId}`);
    return byId.rows[0].id;
  }
  if (email) {
    const byEmail = await client.query(
      "SELECT id, email FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1",
      [email],
    );
    if (!byEmail.rows[0]) {
      throw new Error(
        `No hay usuario con email ${email}. Inicia sesión una vez en la app para crear el usuario local.`,
      );
    }
    return byEmail.rows[0].id;
  }
  throw new Error("Indica --email tu@correo.com o --user-id <uuid> (o SEED_USER_EMAIL / SEED_USER_ID en .env)");
}

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta DATABASE_URL en server/.env");
  }

  const args = parseArgs(process.argv);
  const books = generateBooks(args.count);

  if (args.writeJson) {
    const dir = join(__dirname, "..", "seed");
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "books-seed.json");
    writeFileSync(path, JSON.stringify({ generatedAt: new Date().toISOString(), count: books.length, books }, null, 2));
    console.log(`JSON guardado en ${path}`);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    const userId = await resolveUserId(client, args);
    console.log(`Usuario destino: ${userId}`);
    console.log(`Libros a insertar: ${books.length}`);

    await client.query("BEGIN");

    if (args.reset) {
      const deleted = await client.query("DELETE FROM books WHERE user_id = $1", [userId]);
      console.log(`Eliminados ${deleted.rowCount ?? 0} libros previos de ese usuario.`);
    }

    let inserted = 0;
    for (const b of books) {
      try {
        await client.query(INSERT_BOOK_SQL, bookInsertParams(b, userId));
      } catch (err) {
        throw new Error(
          `Fallo al insertar «${b.title}» (${inserted + 1}/${books.length}): ${err.message}`,
        );
      }
      inserted += 1;
      if (inserted % PROGRESS_EVERY === 0 || inserted === books.length) {
        console.log(`  ${inserted}/${books.length}…`);
      }
    }

    await client.query("COMMIT");
    const total = await client.query(
      "SELECT COUNT(*)::int AS c FROM books WHERE user_id = $1",
      [userId],
    );
    console.log(`Listo. Total libros del usuario: ${total.rows[0]?.c ?? "?"}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
