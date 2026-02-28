import bcrypt from 'bcryptjs';
import db from '@config/database.js';
import { SyncService } from '@/modules/sync/services/sync.service.js';
import {
  getAccessReviewQueue,
  resolveAccessReviewQueueItem,
} from '@/modules/access-review/services/access-review.service.js';

const DEFAULT_MISMATCH_COUNT = 12;
const PREFIX_12 = '119900000'; // 9 digits -> use with 3-digit sequence
const PASSWORD = 'Phts@1234';

type SeedUser = {
  citizenId: string;
  role: 'ADMIN' | 'USER' | 'FINANCE_OFFICER';
  firstName: string;
  lastName: string;
};

function checksum12(prefix12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(prefix12[i]) * (13 - i);
  }
  return (11 - (sum % 11)) % 10;
}

function makeThaiCitizenId(prefix12: string): string {
  return `${prefix12}${checksum12(prefix12)}`;
}

function buildSeedUsers(mismatchCount: number): {
  admin: SeedUser;
  normalUser: SeedUser;
  mismatchUsers: SeedUser[];
} {
  const admin: SeedUser = {
    citizenId: makeThaiCitizenId(`${PREFIX_12}001`),
    role: 'ADMIN',
    firstName: 'ทดสอบ',
    lastName: 'แอดมิน',
  };

  const normalUser: SeedUser = {
    citizenId: makeThaiCitizenId(`${PREFIX_12}002`),
    role: 'USER',
    firstName: 'ทดสอบ',
    lastName: 'ผู้ใช้',
  };

  const mismatchUsers: SeedUser[] = [];
  for (let i = 0; i < mismatchCount; i += 1) {
    const seq = String(100 + i).padStart(3, '0');
    mismatchUsers.push({
      citizenId: makeThaiCitizenId(`${PREFIX_12}${seq}`),
      role: 'FINANCE_OFFICER',
      firstName: `คิว${i + 1}`,
      lastName: 'ทดสอบ',
    });
  }

  return { admin, normalUser, mismatchUsers };
}

