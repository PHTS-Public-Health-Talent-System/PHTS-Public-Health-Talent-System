import { RowDataPacket } from "mysql2/promise";
import db from "@config/database.js";

export class PayrollSchemaRepository {
  private static professionReviewTableReady = false;
  private static payResultChecksTableReady = false;
  private static payPeriodPhaseAReady = false;
  private static payPeriodPhaseAIntegrityReady = false;

  private static async hasIndex(
    tableName: string,
    indexName: string,
  ): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      `,
      [tableName, indexName],
    );
    return Number((rows[0] as any)?.cnt ?? 0) > 0;
  }

  private static async hasConstraint(
    tableName: string,
    constraintName: string,
  ): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = ?
        AND constraint_name = ?
      `,
      [tableName, constraintName],
    );
    return Number((rows[0] as any)?.cnt ?? 0) > 0;
  }

  private static async hasColumn(
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
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

  private static async hasDuplicatesForUnique(
    tableName: string,
    columns: string[],
  ): Promise<boolean> {
    const cols = columns.map((c) => `\`${c}\``).join(", ");
    const sql = `
      SELECT 1
      FROM \`${tableName}\`
      GROUP BY ${cols}
      HAVING COUNT(*) > 1
      LIMIT 1
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows.length > 0;
  }

  private static async ensurePayrollPhaseAIntegrity(): Promise<void> {
    if (PayrollSchemaRepository.payPeriodPhaseAIntegrityReady) return;

    if (!(await PayrollSchemaRepository.hasIndex("pay_period_items", "idx_pay_period_items_period"))) {
      await db.execute(
        "ALTER TABLE pay_period_items ADD INDEX idx_pay_period_items_period (period_id)",
      );
    }
    if (!(await PayrollSchemaRepository.hasIndex("pay_period_items", "idx_pay_period_items_period_citizen"))) {
      await db.execute(
        "ALTER TABLE pay_period_items ADD INDEX idx_pay_period_items_period_citizen (period_id, citizen_id)",
      );
    }
    if (!(await PayrollSchemaRepository.hasIndex("pay_period_items", "idx_pay_period_items_period_user"))) {
      await db.execute(
        "ALTER TABLE pay_period_items ADD INDEX idx_pay_period_items_period_user (period_id, user_id)",
      );
    }

    if (!(await PayrollSchemaRepository.hasIndex("pay_period_items", "uk_pay_period_items_period_request"))) {
      const hasDup = await PayrollSchemaRepository.hasDuplicatesForUnique(
        "pay_period_items",
        ["period_id", "request_id"],
      );
      if (!hasDup) {
        await db.execute(
          "ALTER TABLE pay_period_items ADD UNIQUE KEY uk_pay_period_items_period_request (period_id, request_id)",
        );
      } else {
        console.warn(
          "[payroll] skip unique uk_pay_period_items_period_request due to duplicate existing data",
        );
      }
    }

    if (!(await PayrollSchemaRepository.hasIndex("pay_results", "uk_pay_results_period_citizen"))) {
      const hasDup = await PayrollSchemaRepository.hasDuplicatesForUnique(
        "pay_results",
        ["period_id", "citizen_id"],
      );
      if (!hasDup) {
        await db.execute(
          "ALTER TABLE pay_results ADD UNIQUE KEY uk_pay_results_period_citizen (period_id, citizen_id)",
        );
      } else {
        console.warn(
          "[payroll] skip unique uk_pay_results_period_citizen due to duplicate existing data",
        );
      }
    }

    const [colRows] = await db.query<RowDataPacket[]>(
      `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'pay_result_checks'
        AND column_name = 'payout_id'
      LIMIT 1
      `,
    );
    const dtype = String((colRows[0] as any)?.data_type ?? "").toLowerCase();
    if (dtype !== "bigint") {
      await db.execute(
        "ALTER TABLE pay_result_checks MODIFY COLUMN payout_id BIGINT NOT NULL",
      );
    }

    if (!(await PayrollSchemaRepository.hasConstraint("pay_results", "fk_pay_results_period"))) {
      await db.execute(
        `
        ALTER TABLE pay_results
        ADD CONSTRAINT fk_pay_results_period
        FOREIGN KEY (period_id) REFERENCES pay_periods(period_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
        `,
      );
    }
    if (!(await PayrollSchemaRepository.hasConstraint("pay_result_items", "fk_pay_result_items_payout"))) {
      await db.execute(
        `
        ALTER TABLE pay_result_items
        ADD CONSTRAINT fk_pay_result_items_payout
        FOREIGN KEY (payout_id) REFERENCES pay_results(payout_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
        `,
      );
    }
    if (!(await PayrollSchemaRepository.hasConstraint("pay_result_checks", "fk_pay_result_checks_payout"))) {
      await db.execute(
        `
        ALTER TABLE pay_result_checks
        ADD CONSTRAINT fk_pay_result_checks_payout
        FOREIGN KEY (payout_id) REFERENCES pay_results(payout_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
        `,
      );
    }
    if (!(await PayrollSchemaRepository.hasConstraint("pay_period_profession_reviews", "fk_pay_period_prof_review_period"))) {
      await db.execute(
        `
        ALTER TABLE pay_period_profession_reviews
        ADD CONSTRAINT fk_pay_period_prof_review_period
        FOREIGN KEY (period_id) REFERENCES pay_periods(period_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
        `,
      );
    }
    if (!(await PayrollSchemaRepository.hasConstraint("pay_period_items", "fk_pay_period_items_period"))) {
      await db.execute(
        `
        ALTER TABLE pay_period_items
        ADD CONSTRAINT fk_pay_period_items_period
        FOREIGN KEY (period_id) REFERENCES pay_periods(period_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
        `,
      );
    }

    PayrollSchemaRepository.payPeriodPhaseAIntegrityReady = true;
  }

  static async ensurePayPeriodPhaseAColumns(): Promise<void> {
    if (PayrollSchemaRepository.payPeriodPhaseAReady) return;
    if (!(await PayrollSchemaRepository.hasColumn("pay_periods", "is_locked"))) {
      await db.execute(
        `
        ALTER TABLE pay_periods
        ADD COLUMN is_locked TINYINT(1) NOT NULL DEFAULT 0
        `,
      );
    }
    if (!(await PayrollSchemaRepository.hasColumn("pay_periods", "snapshot_status"))) {
      await db.execute(
        `
        ALTER TABLE pay_periods
        ADD COLUMN snapshot_status
        ENUM('PENDING','PROCESSING','READY','FAILED')
        NOT NULL DEFAULT 'PENDING'
        `,
      );
    }
    if (!(await PayrollSchemaRepository.hasColumn("pay_periods", "snapshot_ready_at"))) {
      await db.execute(
        `
        ALTER TABLE pay_periods
        ADD COLUMN snapshot_ready_at DATETIME NULL
        `,
      );
    }
    await PayrollSchemaRepository.ensurePayrollPhaseAIntegrity();
    PayrollSchemaRepository.payPeriodPhaseAReady = true;
  }

  static async ensureProfessionReviewTable(): Promise<void> {
    if (PayrollSchemaRepository.professionReviewTableReady) return;
    await db.execute(
      `
      CREATE TABLE IF NOT EXISTS pay_period_profession_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        period_id INT NOT NULL,
        profession_code VARCHAR(64) NOT NULL,
        reviewed_by INT NOT NULL,
        reviewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_period_profession (period_id, profession_code),
        INDEX idx_period (period_id)
      )
      `,
    );
    PayrollSchemaRepository.professionReviewTableReady = true;
  }

  static async ensurePayResultChecksTable(): Promise<void> {
    if (PayrollSchemaRepository.payResultChecksTableReady) return;
    await db.execute(
      `
      CREATE TABLE IF NOT EXISTS pay_result_checks (
        check_id INT AUTO_INCREMENT PRIMARY KEY,
        payout_id INT NOT NULL,
        code VARCHAR(64) NOT NULL,
        severity VARCHAR(16) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary VARCHAR(512) NULL,
        impact_days DECIMAL(6,2) NULL,
        impact_amount DECIMAL(12,2) NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        evidence_json JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_payout (payout_id),
        INDEX idx_code (code),
        INDEX idx_severity (severity)
      )
      `,
    );
    PayrollSchemaRepository.payResultChecksTableReady = true;
  }
}
