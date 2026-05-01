// Configura conexión a PostgreSQL (Neon) y asegura la tabla books al iniciar.
import { Pool } from "pg";
import { env } from "./env";
import { runMigrations } from "../migrations/index";

if (!env.databaseUrl) {
  throw new Error("Falta DATABASE_URL en las variables de entorno");
}

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false }
});

export const initDb = async () => {
  await runMigrations(pool);
};
