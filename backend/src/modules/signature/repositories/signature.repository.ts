/**
 * Signature Module - Repository
 *
 * Handles all database operations for signatures
 */

import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
import db, { getConnection } from "../../../config/database.js";
import { UserSignature } from "../entities/signature.entity.js";

export class SignatureRepository {
  // ── Find signatures ─────────────────────────────────────────────────────────

  static async findByUserId(
    userId: number,
    conn?: PoolConnection,
  ): Promise<UserSignature | null> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT signature_id, user_id, signature_image, created_at, updated_at
       FROM sig_images
       WHERE user_id = ?`,
      [userId],
    );
    return (rows[0] as UserSignature) ?? null;
  }

  static async existsByUserId(
    userId: number,
    conn?: PoolConnection,
  ): Promise<boolean> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT 1 FROM sig_images WHERE user_id = ? LIMIT 1",
      [userId],
    );
    return rows.length > 0;
  }

  // ── Create/Update signatures ────────────────────────────────────────────────

  static async create(
    userId: number,
    imageBuffer: Buffer,
    conn?: PoolConnection,
  ): Promise<number> {
    const executor = conn ?? db;
    const [result] = await executor.execute<ResultSetHeader>(
      `INSERT INTO sig_images (user_id, signature_image)
       VALUES (?, ?)`,
      [userId, imageBuffer],
    );
    return result.insertId;
  }

  static async update(
    userId: number,
    imageBuffer: Buffer,
    conn?: PoolConnection,
  ): Promise<void> {
    const executor = conn ?? db;
    await executor.execute(
      `UPDATE sig_images
       SET signature_image = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [imageBuffer, userId],
    );
  }

  static async upsert(
    userId: number,
    imageBuffer: Buffer,
    conn: PoolConnection,
  ): Promise<number> {
    // Check if exists
    const [existing] = await conn.query<RowDataPacket[]>(
      "SELECT signature_id FROM sig_images WHERE user_id = ?",
      [userId],
    );

    if (existing.length > 0) {
      await SignatureRepository.update(userId, imageBuffer, conn);
      return existing[0].signature_id;
    } else {
      return SignatureRepository.create(userId, imageBuffer, conn);
    }
  }

  // ── Delete signatures ───────────────────────────────────────────────────────

  static async delete(
    userId: number,
    conn?: PoolConnection,
  ): Promise<boolean> {
    const executor = conn ?? db;
    const [result] = await executor.execute<ResultSetHeader>(
      "DELETE FROM sig_images WHERE user_id = ?",
      [userId],
    );
    return result.affectedRows > 0;
  }

  // ── Connection helper ───────────────────────────────────────────────────────

  static async getConnection(): Promise<PoolConnection> {
    return getConnection();
  }
}
