/**
 * PHTS System - Access Review Service
 *
 * Handles post-sync access review cycles focused on:
 * - new/changed users from sync
 * - role/scope mismatch verification
 */

import { NotificationService } from '@/modules/notification/services/notification.service.js';
import { emitAuditEvent, AuditEventType } from '@/modules/audit/services/audit.service.js';
import { RoleAssignmentService } from '@/modules/sync/services/role-assignment.service.js';
import {
  inferScopeType,
  parseSpecialPositionScopes,
  removeOverlaps,
} from '@/modules/request/scope/utils.js';
import { getSyncRuntimeStatus } from '@/modules/sync/services/sync-status.service.js';
import { AccessReviewRepository } from '@/modules/access-review/repositories/access-review.repository.js';

/**
 * Review cycle status
 */
export enum ReviewCycleStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

/**
 * Review result for a user
 */
export enum ReviewResult {
  KEEP = 'KEEP',
  DISABLE = 'DISABLE',
  PENDING = 'PENDING',
}

/**
 * Access review cycle
 */
export interface ReviewCycle {
  cycle_id: number;
  quarter: number;
  year: number;
  status: ReviewCycleStatus;
  start_date: Date;
  due_date: Date;
  completed_at: Date | null;
  completed_by: number | null;
  total_users: number;
  reviewed_users: number;
  disabled_users: number;
}

/**
 * Access review item (per user)
 */
export interface ReviewItem {
  item_id: number;
  cycle_id: number;
  user_id: number;
  citizen_id: string;
  user_name: string;
  current_role: string;
  employee_status: string | null;
  last_login_at: Date | null;
  review_result: ReviewResult;
  reviewed_at: Date | null;
  reviewed_by: number | null;
  review_note: string | null;
  auto_disabled: boolean;
}

function getCurrentQuarter(): { quarter: number; year: number } {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return { quarter, year: now.getFullYear() };
}

function getQuarterDates(
  quarter: number,
  year: number,
): { startDate: Date; dueDate: Date } {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const dueDate = new Date(year, startMonth, 14);
  return { startDate, dueDate };
}

const INACTIVE_STATUS_KEYWORDS = [
  'ลาออก',
  'เกษียณ',
  'เสียชีวิต',
  'โอนออก',
  'not working',
  'inactive',
  'resigned',
  'retired',
  'deceased',
  'terminated',
];

function isInactiveEmployeeStatus(status: string | null | undefined): boolean {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return INACTIVE_STATUS_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
}

function buildScopeExplanation(
  role: string,
  specialPosition: string | null | undefined,
): string | null {
  if (role !== 'HEAD_WARD' && role !== 'HEAD_DEPT') return null;
  const rawScopes = parseSpecialPositionScopes(specialPosition ?? null);
  if (rawScopes.length === 0) return 'ไม่พบ special_position ที่ใช้คำนวณ scope';

  const wardScopes = rawScopes.filter((scope) => inferScopeType(scope) === 'UNIT');
  const deptScopes = rawScopes.filter((scope) => inferScopeType(scope) === 'DEPT');
  const cleanedWardScopes = removeOverlaps(wardScopes, deptScopes);

  return [
    `special_position: ${String(specialPosition ?? '-')}`,
    `ward_scopes: ${cleanedWardScopes.length ? cleanedWardScopes.join(', ') : '-'}`,
    `dept_scopes: ${deptScopes.length ? deptScopes.join(', ') : '-'}`,
  ].join(' | ');
}

type ReviewCandidate = {
  id: number;
  role: string;
  employee_status: string | null;
  last_login_at: Date | null;
  reviewNote: string;
};

