/**
 * Delegation Module - Repository
 *
 * Handles all database operations for delegation
 */

import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
import db, { getConnection } from "../../../config/database.js";
import {
  Delegation,
  DelegationStatus,
  DelegationScopeType,
  UserCandidate,
} from "../entities/delegation.entity.js";

export class DelegationRepository {
  // ── Find delegations ────────────────────────────────────────────────────────

  static async findByUserId(
    userId: number,
    includeExpired: boolean = false,
    conn?: PoolConnection,
  ): Promise<Delegation[]> {
    const executor = conn ?? db;
    let sql = `
      SELECT d.*,
             COALESCE(e1.first_name, s1.first_name, '') AS delegator_first_name,
             COALESCE(e1.last_name, s1.last_name, '') AS delegator_last_name,
             COALESCE(e2.first_name, s2.first_name, '') AS delegate_first_name,
             COALESCE(e2.last_name, s2.last_name, '') AS delegate_last_name
      FROM wf_delegations d
      JOIN users u1 ON d.delegator_id = u1.id
      JOIN users u2 ON d.delegate_id = u2.id
      LEFT JOIN emp_profiles e1 ON u1.citizen_id = e1.citizen_id
      LEFT JOIN emp_support_staff s1 ON u1.citizen_id = s1.citizen_id
      LEFT JOIN emp_profiles e2 ON u2.citizen_id = e2.citizen_id
      LEFT JOIN emp_support_staff s2 ON u2.citizen_id = s2.citizen_id
      WHERE (d.delegator_id = ? OR d.delegate_id = ?)
    `;

    const params: any[] = [userId, userId];

    if (!includeExpired) {
      sql += ` AND d.status = 'ACTIVE'`;
    }

    sql += " ORDER BY d.start_date DESC";

    const [rows] = await executor.query<RowDataPacket[]>(sql, params);

    return DelegationRepository.mapRowsToDelegations(rows as any[]);
  }

  static async findActiveByDelegateId(
    delegateId: number,
    conn?: PoolConnection,
  ): Promise<Delegation[]> {
    const executor = conn ?? db;
    const sql = `
      SELECT d.*,
             COALESCE(e1.first_name, s1.first_name, '') AS delegator_first_name,
             COALESCE(e1.last_name, s1.last_name, '') AS delegator_last_name,
             COALESCE(e2.first_name, s2.first_name, '') AS delegate_first_name,
             COALESCE(e2.last_name, s2.last_name, '') AS delegate_last_name
      FROM wf_delegations d
      JOIN users u1 ON d.delegator_id = u1.id
      JOIN users u2 ON d.delegate_id = u2.id
      LEFT JOIN emp_profiles e1 ON u1.citizen_id = e1.citizen_id
      LEFT JOIN emp_support_staff s1 ON u1.citizen_id = s1.citizen_id
      LEFT JOIN emp_profiles e2 ON u2.citizen_id = e2.citizen_id
      LEFT JOIN emp_support_staff s2 ON u2.citizen_id = s2.citizen_id
      WHERE d.delegate_id = ?
        AND d.status = 'ACTIVE'
        AND CURDATE() BETWEEN d.start_date AND d.end_date
      ORDER BY d.delegated_role
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql, [delegateId]);

    return DelegationRepository.mapRowsToDelegations(rows as any[]);
  }

  static async findAllActive(conn?: PoolConnection): Promise<Delegation[]> {
    const executor = conn ?? db;
    const sql = `
      SELECT d.*,
             COALESCE(e1.first_name, s1.first_name, '') AS delegator_first_name,
             COALESCE(e1.last_name, s1.last_name, '') AS delegator_last_name,
             COALESCE(e2.first_name, s2.first_name, '') AS delegate_first_name,
             COALESCE(e2.last_name, s2.last_name, '') AS delegate_last_name
      FROM wf_delegations d
      JOIN users u1 ON d.delegator_id = u1.id
      JOIN users u2 ON d.delegate_id = u2.id
      LEFT JOIN emp_profiles e1 ON u1.citizen_id = e1.citizen_id
      LEFT JOIN emp_support_staff s1 ON u1.citizen_id = s1.citizen_id
      LEFT JOIN emp_profiles e2 ON u2.citizen_id = e2.citizen_id
      LEFT JOIN emp_support_staff s2 ON u2.citizen_id = s2.citizen_id
      WHERE d.status = 'ACTIVE'
        AND CURDATE() BETWEEN d.start_date AND d.end_date
      ORDER BY d.delegated_role, d.start_date
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql);

