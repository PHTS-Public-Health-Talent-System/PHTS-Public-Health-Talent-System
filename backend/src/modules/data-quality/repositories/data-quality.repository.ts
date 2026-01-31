/**
 * Data Quality Module - Repository
 *
 * Handles all database operations for data quality issues
 */

import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
import db, { getConnection } from "../../../config/database.js";
import {
  DataQualityIssue,
  IssueType,
  IssueSeverity,
  IssueStatus,
  IssueSummary,
} from "../entities/data-quality.entity.js";

export class DataQualityRepository {
  // ── Issue queries ───────────────────────────────────────────────────────────

  static async findIssues(
    filters: {
      type?: IssueType;
      severity?: IssueSeverity;
      status?: IssueStatus;
      affectsCalc?: boolean;
    },
    page: number = 1,
    limit: number = 50,
    conn?: PoolConnection,
  ): Promise<{ issues: DataQualityIssue[]; total: number }> {
    const executor = conn ?? db;
    const whereClauses: string[] = ["1=1"];
    const params: any[] = [];

    if (filters.type) {
      whereClauses.push("issue_type = ?");
      params.push(filters.type);
    }

    if (filters.severity) {
      whereClauses.push("severity = ?");
      params.push(filters.severity);
    }

    if (filters.status) {
      whereClauses.push("status = ?");
      params.push(filters.status);
    } else {
      whereClauses.push("status IN ('OPEN', 'IN_PROGRESS')");
    }

    if (filters.affectsCalc !== undefined) {
      whereClauses.push("affected_calculation = ?");
      params.push(filters.affectsCalc ? 1 : 0);
    }

    const whereClause = whereClauses.join(" AND ");

    // Count total
    const [countRows] = await executor.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM dq_issues WHERE ${whereClause}`,
      params,
    );
    const total = Number((countRows[0] as any)?.total || 0);

    // Get issues
    const offset = (page - 1) * limit;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT * FROM dq_issues
       WHERE ${whereClause}
       ORDER BY FIELD(severity, 'HIGH', 'MEDIUM', 'LOW'), detected_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const issues: DataQualityIssue[] = (rows as any[]).map((row) => ({
      issue_id: row.issue_id,
      issue_type: row.issue_type,
      severity: row.severity,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      citizen_id: row.citizen_id,
      description: row.description,
      affected_calculation: row.affected_calculation === 1,
      status: row.status,
      detected_at: row.detected_at,
      resolved_at: row.resolved_at,
      resolved_by: row.resolved_by,
      resolution_note: row.resolution_note,
    }));

    return { issues, total };
  }

  static async findSummary(conn?: PoolConnection): Promise<IssueSummary[]> {
    const executor = conn ?? db;
    const [rows] = await executor.query<RowDataPacket[]>(
      "SELECT * FROM vw_data_quality_summary",
    );

    return (rows as any[]).map((row) => ({
      issue_type: row.issue_type,
      severity: row.severity,
      issue_count: row.issue_count,
      affecting_calc_count: row.affecting_calc_count,
    }));
  }

  // ── Create issue ────────────────────────────────────────────────────────────

  static async create(
    type: IssueType,
    severity: IssueSeverity,
    entityType: string,
    description: string,
    entityId?: number,
    citizenId?: string,
    affectsCalc: boolean = false,
    conn?: PoolConnection,
  ): Promise<number> {
    const executor = conn ?? db;
    const [result] = await executor.execute<ResultSetHeader>(
      `INSERT INTO dq_issues
       (issue_type, severity, entity_type, entity_id, citizen_id, description, affected_calculation)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        severity,
        entityType,
        entityId || null,
        citizenId || null,
        description,
        affectsCalc ? 1 : 0,
      ],
    );
    return result.insertId;
  }

  // ── Update status ───────────────────────────────────────────────────────────

  static async updateStatus(
    issueId: number,
    status: IssueStatus,
    resolvedBy?: number,
    note?: string,
    conn?: PoolConnection,
  ): Promise<void> {
    const executor = conn ?? db;
    let sql = "UPDATE dq_issues SET status = ?";
    const params: any[] = [status];

    if (status === IssueStatus.RESOLVED && resolvedBy) {
      sql += ", resolved_at = NOW(), resolved_by = ?";
      params.push(resolvedBy);
    }

    if (note) {
      sql += ", resolution_note = ?";
      params.push(note);
    }

    sql += " WHERE issue_id = ?";
    params.push(issueId);

    await executor.execute(sql, params);
  }

  // ── Check queries for scheduled job ─────────────────────────────────────────

  static async findExpiredLicenses(conn: PoolConnection): Promise<any[]> {
    const [rows] = await conn.query<RowDataPacket[]>(`
      SELECT e.citizen_id, e.first_name, e.last_name, e.license_end_date
      FROM emp_profiles e
      WHERE e.license_end_date IS NOT NULL
        AND e.license_end_date < CURDATE()
        AND NOT EXISTS (
          SELECT 1 FROM dq_issues i
          WHERE i.citizen_id = e.citizen_id
            AND i.issue_type = 'LICENSE_EXPIRED'
            AND i.status IN ('OPEN', 'IN_PROGRESS')
        )
    `);
    return rows as any[];
  }

  static async findMissingWardMapping(conn: PoolConnection): Promise<any[]> {
    const [rows] = await conn.query<RowDataPacket[]>(`
      SELECT e.citizen_id, e.first_name, e.last_name
      FROM emp_profiles e
      WHERE (e.sub_department IS NULL OR e.sub_department = '')
        AND NOT EXISTS (
          SELECT 1 FROM dq_issues i
          WHERE i.citizen_id = e.citizen_id
            AND i.issue_type = 'WARD_MAPPING_MISSING'
            AND i.status IN ('OPEN', 'IN_PROGRESS')
        )
    `);
    return rows as any[];
  }

  static async findIncompleteEmployees(conn: PoolConnection): Promise<any[]> {
    const [rows] = await conn.query<RowDataPacket[]>(`
      SELECT e.citizen_id, e.first_name, e.last_name
      FROM emp_profiles e
      WHERE (e.position_name IS NULL OR e.position_name = ''
             OR e.department IS NULL OR e.department = '')
        AND NOT EXISTS (
          SELECT 1 FROM dq_issues i
          WHERE i.citizen_id = e.citizen_id
            AND i.issue_type = 'EMPLOYEE_DATA_INCOMPLETE'
            AND i.status IN ('OPEN', 'IN_PROGRESS')
        )
    `);
    return rows as any[];
  }

  // ── Auto-resolve queries ────────────────────────────────────────────────────

  static async autoResolveLicenseIssues(conn: PoolConnection): Promise<number> {
    const [result] = await conn.execute<ResultSetHeader>(`
      UPDATE dq_issues i
      JOIN emp_profiles e ON i.citizen_id = e.citizen_id
      SET i.status = 'RESOLVED',
          i.resolved_at = NOW(),
          i.resolution_note = 'Auto-resolved: License renewed'
      WHERE i.issue_type = 'LICENSE_EXPIRED'
        AND i.status = 'OPEN'
        AND e.license_end_date >= CURDATE()
    `);
    return result.affectedRows;
  }

  static async autoResolveWardIssues(conn: PoolConnection): Promise<number> {
    const [result] = await conn.execute<ResultSetHeader>(`
      UPDATE dq_issues i
      JOIN emp_profiles e ON i.citizen_id = e.citizen_id
      SET i.status = 'RESOLVED',
          i.resolved_at = NOW(),
          i.resolution_note = 'Auto-resolved: Ward mapping added'
      WHERE i.issue_type = 'WARD_MAPPING_MISSING'
        AND i.status = 'OPEN'
        AND e.sub_department IS NOT NULL
        AND e.sub_department != ''
    `);
    return result.affectedRows;
  }

  static async autoResolveIncompleteIssues(
    conn: PoolConnection,
  ): Promise<number> {
    const [result] = await conn.execute<ResultSetHeader>(`
      UPDATE dq_issues i
      JOIN emp_profiles e ON i.citizen_id = e.citizen_id
      SET i.status = 'RESOLVED',
          i.resolved_at = NOW(),
          i.resolution_note = 'Auto-resolved: Data completed'
      WHERE i.issue_type = 'EMPLOYEE_DATA_INCOMPLETE'
        AND i.status = 'OPEN'
        AND e.position_name IS NOT NULL
        AND e.position_name != ''
        AND e.department IS NOT NULL
        AND e.department != ''
    `);
    return result.affectedRows;
  }

  // ── Connection helper ───────────────────────────────────────────────────────

  static async getConnection(): Promise<PoolConnection> {
    return getConnection();
  }
}