async function buildReviewCandidates(
  connection: Awaited<ReturnType<typeof AccessReviewRepository.getConnection>>,
  options?: { syncTimestamp?: Date | null; citizenId?: string | null },
): Promise<ReviewCandidate[]> {
  const users = await AccessReviewRepository.findActiveNonAdminUsers(connection);
  const syncTimestamp = options?.syncTimestamp ?? null;

  return (users as any[])
    .filter((user) =>
      options?.citizenId
        ? String(user.citizen_id ?? '') === String(options.citizenId)
        : true,
    )
    .map((user) => {
      const hrRow = {
        citizen_id: String(user.citizen_id ?? ''),
        position_name: user.position_name ?? null,
        special_position: user.special_position ?? null,
        department: user.department ?? null,
        sub_department: user.sub_department ?? null,
      };

      const currentRole = String(user.role ?? '');
      const isProtectedRole = RoleAssignmentService.PROTECTED_ROLES.has(currentRole);
      const expectedRole = isProtectedRole
        ? currentRole
        : RoleAssignmentService.deriveRole(hrRow as any);
      const roleMismatch = expectedRole !== currentRole;
      const inactiveStatus = isInactiveEmployeeStatus(user.employee_status);
      const scopeExplanation = buildScopeExplanation(
        currentRole,
        user.special_position,
      );

      const profileSyncedAt = user.profile_synced_at
        ? new Date(user.profile_synced_at)
        : null;
      const changedByLatestSync =
        syncTimestamp && profileSyncedAt
          ? profileSyncedAt.getTime() >= syncTimestamp.getTime()
          : true;

      const shouldReview = roleMismatch || inactiveStatus || changedByLatestSync;
      const reviewNoteParts = [
        `sync_at=${syncTimestamp ? syncTimestamp.toISOString() : 'unknown'}`,
        `current_role=${currentRole || '-'}`,
        `expected_role=${expectedRole || '-'}`,
        `role_mismatch=${roleMismatch ? 'yes' : 'no'}`,
        `employee_status=${String(user.employee_status ?? '-')}`,
        scopeExplanation ? `scope=${scopeExplanation}` : null,
      ].filter(Boolean);

      return {
        ...user,
        shouldReview,
        reviewNote: reviewNoteParts.join(' | '),
      };
    })
    .filter((user) => user.shouldReview)
    .map((user) => ({
      id: Number(user.id),
      role: String(user.role ?? ''),
      employee_status: user.employee_status ?? null,
      last_login_at: user.last_login_at ?? null,
      reviewNote: String(user.reviewNote ?? ''),
    }));
}

export async function getReviewCycles(year?: number): Promise<ReviewCycle[]> {
  return AccessReviewRepository.findCycles(year);
}

export async function getReviewCycle(
  cycleId: number,
): Promise<ReviewCycle | null> {
  return AccessReviewRepository.findCycleById(cycleId);
}

export async function createReviewCycle(): Promise<ReviewCycle> {
  const syncStatus = await getSyncRuntimeStatus();
  const syncTimestampRaw = getTimestamp(syncStatus.lastResult);
  const syncTimestamp = syncTimestampRaw ? new Date(syncTimestampRaw) : null;
  const refreshResult = await refreshReviewCycleFromSync({
    syncTimestamp,
  });
  const cycle = await AccessReviewRepository.findCycleById(refreshResult.cycleId);
  if (!cycle) {
    throw new Error('Review cycle not found after refresh');
  }
  return cycle as ReviewCycle;
}

