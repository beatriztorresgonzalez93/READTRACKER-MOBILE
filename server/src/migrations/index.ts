// Runner de migraciones versionadas con registro en schema_migrations.
import { Pool } from "pg";
import { logInfo } from "../logger";
import { migration001InitialUsersBooks } from "./001_initial_users_books";
import { migration002WishlistTables } from "./002_wishlist_tables";
import { migration003ReadingSessions } from "./003_reading_sessions";
import { migration004UserProfileFields } from "./004_user_profile_fields";
import { migration005BillingFields } from "./005_billing_fields";
import { Migration } from "./types";

const migrations: Migration[] = [
  migration001InitialUsersBooks,
  migration002WishlistTables,
  migration003ReadingSessions,
  migration004UserProfileFields,
  migration005BillingFields
];

export const runMigrations = async (pool: Pool) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const migration of migrations) {
      const alreadyApplied = await client.query<{ version: string }>(
        "SELECT version FROM schema_migrations WHERE version = $1 LIMIT 1",
        [migration.version]
      );
      if (alreadyApplied.rows[0]) {
        continue;
      }

      await migration.up(client);
      await client.query(
        "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
        [migration.version, migration.name]
      );
      logInfo("migration.applied", {
        version: migration.version,
        name: migration.name
      });
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
