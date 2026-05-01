// Campos de perfil: apellidos y foto (URL o data URL).
import { Migration } from "./types";

export const migration004UserProfileFields: Migration = {
  version: "004",
  name: "user_profile_fields",
  up: async (client) => {
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '';
    `);
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
  }
};