    return DelegationRepository.mapRowsToDelegations(rows as any[]);
  }

  static async findById(
    delegationId: number,
    conn?: PoolConnection,
  ): Promise<any | null> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT * FROM wf_delegations WHERE delegation_id = ?",
      [delegationId],
    );
    return (rows[0] as any) ?? null;
  }

  static async findByIdForUpdate(
    delegationId: number,
    conn: PoolConnection,
  ): Promise<any | null> {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM wf_delegations WHERE delegation_id = ? FOR UPDATE",
      [delegationId],
    );
    return (rows[0] as any) ?? null;
  }

  // ── Check can act as role ───────────────────────────────────────────────────

  static async checkCanActAsRole(
    delegateId: number,
    role: string,
    scopeType?: DelegationScopeType,
    scopeValue?: string,
    conn?: PoolConnection,
  ): Promise<{ delegation_id: number; delegator_id: number } | null> {
    const executor = conn ?? db;
    let sql = `
      SELECT delegation_id, delegator_id
      FROM wf_delegations
      WHERE delegate_id = ?
        AND delegated_role = ?
        AND status = 'ACTIVE'
        AND CURDATE() BETWEEN start_date AND end_date
    `;

    const params: any[] = [delegateId, role];

    if (scopeType && scopeValue) {
      sql += ` AND (scope_type = ? OR (scope_type = ? AND scope_value = ?))`;
      params.push(DelegationScopeType.ALL, scopeType, scopeValue);
    }

    sql += " LIMIT 1";

    const [rows] = await executor.query<RowDataPacket[]>(sql, params);

    return (rows[0] as any) ?? null;
  }

  // ── Check overlapping ───────────────────────────────────────────────────────

  static async findOverlapping(
    delegatorId: number,
    delegateId: number,
    delegatedRole: string,
    startDate: Date | string,
    endDate: Date | string,
    conn: PoolConnection,
  ): Promise<any[]> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM wf_delegations
       WHERE delegator_id = ? AND delegate_id = ? AND delegated_role = ?
         AND status = 'ACTIVE'
         AND NOT (end_date < ? OR start_date > ?)`,
      [delegatorId, delegateId, delegatedRole, startDate, endDate],
    );
    return rows as any[];
  }

  // ── Create delegation ───────────────────────────────────────────────────────

  static async create(
    delegatorId: number,
    delegateId: number,
    delegatedRole: string,
    scopeType: DelegationScopeType,
    scopeValue: string | null,
    startDate: Date | string,
    endDate: Date | string,
    reason: string | null,
    conn: PoolConnection,
  ): Promise<number> {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO wf_delegations
       (delegator_id, delegate_id, delegated_role, scope_type, scope_value,
        start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        delegatorId,
        delegateId,
        delegatedRole,
        scopeType,
        scopeValue,
        startDate,
        endDate,
        reason,
      ],
    );
    return result.insertId;
  }

  // ── Update delegation ───────────────────────────────────────────────────────

  static async updateStatus(
    delegationId: number,
    status: DelegationStatus,
    cancelledBy?: number,
    conn?: PoolConnection,
  ): Promise<void> {
    const executor = conn ?? db;
    if (status === DelegationStatus.CANCELLED && cancelledBy) {
      await executor.execute(
        `UPDATE wf_delegations
         SET status = 'CANCELLED', cancelled_at = NOW(), cancelled_by = ?
         WHERE delegation_id = ?`,
        [cancelledBy, delegationId],
      );
    } else {
      await executor.execute(
        `UPDATE wf_delegations SET status = ? WHERE delegation_id = ?`,
        [status, delegationId],
      );
    }
  }

  static async expireOld(conn?: PoolConnection): Promise<number> {
    const executor = conn ?? db;
    const [result] = await executor.execute<ResultSetHeader>(
      `UPDATE wf_delegations
       SET status = 'EXPIRED'
       WHERE status = 'ACTIVE' AND end_date < CURDATE()`,
    );
    return result.affectedRows;
  }

  // ── User queries ────────────────────────────────────────────────────────────

  static async findUserById(
    userId: number,
    conn?: PoolConnection,
  ): Promise<{ id: number; role: string } | null> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ?",
      [userId],
    );
    return (rows[0] as any) ?? null;
  }

  static async findActiveUserById(
    userId: number,
    conn?: PoolConnection,
  ): Promise<{ id: number; role: string } | null> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ? AND is_active = 1",
      [userId],
    );
    return (rows[0] as any) ?? null;
  }

  static async searchCandidates(
    queryStr: string,
    conn?: PoolConnection,
  ): Promise<UserCandidate[]> {
    const executor = conn ?? db;
    const sql = `
      SELECT u.id, u.role, u.citizen_id,
             COALESCE(e.first_name, s.first_name, '') AS first_name,
             COALESCE(e.last_name, s.last_name, '') AS last_name
      FROM users u
      LEFT JOIN emp_profiles e ON u.citizen_id = e.citizen_id
      LEFT JOIN emp_support_staff s ON u.citizen_id = s.citizen_id
      WHERE u.is_active = 1
        AND (
          e.first_name LIKE ? OR e.last_name LIKE ? OR
          s.first_name LIKE ? OR s.last_name LIKE ? OR
          u.citizen_id LIKE ?
        )
      LIMIT 20
    `;
    const q = `%${queryStr}%`;
    const [rows] = await executor.query<RowDataPacket[]>(sql, [q, q, q, q, q]);
    return rows as UserCandidate[];
  }

  // ── Helper: Map rows to delegations ─────────────────────────────────────────

  private static mapRowsToDelegations(rows: any[]): Delegation[] {
    return rows.map((row) => ({
      delegation_id: row.delegation_id,
      delegator_id: row.delegator_id,
      delegator_name:
        `${row.delegator_first_name} ${row.delegator_last_name}`.trim(),
      delegate_id: row.delegate_id,
      delegate_name:
        `${row.delegate_first_name} ${row.delegate_last_name}`.trim(),
      delegated_role: row.delegated_role,
      scope_type: row.scope_type,
      scope_value: row.scope_value,
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason,
      status: row.status,
      cancelled_at: row.cancelled_at,
      cancelled_by: row.cancelled_by,
      created_at: row.created_at,
    }));
  }

  // ── Connection helper ───────────────────────────────────────────────────────

  static async getConnection(): Promise<PoolConnection> {
    return getConnection();
  }
}
