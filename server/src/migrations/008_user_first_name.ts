// Nombre de pila en perfil (separado de apellidos y nombre completo).
import { Migration } from "./types";

export const migration008UserFirstName: Migration = {
  version: "008",
  name: "user_first_name",
  up: async (client) => {
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '';
    `);
    await client.query(`
      UPDATE users
      SET first_name = SPLIT_PART(TRIM(name), ' ', 1)
      WHERE TRIM(first_name) = ''
        AND TRIM(COALESCE(name, '')) <> '';
    `);
  },
};
