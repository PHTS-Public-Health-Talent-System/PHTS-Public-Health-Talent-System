/**
 * Access Review Module - Repository
 *
 * Handles all database operations for access review
 */

import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
import db, { getConnection } from '@config/database.js';
import {
  ReviewCycle,
  ReviewCycleStatus,
  ReviewItem,
  ReviewResult,
} from '@/modules/access-review/entities/access-review.entity.js';

export class AccessReviewRepository {
  private static hasSupportSubDepartmentColumnCache: boolean | null = null;

  private static async hasSupportSubDepartmentColumn(
    conn: PoolConnection,
  ): Promise<boolean> {
    if (this.hasSupportSubDepartmentColumnCache !== null) {
      return this.hasSupportSubDepartmentColumnCache;
    }
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT 1
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'emp_support_staff'
         AND COLUMN_NAME = 'sub_department'
       LIMIT 1`,
    );
    this.hasSupportSubDepartmentColumnCache = rows.length > 0;
    return this.hasSupportSubDepartmentColumnCache;
  }

  // ── Cycle queries ───────────────────────────────────────────────────────────

  static async findCycles(
    year?: number,
    conn?: PoolConnection,
  ): Promise<ReviewCycle[]> {
    const executor = conn ?? db;
    let sql = "SELECT * FROM audit_review_cycles";
    const params: any[] = [];

    if (year) {
      sql += " WHERE year = ?";
      params.push(year);
    }

    sql += " ORDER BY year DESC, quarter DESC";

    const [rows] = await executor.query<RowDataPacket[]>(sql, params);
    return rows as ReviewCycle[];
  }

  static async findCycleById(
    cycleId: number,
    conn?: PoolConnection,
  ): Promise<ReviewCycle | null> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT * FROM audit_review_cycles WHERE cycle_id = ?",
      [cycleId],
    );
    return (rows[0] as ReviewCycle) ?? null;
  }

  static async findCycleByQuarterYear(
    quarter: number,
    year: number,
    conn: PoolConnection,
  ): Promise<ReviewCycle | null> {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM audit_review_cycles WHERE quarter = ? AND year = ?",
      [quarter, year],
    );
    return (rows[0] as ReviewCycle) ?? null;
  }

  static async createCycle(
    quarter: number,
    year: number,
    startDate: Date,
    dueDate: Date,
    totalUsers: number,
    conn: PoolConnection,
  ): Promise<number> {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO audit_review_cycles
       (quarter, year, status, start_date, due_date, total_users)
       VALUES (?, ?, 'PENDING', ?, ?, ?)`,
      [quarter, year, startDate, dueDate, totalUsers],
    );
    const cycleId = result.insertId;

    // Phase A compatibility:
    // If new columns exist, populate them for post-sync contract.
    // If schema has not migrated yet, ignore unknown-column errors.
    try {
      await conn.execute(
        `UPDATE audit_review_cycles
         SET opened_at = COALESCE(opened_at, ?),
             expires_at = COALESCE(expires_at, ?),
             sync_source = COALESCE(sync_source, 'SYNC'),
             cycle_code = COALESCE(cycle_code, CONCAT('SYNC-', cycle_id))
         WHERE cycle_id = ?`,
        [startDate, dueDate, cycleId],
      );
    } catch {
      // old schema - keep backward compatibility
    }

