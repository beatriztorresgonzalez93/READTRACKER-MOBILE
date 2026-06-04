import { pool } from "../config/db";

export type InactiveUserPushTarget = {
  userId: string;
  expoPushToken: string;
  inactiveDays: number;
};

export class EngagementPushRepository {
  async touchLastActive(userId: string): Promise<void> {
    await pool.query(`UPDATE users SET last_active_at = NOW() WHERE id = $1`, [userId]);
  }

  async setPushEngagementEnabled(userId: string, enabled: boolean): Promise<void> {
    await pool.query(`UPDATE users SET push_engagement_enabled = $2 WHERE id = $1`, [userId, enabled]);
  }

  async getPushEngagementEnabled(userId: string): Promise<boolean> {
    const result = await pool.query<{ push_engagement_enabled: boolean }>(
      `SELECT push_engagement_enabled FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    return result.rows[0]?.push_engagement_enabled ?? true;
  }

  /** Usuarios inactivos con token push y sin aviso reciente de re-engagement. */
  async findInactivePushTargets(
    inactiveDays: number,
    cooldownDays: number,
  ): Promise<InactiveUserPushTarget[]> {
    const result = await pool.query<{
      user_id: string;
      expo_push_token: string;
      inactive_days: string;
    }>(
      `SELECT
         u.id AS user_id,
         pt.expo_push_token,
         GREATEST(
           1,
           FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(u.last_active_at, u.created_at))) / 86400)
         )::int AS inactive_days
       FROM users u
       INNER JOIN push_tokens pt ON pt.user_id = u.id
       WHERE u.push_engagement_enabled = TRUE
         AND COALESCE(u.last_active_at, u.created_at) < NOW() - ($1::int * INTERVAL '1 day')
         AND (
           u.last_engagement_push_at IS NULL
           OR u.last_engagement_push_at < NOW() - ($2::int * INTERVAL '1 day')
         )`,
      [inactiveDays, cooldownDays],
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      expoPushToken: row.expo_push_token,
      inactiveDays: Number(row.inactive_days) || inactiveDays,
    }));
  }

  async markEngagementPushSent(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    await pool.query(
      `UPDATE users SET last_engagement_push_at = NOW() WHERE id = ANY($1::text[])`,
      [userIds],
    );
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1`,
      [email],
    );
    return result.rows[0]?.id ?? null;
  }

  async countPushTokensForUser(userId: string): Promise<number> {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM push_tokens WHERE user_id = $1`,
      [userId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  /** Para pruebas: usuario aparece inactivo N días. */
  async setLastActiveDaysAgo(userId: string, daysAgo: number): Promise<void> {
    const days = Math.max(1, Math.floor(daysAgo));
    await pool.query(
      `UPDATE users SET last_active_at = NOW() - ($2::int * INTERVAL '1 day') WHERE id = $1`,
      [userId, days],
    );
  }

  async clearLastEngagementPush(userId: string): Promise<void> {
    await pool.query(`UPDATE users SET last_engagement_push_at = NULL WHERE id = $1`, [userId]);
  }
}
