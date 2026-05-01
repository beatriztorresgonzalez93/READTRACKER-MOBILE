// Acceso a datos de usuarios para autenticación.
import { randomUUID } from "crypto";
import { pool } from "../config/db";
import { AuthUser } from "../types/auth";

interface UserRow {
  id: string;
  name: string;
  last_name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  avatar_url: string | null;
  trial_ends_at: Date | null;
  is_pro: boolean;
  pro_activated_at: Date | null;
  stripe_customer_id: string | null;
}

const mapUser = (row: UserRow): AuthUser => ({
  id: row.id,
  name: row.name,
  lastName: (row.last_name ?? "").trim(),
  email: row.email,
  avatarUrl: row.avatar_url?.trim() ? row.avatar_url.trim() : null,
  createdAt: row.created_at.toISOString(),
  trialEndsAt: row.trial_ends_at ? row.trial_ends_at.toISOString() : null,
  isPro: Boolean(row.is_pro),
  proActivatedAt: row.pro_activated_at ? row.pro_activated_at.toISOString() : null
});

export class UsersRepository {
  async findStripeCustomerIdByUserId(userId: string): Promise<string | null> {
    const result = await pool.query<{ stripe_customer_id: string | null }>(
      "SELECT stripe_customer_id FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );
    const row = result.rows[0];
    return row?.stripe_customer_id ?? null;
  }

  async findByEmail(email: string): Promise<(AuthUser & { passwordHash: string }) | null> {
    const result = await pool.query<UserRow>(
      `SELECT id, name, last_name, email, password_hash, created_at, avatar_url,
              trial_ends_at, is_pro, pro_activated_at, stripe_customer_id
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...mapUser(row),
      passwordHash: row.password_hash
    };
  }

  async findById(id: string): Promise<AuthUser | null> {
    const result = await pool.query<UserRow>(
      `SELECT id, name, last_name, email, password_hash, created_at, avatar_url,
              trial_ends_at, is_pro, pro_activated_at, stripe_customer_id
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  async create(name: string, email: string, passwordHash: string, trialEndsAt: Date): Promise<AuthUser> {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (id, name, email, password_hash, trial_ends_at, is_pro)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING id, name, last_name, email, password_hash, created_at, avatar_url,
                 trial_ends_at, is_pro, pro_activated_at, stripe_customer_id`,
      [randomUUID(), name, email, passwordHash, trialEndsAt.toISOString()]
    );
    return mapUser(result.rows[0]);
  }

  async updateProfile(
    id: string,
    updates: { name: string; lastName: string; avatarUrl: string | null }
  ): Promise<AuthUser | null> {
    const result = await pool.query<UserRow>(
      `UPDATE users
       SET name = $2, last_name = $3, avatar_url = $4
       WHERE id = $1
       RETURNING id, name, last_name, email, password_hash, created_at, avatar_url,
                 trial_ends_at, is_pro, pro_activated_at, stripe_customer_id`,
      [id, updates.name, updates.lastName, updates.avatarUrl]
    );
    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  async saveStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await pool.query(
      `UPDATE users
       SET stripe_customer_id = $2
       WHERE id = $1`,
      [userId, stripeCustomerId]
    );
  }

  async activateProByUserId(userId: string): Promise<void> {
    await pool.query(
      `UPDATE users
       SET is_pro = TRUE, pro_activated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  }

  async activateProByStripeCustomerId(stripeCustomerId: string): Promise<void> {
    await pool.query(
      `UPDATE users
       SET is_pro = TRUE, pro_activated_at = NOW()
       WHERE stripe_customer_id = $1`,
      [stripeCustomerId]
    );
  }
}
