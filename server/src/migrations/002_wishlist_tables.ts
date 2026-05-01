// Migración de wishlist: crea tablas de deseos y adquisiciones.
import { Migration } from "./types";

export const migration002WishlistTables: Migration = {
  version: "002",
  name: "wishlist_tables",
  up: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price TEXT NOT NULL DEFAULT '',
        store TEXT NOT NULL DEFAULT '',
        priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE wishlist_items
      ADD COLUMN IF NOT EXISTS price TEXT NOT NULL DEFAULT '';
    `);

    await client.query(`
      ALTER TABLE wishlist_items
      ADD COLUMN IF NOT EXISTS store TEXT NOT NULL DEFAULT '';
    `);

    // Compatibilidad con instalaciones antiguas donde `genre` era NOT NULL sin default.
    await client.query(`
      ALTER TABLE wishlist_items
      ADD COLUMN IF NOT EXISTS genre TEXT NOT NULL DEFAULT '';
    `);

    await client.query(`
      ALTER TABLE wishlist_items
      ALTER COLUMN genre SET DEFAULT '';
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist_acquisitions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price TEXT NOT NULL DEFAULT '',
        store TEXT NOT NULL DEFAULT '',
        purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wishlist_acquisitions_user_id ON wishlist_acquisitions(user_id);
    `);
  }
};