    return cycleId;
  }

  static async updateCycleStatus(
    cycleId: number,
    status: ReviewCycleStatus,
    completedBy?: number,
    conn?: PoolConnection,
  ): Promise<void> {
    const executor = conn ?? db;
    if (status === ReviewCycleStatus.COMPLETED && completedBy) {
      await executor.execute(
        `UPDATE audit_review_cycles
         SET status = 'COMPLETED', completed_at = NOW(), completed_by = ?
         WHERE cycle_id = ?`,
        [completedBy, cycleId],
      );
    } else {
      await executor.execute(
        "UPDATE audit_review_cycles SET status = ? WHERE cycle_id = ?",
        [status, cycleId],
      );
    }
  }

  static async updateCycleStats(
    cycleId: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE audit_review_cycles c
       SET reviewed_users = (SELECT COUNT(*) FROM audit_review_items WHERE cycle_id = c.cycle_id AND review_result != 'PENDING'),
           disabled_users = (SELECT COUNT(*) FROM audit_review_items WHERE cycle_id = c.cycle_id AND review_result = 'DISABLE')
       WHERE c.cycle_id = ?`,
      [cycleId],
    );
  }

  // ── Review item queries ─────────────────────────────────────────────────────

  static async findItems(
    cycleId: number,
    result?: ReviewResult,
    conn?: PoolConnection,
  ): Promise<ReviewItem[]> {
    const executor = conn ?? db;
    let sql = `
      SELECT i.*, u.citizen_id,
             COALESCE(e.first_name, s.first_name, '') AS first_name,
             COALESCE(e.last_name, s.last_name, '') AS last_name
      FROM audit_review_items i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN emp_profiles e ON u.citizen_id = e.citizen_id
      LEFT JOIN emp_support_staff s ON u.citizen_id = s.citizen_id
      WHERE i.cycle_id = ?
    `;

    const params: any[] = [cycleId];

    if (result) {
      sql += " AND i.review_result = ?";
      params.push(result);
    }

    sql += " ORDER BY i.review_result, last_name, first_name";

    const [rows] = await executor.query<RowDataPacket[]>(sql, params);

    return (rows as any[]).map((row) => ({
      item_id: row.item_id,
      cycle_id: row.cycle_id,
      user_id: row.user_id,
      citizen_id: row.citizen_id,
      user_name: `${row.first_name} ${row.last_name}`.trim(),
      current_role: row.current_role,
      employee_status: row.employee_status,
      last_login_at: row.last_login_at,
      review_result: row.review_result,
      reviewed_at: row.reviewed_at,
      reviewed_by: row.reviewed_by,
      review_note: row.review_note,
      auto_disabled: row.auto_disabled === 1,
    }));
  }

  static async findItemById(
    itemId: number,
    conn: PoolConnection,
  ): Promise<any | null> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT i.*, c.cycle_id
       FROM audit_review_items i
       JOIN audit_review_cycles c ON i.cycle_id = c.cycle_id
       WHERE i.item_id = ? FOR UPDATE`,
      [itemId],
    );
    return (rows[0] as any) ?? null;
  }

  static async createItemIfNotExists(
    cycleId: number,
    userId: number,
    currentRole: string,
    employeeStatus: string | null,
    lastLoginAt: Date | null,
    reviewNote: string | null,
    conn: PoolConnection,
  ): Promise<boolean> {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT IGNORE INTO audit_review_items
       (cycle_id, user_id, current_role, employee_status, last_login_at, review_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cycleId, userId, currentRole, employeeStatus, lastLoginAt, reviewNote],
    );
    return result.affectedRows > 0;
  }

  static async updateItemResult(
    itemId: number,
    result: ReviewResult,
    reviewedBy: number,
    note: string | null,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE audit_review_items
       SET review_result = ?, reviewed_at = NOW(), reviewed_by = ?, review_note = ?
       WHERE item_id = ?`,
      [result, reviewedBy, note, itemId],
    );
  }

  static async countPendingItems(
    cycleId: number,
    conn: PoolConnection,
  ): Promise<number> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM audit_review_items
       WHERE cycle_id = ? AND review_result = 'PENDING'`,
      [cycleId],
    );
    return Number((rows[0] as any)?.count || 0);
  }

  // ── User queries ────────────────────────────────────────────────────────────

  static async findActiveNonAdminUsers(conn: PoolConnection): Promise<any[]> {
    const hasSupportSubDepartment = await this.hasSupportSubDepartmentColumn(conn);
    const supportSubDepartmentExpr = hasSupportSubDepartment
      ? "s.sub_department"
      : "NULL";
    const [rows] = await conn.query<RowDataPacket[]>(`
      SELECT u.id, u.citizen_id, u.role, u.last_login_at,
             COALESCE(
               NULLIF(e.original_status, ''),
               CASE
                 WHEN s.is_currently_active = 0 THEN 'inactive'
                 WHEN s.is_currently_active = 1 THEN 'active'
                 ELSE NULL
               END,
               'unknown'
             ) AS employee_status,
             COALESCE(e.position_name, s.position_name) AS position_name,
             COALESCE(e.special_position, s.special_position) AS special_position,
             COALESCE(e.department, s.department) AS department,
             COALESCE(e.sub_department, ${supportSubDepartmentExpr}) AS sub_department,
             GREATEST(
               COALESCE(e.last_synced_at, '1970-01-01'),
               COALESCE(s.last_synced_at, '1970-01-01')
             ) AS profile_synced_at
      FROM users u
      LEFT JOIN emp_profiles e ON u.citizen_id = e.citizen_id
      LEFT JOIN emp_support_staff s ON u.citizen_id = s.citizen_id
      WHERE u.role != 'ADMIN' AND u.is_active = 1
    `);
    return rows as any[];
  }

  static async countItemsByCycle(
    cycleId: number,
    conn: PoolConnection,
  ): Promise<number> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM audit_review_items
       WHERE cycle_id = ?`,
      [cycleId],
    );
    return Number((rows[0] as any)?.count || 0);
  }

  static async updateCycleTotalUsers(
    cycleId: number,
    totalUsers: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute(
      `UPDATE audit_review_cycles
       SET total_users = ?
       WHERE cycle_id = ?`,
      [totalUsers, cycleId],
    );
  }

  static async updatePendingItemsToKeep(params: {
    cycleId: number;
    completedBy: number;
    note: string;
    conn: PoolConnection;
  }): Promise<void> {
    const { cycleId, completedBy, note, conn } = params;
    await conn.execute(
      `UPDATE audit_review_items
       SET review_result = 'KEEP',
           reviewed_at = NOW(),
           reviewed_by = ?,
           review_note = COALESCE(?, review_note)
       WHERE cycle_id = ? AND review_result = 'PENDING'`,
      [completedBy, note, cycleId],
    );
  }

  static async findActiveCycleByQuarterYear(params: {
    quarter: number;
    year: number;
    conn: PoolConnection;
  }): Promise<ReviewCycle | null> {
    const { quarter, year, conn } = params;
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM audit_review_cycles WHERE quarter = ? AND year = ? AND status != ?",
      [quarter, year, "COMPLETED"],
    );
    return (rows[0] as ReviewCycle) ?? null;
  }

  static async disableUser(
    userId: number,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.execute("UPDATE users SET is_active = 0 WHERE id = ?", [userId]);
  }

  static async findAdminUsers(conn?: PoolConnection): Promise<number[]> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE role = 'ADMIN' AND is_active = 1",
    );
    return (rows as any[]).map((r) => r.id);
  }

  // ── Connection helper ───────────────────────────────────────────────────────

  static async getConnection(): Promise<PoolConnection> {
    return getConnection();
  }
}
