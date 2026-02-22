import { RowDataPacket } from 'mysql2/promise';
import db from '@config/database.js';

export class OpsStatusRepository {
  static async countNotificationOutboxByStatus(): Promise<
    Array<{ status: string; count: number }>
  > {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count
       FROM ntf_outbox
       GROUP BY status`,
    );
    return (rows as Array<{ status: string; count: number }>).map((row) => ({
      status: String(row.status),
      count: Number(row.count ?? 0),
    }));
  }

  static async findLatestNotificationOutbox(limit: number = 20): Promise<
    Array<{
      outbox_id: number;
      status: string;
      attempts: number;
      last_error: string | null;
      available_at: Date;
      created_at: Date;
      processed_at: Date | null;
    }>
  > {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT outbox_id, status, attempts, last_error, available_at, created_at, processed_at
       FROM ntf_outbox
       ORDER BY created_at DESC
       LIMIT ${safeLimit}`,
    );
    return rows as Array<{
      outbox_id: number;
      status: string;
      attempts: number;
      last_error: string | null;
      available_at: Date;
      created_at: Date;
      processed_at: Date | null;
    }>;
  }

  static async countOpenPayrollPeriods(): Promise<number> {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM pay_periods WHERE status <> 'CLOSED'",
    );
    return Number((rows[0] as { count?: number } | undefined)?.count ?? 0);
  }

  static async findLatestOpenPayrollPeriods(limit: number = 5): Promise<
    Array<{
      period_id: number;
      period_year: number;
      period_month: number;
      status: string;
      snapshot_status: string;
      updated_at: Date;
    }>
  > {
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT period_id, period_year, period_month, status, snapshot_status, updated_at
       FROM pay_periods
       WHERE status <> 'CLOSED'
       ORDER BY period_year DESC, period_month DESC
       LIMIT ${safeLimit}`,
    );
    return rows as Array<{
      period_id: number;
      period_year: number;
      period_month: number;
      status: string;
      snapshot_status: string;
      updated_at: Date;
    }>;
  }
}
