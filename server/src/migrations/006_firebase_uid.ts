// Firebase Auth: enlace por UID y usuarios sin contraseña local.
import { Migration } from "./types";

export const migration006FirebaseUid: Migration = {
  version: "006",
  name: "firebase_uid",
  up: async (client) => {
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid
      ON users(firebase_uid)
      WHERE firebase_uid IS NOT NULL;
    `);

    await client.query(`
      ALTER TABLE users
      ALTER COLUMN password_hash DROP NOT NULL;
    `);
  }
};
