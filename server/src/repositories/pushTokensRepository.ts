import { randomUUID } from "crypto";
import { pool } from "../config/db";

export type PushTokenRow = {
  id: string;
  userId: string;
  expoPushToken: string;
  platform: string;
  updatedAt: string;
};

export class PushTokensRepository {
  async upsert(userId: string, expoPushToken: string, platform: string): Promise<void> {
    await pool.query(
      `INSERT INTO push_tokens (id, user_id, expo_push_token, platform, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (expo_push_token)
       DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = NOW()`,
      [randomUUID(), userId, expoPushToken, platform],
    );
  }

  async deleteByToken(expoPushToken: string): Promise<void> {
    await pool.query(`DELETE FROM push_tokens WHERE expo_push_token = $1`, [expoPushToken]);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await pool.query(`DELETE FROM push_tokens WHERE user_id = $1`, [userId]);
  }

  async findTokensByUserId(userId: string): Promise<string[]> {
    const result = await pool.query<{ expo_push_token: string }>(
      `SELECT expo_push_token FROM push_tokens WHERE user_id = $1`,
      [userId],
    );
    return result.rows.map((row) => row.expo_push_token);
  }
}