export async function refreshReviewCycleFromSync(options?: {
  actorId?: number | null;
  syncTimestamp?: Date | null;
  citizenId?: string | null;
}): Promise<{ cycleId: number; createdCycle: boolean; insertedItems: number }> {
  const { quarter, year } = getCurrentQuarter();
  const { startDate, dueDate } = getQuarterDates(quarter, year);
  const connection = await AccessReviewRepository.getConnection();

  try {
    await connection.beginTransaction();

    let cycle = await AccessReviewRepository.findActiveCycleByQuarterYear({
      quarter,
      year,
      conn: connection,
    });
    let createdCycle = false;

    if (!cycle) {
      const cycleId = await AccessReviewRepository.createCycle(
        quarter,
        year,
        startDate,
        dueDate,
        0,
        connection,
      );
      createdCycle = true;
      cycle = await AccessReviewRepository.findCycleById(cycleId, connection);
      if (!cycle) {
        throw new Error('Failed to load access review cycle after creation');
      }
    }

    const reviewCandidates = await buildReviewCandidates(connection, {
      syncTimestamp: options?.syncTimestamp ?? null,
      citizenId: options?.citizenId ?? null,
    });

    let insertedItems = 0;
    for (const user of reviewCandidates) {
      const inserted = await AccessReviewRepository.createItemIfNotExists(
        cycle.cycle_id,
        user.id,
        user.role,
        user.employee_status,
        user.last_login_at,
        user.reviewNote,
        connection,
      );
      if (inserted) insertedItems += 1;
    }

    const totalUsers = await AccessReviewRepository.countItemsByCycle(
      cycle.cycle_id,
      connection,
    );
    await AccessReviewRepository.updateCycleTotalUsers(
      cycle.cycle_id,
      totalUsers,
      connection,
    );
    await AccessReviewRepository.updateCycleStats(cycle.cycle_id, connection);

    await connection.commit();

    if (createdCycle || insertedItems > 0) {
      const admins = await AccessReviewRepository.findAdminUsers(connection);
      for (const adminId of admins) {
        await NotificationService.notifyUser(
          adminId,
          createdCycle
            ? 'สร้างรอบตรวจทานสิทธิ์อัตโนมัติหลัง Sync'
            : 'อัปเดตรายการตรวจทานสิทธิ์หลัง Sync',
          createdCycle
            ? `มีผู้ใช้ทั้งหมด ${totalUsers} คนในรอบตรวจทานล่าสุด`
            : `พบรายการต้องตรวจทานเพิ่ม ${insertedItems} รายการ`,
          `/dashboard/admin/access-review/${cycle.cycle_id}`,
          'SYSTEM',
        );
      }
    }

    await emitAuditEvent({
      eventType: AuditEventType.ACCESS_REVIEW_CREATE,
      entityType: 'access_review_cycle',
      entityId: cycle.cycle_id,
      actorId: options?.actorId ?? null,
      actionDetail: {
        action: createdCycle ? 'CREATE_OR_REFRESH' : 'REFRESH',
        inserted_items: insertedItems,
        total_users: totalUsers,
        quarter,
        year,
        sync_timestamp: options?.syncTimestamp
          ? options.syncTimestamp.toISOString()
          : null,
        target_citizen_id: options?.citizenId ?? null,
      },
    });

    return {
      cycleId: cycle.cycle_id,
      createdCycle,
      insertedItems,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function getTimestamp(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const timestamp = (value as { timestamp?: unknown }).timestamp;
  return typeof timestamp === 'string' ? timestamp : null;
}

function extractReviewNoteValue(
  reviewNote: string | null | undefined,
  key: string,
): string | null {
  if (!reviewNote) return null;
  const parts = reviewNote.split('|').map((part) => part.trim());
  const prefix = `${key}=`;
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return part.slice(prefix.length).trim() || null;
    }
  }
  return null;
}

function hasRoleMismatchFromReviewNote(
  reviewNote: string | null | undefined,
): boolean | null {
  const value = extractReviewNoteValue(reviewNote, 'role_mismatch');
  if (!value) return null;
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

export async function getReviewItems(
  cycleId: number,
  result?: ReviewResult,
): Promise<ReviewItem[]> {
  return AccessReviewRepository.findItems(cycleId, result);
}

export async function autoReviewCycle(
  cycleId: number,
  reviewerId: number,
  options?: { disableInactive?: boolean },
): Promise<{ processed: number; kept: number; disabled: number; skipped: number }> {
  const connection = await AccessReviewRepository.getConnection();
  const disableInactive = options?.disableInactive ?? true;
  const summary = {
    processed: 0,
    kept: 0,
    disabled: 0,
    skipped: 0,
  };

  try {
    await connection.beginTransaction();

    const cycle = await AccessReviewRepository.findCycleById(cycleId, connection);
    if (!cycle) {
      throw new Error('Review cycle not found');
    }
    if (cycle.status === ReviewCycleStatus.COMPLETED) {
      throw new Error('Review cycle already completed');
    }

    const pendingItems = await AccessReviewRepository.findItems(
      cycleId,
      ReviewResult.PENDING,
      connection,
    );
    summary.processed = pendingItems.length;

    for (const item of pendingItems) {
      const inactive = isInactiveEmployeeStatus(item.employee_status);
      const roleMismatch = hasRoleMismatchFromReviewNote(item.review_note);

      if (inactive && disableInactive) {
        await AccessReviewRepository.updateItemResult(
          item.item_id,
          ReviewResult.DISABLE,
          reviewerId,
          [
            item.review_note,
            'auto_review=DISABLE(reason=inactive_status)',
          ]
            .filter(Boolean)
            .join(' | '),
          connection,
        );
        await AccessReviewRepository.disableUser(item.user_id, connection);
        summary.disabled += 1;
        await emitAuditEvent(
          {
            eventType: AuditEventType.USER_DISABLE,
            entityType: 'users',
            entityId: item.user_id,
            actorId: reviewerId,
            actionDetail: {
              reason: 'access_review_auto',
              cycle_id: cycleId,
              rule: 'inactive_status',
            },
          },
          connection,
        );
        continue;
      }

      if (roleMismatch === false && !inactive) {
        await AccessReviewRepository.updateItemResult(
          item.item_id,
          ReviewResult.KEEP,
          reviewerId,
          [
            item.review_note,
            'auto_review=KEEP(reason=role_aligned)',
          ]
            .filter(Boolean)
            .join(' | '),
          connection,
        );
        summary.kept += 1;
        continue;
      }

      summary.skipped += 1;
    }

    await AccessReviewRepository.updateCycleStats(cycleId, connection);
    await connection.commit();

    await emitAuditEvent({
      eventType: AuditEventType.ACCESS_REVIEW_COMPLETE,
      entityType: 'access_review_cycle',
      entityId: cycleId,
      actorId: reviewerId,
      actionDetail: {
        action: 'AUTO_REVIEW',
        disable_inactive: disableInactive,
        ...summary,
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return summary;
}

export async function updateReviewItem(
  itemId: number,
  result: ReviewResult,
  reviewerId: number,
  note?: string,
): Promise<void> {
  const connection = await AccessReviewRepository.getConnection();

  try {
    await connection.beginTransaction();

    const item = await AccessReviewRepository.findItemById(itemId, connection);
    if (!item) {
      throw new Error('Review item not found');
    }

    await AccessReviewRepository.updateItemResult(
      itemId,
      result,
      reviewerId,
      note || null,
      connection,
    );

    if (result === ReviewResult.DISABLE) {
      await AccessReviewRepository.disableUser(item.user_id, connection);

      await NotificationService.notifyUser(
        item.user_id,
        'บัญชีถูกปิดใช้งาน',
        'บัญชีของท่านถูกปิดใช้งานจากการตรวจทานสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ',
        '/login',
        'OTHER',
      );

      await emitAuditEvent(
        {
          eventType: AuditEventType.USER_DISABLE,
          entityType: 'users',
          entityId: item.user_id,
          actorId: reviewerId,
          actionDetail: {
            reason: 'access_review',
            cycle_id: item.cycle_id,
            note,
          },
        },
        connection,
      );
    }

    await AccessReviewRepository.updateCycleStats(item.cycle_id, connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function completeReviewCycle(
  cycleId: number,
  completedBy: number,
  options?: { autoKeepPending?: boolean; note?: string },
): Promise<void> {
  const connection = await AccessReviewRepository.getConnection();

  try {
    await connection.beginTransaction();

    const pendingCount = await AccessReviewRepository.countPendingItems(
      cycleId,
      connection,
    );

    if (pendingCount > 0 && !options?.autoKeepPending) {
      throw new Error(`ยังมี ${pendingCount} รายการที่ยังไม่ได้ตรวจทาน`);
    }

    if (pendingCount > 0 && options?.autoKeepPending) {
      await AccessReviewRepository.updatePendingItemsToKeep({
        cycleId,
        completedBy,
        note: options.note ?? 'อนุมัติคงค้างอัตโนมัติขณะปิดรอบ',
        conn: connection,
      });
    }

    await AccessReviewRepository.updateCycleStats(cycleId, connection);
    await AccessReviewRepository.updateCycleStatus(
      cycleId,
      ReviewCycleStatus.COMPLETED,
      completedBy,
      connection,
    );

    await connection.commit();

    await emitAuditEvent(
      {
        eventType: AuditEventType.ACCESS_REVIEW_COMPLETE,
        entityType: 'access_review_cycle',
        entityId: cycleId,
        actorId: completedBy,
        actionDetail: {
          autoKeepPending: Boolean(options?.autoKeepPending),
          autoKeptCount: pendingCount,
          note: options?.note ?? null,
        },
      },
      connection,
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
