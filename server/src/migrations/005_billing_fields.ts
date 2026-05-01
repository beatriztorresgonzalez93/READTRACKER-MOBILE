import { Migration } from "./types";

export const migration005BillingFields: Migration = {
  version: "005",
  name: "billing_fields",
  up: async (client) => {
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS pro_activated_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id
      ON users(stripe_customer_id)
      WHERE stripe_customer_id IS NOT NULL;
    `);

    await client.query(`
      UPDATE users
      SET trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '30 days');
    `);
  }
};
