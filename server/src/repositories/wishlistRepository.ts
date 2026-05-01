// Acceso a datos de la lista de deseos por usuario.
import { randomUUID } from "crypto";
import { pool } from "../config/db";
import { CreateWishlistItemDto, WishlistAcquisition, WishlistItem, WishlistPriority } from "../types/wishlist";

interface WishlistRow {
  id: string;
  title: string;
  author: string;
  price: string;
  store: string;
  priority: number;
  created_at: Date;
}

interface WishlistAcquisitionRow {
  id: string;
  title: string;
  author: string;
  price: string;
  store: string;
  purchased_at: Date;
}

const mapRow = (row: WishlistRow): WishlistItem => ({
  id: row.id,
  title: row.title,
  author: row.author,
  price: row.price,
  store: row.store,
  priority: row.priority as WishlistPriority,
  createdAt: row.created_at.toISOString()
});

const mapAcquisitionRow = (row: WishlistAcquisitionRow): WishlistAcquisition => ({
  id: row.id,
  title: row.title,
  author: row.author,
  price: row.price,
  store: row.store,
  purchasedAt: row.purchased_at.toISOString()
});

export class WishlistRepository {
  async findAllByUserId(userId: string): Promise<WishlistItem[]> {
    const result = await pool.query<WishlistRow>(
      "SELECT id, title, author, price, store, priority, created_at FROM wishlist_items WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows.map(mapRow);
  }

  async findRecentAcquisitionsByUserId(userId: string): Promise<WishlistAcquisition[]> {
    const result = await pool.query<WishlistAcquisitionRow>(
      `SELECT id, title, author, price, store, purchased_at
       FROM wishlist_acquisitions
       WHERE user_id = $1
       ORDER BY purchased_at DESC
       LIMIT 10`,
      [userId]
    );
    return result.rows.map(mapAcquisitionRow);
  }

  async create(userId: string, dto: CreateWishlistItemDto): Promise<WishlistItem> {
    const id = randomUUID();
    const price = dto.price?.trim() || "Sin precio";
    const store = dto.store?.trim() || "Sin tienda";
    const priority = (dto.priority ?? 3) as WishlistPriority;
    const result = await pool.query<WishlistRow>(
      `INSERT INTO wishlist_items (id, user_id, title, author, price, store, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, author, price, store, priority, created_at`,
      [id, userId, dto.title.trim(), dto.author.trim(), price, store, priority]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("No se pudo crear el deseo");
    }
    return mapRow(row);
  }

  async updateById(userId: string, id: string, dto: CreateWishlistItemDto): Promise<WishlistItem | undefined> {
    const price = dto.price?.trim() || "Sin precio";
    const store = dto.store?.trim() || "Sin tienda";
    const priority = (dto.priority ?? 3) as WishlistPriority;
    const result = await pool.query<WishlistRow>(
      `UPDATE wishlist_items
       SET title = $1, author = $2, price = $3, store = $4, priority = $5
       WHERE id = $6 AND user_id = $7
       RETURNING id, title, author, price, store, priority, created_at`,
      [dto.title.trim(), dto.author.trim(), price, store, priority, id, userId]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async deleteById(userId: string, id: string): Promise<boolean> {
    const result = await pool.query("DELETE FROM wishlist_items WHERE id = $1 AND user_id = $2", [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  async markAsPurchased(userId: string, id: string): Promise<WishlistAcquisition | undefined> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query<WishlistRow>(
        `SELECT id, title, author, price, store, priority, created_at
         FROM wishlist_items
         WHERE id = $1 AND user_id = $2
         LIMIT 1`,
        [id, userId]
      );
      const item = existing.rows[0];
      if (!item) {
        await client.query("ROLLBACK");
        return undefined;
      }

      const acquisitionId = randomUUID();
      const inserted = await client.query<WishlistAcquisitionRow>(
        `INSERT INTO wishlist_acquisitions (id, user_id, title, author, price, store)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, author, price, store, purchased_at`,
        [acquisitionId, userId, item.title, item.author, item.price, item.store]
      );

      await client.query("DELETE FROM wishlist_items WHERE id = $1 AND user_id = $2", [id, userId]);
      await client.query("COMMIT");
      const row = inserted.rows[0];
      return row ? mapAcquisitionRow(row) : undefined;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
