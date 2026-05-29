import { Migration } from "./types";

export const migration007PushNotifications: Migration = {
  version: "007",
  name: "push_notifications",
  up: async (client) => {
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS push_engagement_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS last_engagement_push_at TIMESTAMPTZ;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expo_push_token TEXT NOT NULL,
        platform TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (expo_push_token)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
    `);
  },
};
