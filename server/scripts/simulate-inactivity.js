/**
 * Simula inactividad de un usuario para probar push de re-engagement.
 *
 * Uso (desde server/):
 *   node scripts/simulate-inactivity.js --email tu@correo.com
 *   node scripts/simulate-inactivity.js --email tu@correo.com --days 5
 *
 * Requiere DATABASE_URL en .env (misma BD que el API).
 */
require("dotenv").config();
const { Pool } = require("pg");

function parseArgs(argv) {
  let email = process.env.SIMULATE_USER_EMAIL?.trim() ?? "";
  let days = Number(process.env.SIMULATE_INACTIVE_DAYS ?? 5);

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email" && argv[i + 1]) {
      email = argv[i + 1].trim();
      i += 1;
    } else if (arg === "--days" && argv[i + 1]) {
      days = Number(argv[i + 1]);
      i += 1;
    }
  }

  return { email, days: Math.max(1, Math.floor(days) || 5) };
}

async function run() {
  const { email, days } = parseArgs(process.argv);
  if (!email) {
    console.error("Indica --email tu@correo.com");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Falta DATABASE_URL en server/.env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const userResult = await pool.query(
      `SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1`,
      [email],
    );
    const userId = userResult.rows[0]?.id;
    if (!userId) {
      console.error(`No hay usuario con email: ${email}`);
      process.exit(1);
    }

    await pool.query(
      `UPDATE users
       SET last_active_at = NOW() - ($2::int * INTERVAL '1 day'),
           last_engagement_push_at = NULL
       WHERE id = $1`,
      [userId, days],
    );

    const tokens = await pool.query(
      `SELECT COUNT(*)::int AS count FROM push_tokens WHERE user_id = $1`,
      [userId],
    );
    const pushTokenCount = tokens.rows[0]?.count ?? 0;

    console.log(
      JSON.stringify(
        {
          ok: true,
          userId,
          email,
          inactiveDays: days,
          pushTokenCount,
          hint:
            pushTokenCount === 0
              ? "Abre la app (development build), inicia sesión y acepta notificaciones."
              : "Ejecuta: npm run push:engagement",
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