async function seedData(users: SeedUser[]): Promise<void> {
  const conn = await db.getConnection();
  const hash = await bcrypt.hash(PASSWORD, 10);

  try {
    await conn.beginTransaction();

    for (const user of users) {
      await conn.execute(
        `INSERT INTO users (citizen_id, password_hash, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 1, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           is_active = VALUES(is_active),
           updated_at = NOW()`,
        [user.citizenId, hash, user.role],
      );

      await conn.execute(
        `INSERT INTO emp_profiles
           (citizen_id, title, first_name, last_name, position_name, special_position,
            emp_type, department, sub_department, mission_group,
            original_status, is_currently_active, status_code, status_text,
            source_system, source_updated_at, last_synced_at)
         VALUES
           (?, 'นาย', ?, ?, 'เจ้าพนักงานธุรการ', NULL,
            'ข้าราชการ', 'กลุ่มงานการเงิน', 'หน่วยทดสอบ', 'กลุ่มภารกิจ',
            'ปฏิบัติงาน (ตรง จ.)', 1, 'ACTIVE', 'ปฏิบัติงาน (ตรง จ.)',
            'HRMS', NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           first_name = VALUES(first_name),
           last_name = VALUES(last_name),
           position_name = VALUES(position_name),
           special_position = VALUES(special_position),
           emp_type = VALUES(emp_type),
           department = VALUES(department),
           sub_department = VALUES(sub_department),
           mission_group = VALUES(mission_group),
           original_status = VALUES(original_status),
           is_currently_active = VALUES(is_currently_active),
           status_code = VALUES(status_code),
           status_text = VALUES(status_text),
           source_system = VALUES(source_system),
           source_updated_at = VALUES(source_updated_at),
           last_synced_at = VALUES(last_synced_at)`,
        [user.citizenId, user.firstName, user.lastName],
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function cleanupByPrefix(prefixLike: string): Promise<void> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DROP TEMPORARY TABLE IF EXISTS tmp_smoke_users');

    await conn.execute(
      `CREATE TEMPORARY TABLE tmp_smoke_users AS
       SELECT id, citizen_id FROM users WHERE citizen_id LIKE ?`,
      [prefixLike],
    );

    await conn.execute(
      `DELETE e FROM access_review_queue_events e
       JOIN access_review_queue q ON q.queue_id = e.queue_id
       JOIN tmp_smoke_users u ON u.id = q.user_id`,
    );

    await conn.execute(
      `DELETE q FROM access_review_queue q
       JOIN tmp_smoke_users u ON u.id = q.user_id`,
    );

    await conn.execute(
      `DELETE i FROM audit_review_items i
       JOIN tmp_smoke_users u ON u.id = i.user_id`,
    );

    await conn.execute(
      `DELETE a FROM user_sync_state_audits a
       JOIN tmp_smoke_users u ON u.id = a.user_id`,
    );

    await conn.execute(
      `DELETE p FROM emp_profiles p
       JOIN tmp_smoke_users u ON u.citizen_id = p.citizen_id`,
    );

    await conn.execute(
      `DELETE s FROM emp_support_staff s
       JOIN tmp_smoke_users u ON u.citizen_id = s.citizen_id`,
    );

    await conn.execute(
      `DELETE u0 FROM users u0
       JOIN tmp_smoke_users u ON u.id = u0.id`,
    );
    await conn.execute('DROP TEMPORARY TABLE IF EXISTS tmp_smoke_users');

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const v = value.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes') return true;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return fallback;
}

async function main() {
  const mismatchCount = Math.max(
    2,
    Number.parseInt(process.env.ACCESS_REVIEW_SMOKE_COUNT ?? String(DEFAULT_MISMATCH_COUNT), 10) ||
      DEFAULT_MISMATCH_COUNT,
  );
  const keepData = toBool(process.env.ACCESS_REVIEW_SMOKE_KEEP_DATA, false);
  const prefixLike = `${PREFIX_12}%`;

  const { admin, normalUser, mismatchUsers } = buildSeedUsers(mismatchCount);
  const allUsers = [admin, normalUser, ...mismatchUsers];

  console.log('[AccessReviewSmoke] Cleanup before seed...');
  await cleanupByPrefix(prefixLike);

  console.log(`[AccessReviewSmoke] Seeding ${allUsers.length} users...`);
  await seedData(allUsers);

  console.log('[AccessReviewSmoke] Triggering full sync...');
  await SyncService.performFullSync();

  console.log('[AccessReviewSmoke] Checking queue pagination...');
  const page1 = await getAccessReviewQueue({
    page: 1,
    limit: 10,
    search: PREFIX_12,
    reasonCode: 'ROLE_MISMATCH',
  });
  const page2 = await getAccessReviewQueue({
    page: 2,
    limit: 10,
    search: PREFIX_12,
    reasonCode: 'ROLE_MISMATCH',
  });

  if (page1.total !== mismatchCount) {
    throw new Error(
      `Expected ${mismatchCount} ROLE_MISMATCH records, got ${page1.total}.`,
    );
  }

  if (page1.rows.length !== 10) {
    throw new Error(`Expected page 1 size=10, got ${page1.rows.length}.`);
  }

  if (page2.rows.length < 1) {
    throw new Error('Expected page 2 to contain at least 1 row.');
  }

  const firstRow = page1.rows[0];
  const queueId = Number(firstRow.queue_id);
  const adminUserId = await (async () => {
    const [rows] = await db.query<any[]>(
      'SELECT id FROM users WHERE citizen_id = ? LIMIT 1',
      [admin.citizenId],
    );
    return Number(rows[0]?.id ?? 0);
  })();

  if (!queueId || !adminUserId) {
    throw new Error('Missing queue item or admin user id for resolve test.');
  }

  console.log(`[AccessReviewSmoke] Resolving queue_id=${queueId}...`);
  await resolveAccessReviewQueueItem({
    queueId,
    action: 'RESOLVE',
    actorId: adminUserId,
    note: 'smoke-test-resolve',
  });

  const verify = await getAccessReviewQueue({
    page: 1,
    limit: 20,
    search: String(firstRow.citizen_id ?? ''),
  });

  const resolved = verify.rows.find((row) => Number(row.queue_id) === queueId);
  if (!resolved || resolved.status !== 'RESOLVED') {
    throw new Error(`Expected queue_id=${queueId} to be RESOLVED.`);
  }

  console.log('[AccessReviewSmoke] PASS');
  console.log(
    JSON.stringify(
      {
        seed_users: allUsers.length,
        mismatch_expected: mismatchCount,
        queue_total: page1.total,
        page1_rows: page1.rows.length,
        page2_rows: page2.rows.length,
        resolved_queue_id: queueId,
      },
      null,
      2,
    ),
  );

  if (!keepData) {
    console.log('[AccessReviewSmoke] Cleanup after test...');
    await cleanupByPrefix(prefixLike);
  } else {
    console.log('[AccessReviewSmoke] Keep data enabled, skip cleanup.');
  }
}

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('[AccessReviewSmoke] FAIL:', error);
    process.exit(1);
  });
