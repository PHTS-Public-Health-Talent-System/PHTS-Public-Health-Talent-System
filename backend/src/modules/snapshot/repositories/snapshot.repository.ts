/**
 * Snapshot Module - Repository
 *
 * Handles all database operations for period snapshots
 */

import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
import db, { getConnection } from '@config/database.js';
import { Snapshot, SnapshotType, PeriodWithSnapshot } from '@/modules/snapshot/entities/snapshot.entity.js';

export class SnapshotRepository {
  static async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      `,
      [tableName, columnName],
    );
    return Number((rows[0] as any)?.cnt ?? 0) > 0;
  }

  static async executeRaw(sql: string, params: any[] = []): Promise<void> {
    await db.query(sql, params);
  }

  static async setPeriodSnapshotPending(
    periodId: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE pay_periods
       SET snapshot_status = 'PENDING', snapshot_ready_at = NULL, updated_at = NOW()
       WHERE period_id = ?`,
      [periodId],
    );
  }

  static async setPeriodSnapshotProcessing(
    periodId: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE pay_periods
       SET snapshot_status = 'PROCESSING', updated_at = NOW()
       WHERE period_id = ?`,
      [periodId],
    );
  }

  static async setPeriodSnapshotFailed(
    periodId: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE pay_periods
       SET snapshot_status = 'FAILED', updated_at = NOW()
       WHERE period_id = ?`,
      [periodId],
    );
  }

  // ── Period queries ──────────────────────────────────────────────────────────

  static async findPeriodWithSnapshot(
    periodId: number,
    conn?: PoolConnection,
  ): Promise<PeriodWithSnapshot | null> {
    const executor = conn ?? db;
    const sql = `
      SELECT p.*,
             (SELECT COUNT(*) FROM pay_snapshots WHERE period_id = p.period_id) AS snapshot_count
      FROM pay_periods p
      WHERE p.period_id = ?
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql, [periodId]);

    if (rows.length === 0) return null;

    const row = rows[0] as any;
    return {
      period_id: row.period_id,
      period_month: row.period_month,
      period_year: row.period_year,
      status: row.status,
      is_locked: row.is_locked === 1 || row.is_locked === true,
      snapshot_status: row.snapshot_status ?? "PENDING",
      snapshot_ready_at: row.snapshot_ready_at ?? null,
      frozen_at: row.frozen_at,
      frozen_by: row.frozen_by,
      snapshot_count: row.snapshot_count,
    };
  }

  static async findPeriodById(
    periodId: number,
    conn?: PoolConnection,
  ): Promise<any | null> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT * FROM pay_periods WHERE period_id = ?",
      [periodId],
    );
    return (rows[0] as any) ?? null;
  }

  static async findPeriodByIdForUpdate(
    periodId: number,
    conn: PoolConnection,
  ): Promise<any | null> {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM pay_periods WHERE period_id = ? FOR UPDATE",
      [periodId],
    );
    return (rows[0] as any) ?? null;
  }

  static async isPeriodFrozen(
    periodId: number,
    conn?: PoolConnection,
  ): Promise<boolean> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT snapshot_status FROM pay_periods WHERE period_id = ?",
      [periodId],
    );

    if (rows.length === 0) return false;
    const row = rows[0] as any;
    const status = String(row.snapshot_status ?? "").toUpperCase();
    return status === "READY";
  }

  static async freezePeriod(
    periodId: number,
    frozenBy: number | null,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE pay_periods
       SET frozen_at = NOW(),
           frozen_by = ?,
           snapshot_status = 'READY',
           snapshot_ready_at = NOW()
       WHERE period_id = ?`,
      [frozenBy, periodId],
    );
  }

  static async unfreezePeriod(
    periodId: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE pay_periods
       SET frozen_at = NULL,
           frozen_by = NULL,
           snapshot_status = 'PENDING',
           snapshot_ready_at = NULL
       WHERE period_id = ?`,
      [periodId],
    );
  }

  static async insertSnapshotOutbox(
    periodId: number,
    requestedBy: number | null,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `INSERT INTO pay_snapshot_outbox (period_id, requested_by, status, attempts, available_at)
       VALUES (?, ?, 'PENDING', 0, NOW())`,
      [periodId, requestedBy],
    );
  }

  static async findOutboxBatchForUpdate(
    limit: number,
    conn: PoolConnection,
  ): Promise<RowDataPacket[]> {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    const [rows] = await conn.query<RowDataPacket[]>(
      `
      SELECT outbox_id, period_id, requested_by, attempts
      FROM pay_snapshot_outbox
      WHERE status IN ('PENDING', 'FAILED') AND available_at <= NOW()
      ORDER BY status ASC, available_at ASC, outbox_id ASC
      LIMIT ${safeLimit}
      FOR UPDATE SKIP LOCKED
      `,
    );
    return rows;
  }

  static async markOutboxProcessing(outboxId: number, conn: PoolConnection): Promise<void> {
    await conn.execute(
      `UPDATE pay_snapshot_outbox SET status = 'PROCESSING' WHERE outbox_id = ?`,
      [outboxId],
    );
  }

  static async markOutboxSent(outboxId: number, conn: PoolConnection): Promise<void> {
    await conn.execute(
      `UPDATE pay_snapshot_outbox
       SET status = 'SENT', processed_at = NOW(), last_error = NULL
       WHERE outbox_id = ?`,
      [outboxId],
    );
  }

  static async markOutboxFailed(
    outboxId: number,
    message: string,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE pay_snapshot_outbox
       SET status = 'FAILED', attempts = attempts + 1, last_error = ?
       WHERE outbox_id = ?`,
      [message.slice(0, 2000), outboxId],
    );
  }

  // ── Payout queries for snapshot ─────────────────────────────────────────────

  static async findPayoutsForSnapshot(
    periodId: number,
    conn: PoolConnection,
  ): Promise<any[]> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `
      SELECT po.*,
             COALESCE(e.first_name, s.first_name, '') AS first_name,
             COALESCE(e.last_name, s.last_name, '') AS last_name,
             COALESCE(e.department, s.department, '') AS department,
             COALESCE(e.position_name, s.position_name, '') AS position_name,
             mr.amount AS base_rate,
             mr.group_no,
             mr.item_no,
             mr.profession_code
      FROM pay_results po
      LEFT JOIN emp_profiles e ON po.citizen_id = e.citizen_id
      LEFT JOIN emp_support_staff s ON po.citizen_id = s.citizen_id
      LEFT JOIN cfg_payment_rates mr ON po.master_rate_id = mr.rate_id
      WHERE po.period_id = ?
      ORDER BY last_name, first_name
    `,
      [periodId],
    );
    return rows as any[];
  }

  // ── Snapshot queries ────────────────────────────────────────────────────────

  static async createSnapshot(
    periodId: number,
    snapshotType: SnapshotType,
    snapshotData: any,
    recordCount: number,
    totalAmount: number,
    conn: PoolConnection,
  ): Promise<number> {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO pay_snapshots
       (period_id, snapshot_type, snapshot_data, record_count, total_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [periodId, snapshotType, JSON.stringify(snapshotData), recordCount, totalAmount],
    );
    return result.insertId;
  }

  static async deleteSnapshotsForPeriod(
    periodId: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute("DELETE FROM pay_snapshots WHERE period_id = ?", [periodId]);
  }

  static async setPeriodSnapshotReady(params: {
    periodId: number;
    frozenBy: number | null;
    conn: PoolConnection;
  }): Promise<void> {
    const { periodId, frozenBy, conn } = params;
    await conn.execute(
      `
      UPDATE pay_periods
      SET frozen_at = NOW(),
          frozen_by = ?,
          snapshot_status = 'READY',
          snapshot_ready_at = NOW(),
          updated_at = NOW()
      WHERE period_id = ?
      `,
      [frozenBy, periodId],
    );
  }

  static async findSnapshot(
    periodId: number,
    snapshotType: SnapshotType,
    conn?: PoolConnection,
  ): Promise<Snapshot | null> {
    const executor = conn ?? db;
    const sql = `
      SELECT * FROM pay_snapshots
      WHERE period_id = ? AND snapshot_type = ?
      ORDER BY created_at DESC LIMIT 1
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql, [periodId, snapshotType]);

    if (rows.length === 0) return null;

    const row = rows[0] as any;
    return {
      snapshot_id: row.snapshot_id,
      period_id: row.period_id,
      snapshot_type: row.snapshot_type,
      snapshot_data: JSON.parse(row.snapshot_data),
      record_count: row.record_count,
      total_amount: Number(row.total_amount),
      created_at: row.created_at,
    };
  }

  static async findSnapshotsForPeriod(
    periodId: number,
    conn?: PoolConnection,
  ): Promise<Snapshot[]> {
    const executor = conn ?? db;
    const sql = `
      SELECT * FROM pay_snapshots
      WHERE period_id = ?
      ORDER BY created_at DESC
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql, [periodId]);

    return (rows as any[]).map((row) => ({
      snapshot_id: row.snapshot_id,
      period_id: row.period_id,
      snapshot_type: row.snapshot_type,
      snapshot_data: JSON.parse(row.snapshot_data),
      record_count: row.record_count,
      total_amount: Number(row.total_amount),
      created_at: row.created_at,
    }));
  }

  // ── Connection helper ───────────────────────────────────────────────────────

  static async getConnection(): Promise<PoolConnection> {
    return getConnection();
  }
}
