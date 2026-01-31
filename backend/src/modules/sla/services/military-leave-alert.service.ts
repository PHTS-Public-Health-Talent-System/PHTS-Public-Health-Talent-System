/**
 * PHTS System - Military Leave Alert Service
 *
 * Sends alerts to HR when employees should report back from military leave.
 * Business Rule: Must report back within 7 days after leave ends
 *
 * Scheduled Job: Runs daily with other SLA jobs
 */

import { RowDataPacket } from "mysql2/promise";
import { query } from "../../../config/database.js";
import { NotificationService } from "../../notification/services/notification.service.js";

/**
 * Military leave record pending report
 */
export interface MilitaryLeaveRecord {
  leave_id: number;
  citizen_id: string;
  employee_name: string;
  end_date: Date;
  days_since_end: number;
}

/**
 * Result of military leave alert job
 */
export interface MilitaryLeaveAlertResult {
  sent: number;
  errors: string[];
}

/**
 * Find military leave records where:
 * - Leave type is 'military'
 * - Leave has ended (end_date < today)
 * - No movement record showing return (ENTRY after leave)
 * - Days since end is between 1 and 14 (alert window)
 */
export async function getMilitaryLeavesPendingReport(): Promise<
  MilitaryLeaveRecord[]
> {
  const sql = `
    SELECT
      lr.leave_id,
      lr.citizen_id,
      CONCAT(ep.prefix_name, ep.first_name, ' ', ep.last_name) AS employee_name,
      lr.end_date,
      DATEDIFF(CURDATE(), lr.end_date) AS days_since_end
    FROM leave_records lr
    JOIN emp_profiles ep ON lr.citizen_id = ep.citizen_id
    WHERE lr.leave_type = 'military'
      AND lr.end_date < CURDATE()
      AND DATEDIFF(CURDATE(), lr.end_date) BETWEEN 1 AND 14
      AND NOT EXISTS (
        SELECT 1 FROM emp_movements em
        WHERE em.citizen_id = lr.citizen_id
          AND em.movement_type = 'ENTRY'
          AND em.effective_date > lr.end_date
      )
      AND NOT EXISTS (
        SELECT 1 FROM sla_reminder_logs srl
        WHERE srl.request_id = lr.leave_id
          AND srl.reminder_type = 'MILITARY_REPORT'
          AND DATE(srl.sent_at) = CURDATE()
      )
    ORDER BY lr.end_date ASC
  `;
  const rows = await query<RowDataPacket[]>(sql);
  return rows as MilitaryLeaveRecord[];
}

/**
 * Get active HR users to notify
 */
async function getHRUsers(): Promise<number[]> {
  const sql = `SELECT id FROM users WHERE role = 'HEAD_HR' AND is_active = 1`;
  const rows = await query<RowDataPacket[]>(sql);
  return (rows as { id: number }[]).map((r) => r.id);
}

/**
 * Log that a military leave alert was sent
 */
async function logAlertSent(leaveId: number, userId: number): Promise<void> {
  await query(
    `INSERT INTO sla_reminder_logs (request_id, step_no, target_user_id, reminder_type, sent_via)
     VALUES (?, 0, ?, 'MILITARY_REPORT', 'IN_APP')`,
    [leaveId, userId],
  );
}

/**
 * Send military leave report reminders to HR.
 * Called by scheduled job daily.
 *
 * Alert types:
 * - Days 1-7: "ใกล้ครบกำหนดรายงานตัว"
 * - Days 8+: "เกินกำหนดรายงานตัว" (OVERDUE)
 */
export async function sendMilitaryLeaveAlerts(): Promise<MilitaryLeaveAlertResult> {
  const result: MilitaryLeaveAlertResult = { sent: 0, errors: [] };

  try {
    const pendingReports = await getMilitaryLeavesPendingReport();
    if (pendingReports.length === 0) {
      return result;
    }

    const hrUsers = await getHRUsers();
    if (hrUsers.length === 0) {
      result.errors.push("No active HEAD_HR users found");
      return result;
    }

    for (const leave of pendingReports) {
      const isOverdue = leave.days_since_end > 7;
      const title = isOverdue
        ? `⚠️ ลาเกณฑ์ทหาร - เกินกำหนดรายงานตัว`
        : `📋 ลาเกณฑ์ทหาร - ใกล้ครบกำหนดรายงานตัว`;

      const message = isOverdue
        ? `${leave.employee_name} ครบกำหนดลาเกณฑ์ทหารไปแล้ว ${leave.days_since_end} วัน และยังไม่รายงานตัว (เกิน 7 วัน)`
        : `${leave.employee_name} ครบกำหนดลาเกณฑ์ทหารไปแล้ว ${leave.days_since_end} วัน ควรรายงานตัวภายใน ${7 - leave.days_since_end} วัน`;

      for (const hrUserId of hrUsers) {
        try {
          await NotificationService.notifyUser(
            hrUserId,
            title,
            message,
            "#",
            "MILITARY_LEAVE_ALERT",
          );

          await logAlertSent(leave.leave_id, hrUserId);
          result.sent++;
        } catch (err: any) {
          result.errors.push(
            `Failed to notify user ${hrUserId}: ${err.message}`,
          );
        }
      }
    }
  } catch (error: any) {
    result.errors.push(`Military leave alert error: ${error.message}`);
  }

  return result;
}
