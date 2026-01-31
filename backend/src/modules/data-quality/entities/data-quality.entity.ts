/**
 * Data Quality Module - Entity Definitions
 *
 * TypeScript interfaces for data quality issues
 */

// ─── Issue types ──────────────────────────────────────────────────────────────

export enum IssueType {
  LICENSE_EXPIRED = "LICENSE_EXPIRED",
  LICENSE_MISSING = "LICENSE_MISSING",
  LEAVE_QUOTA_MISSING = "LEAVE_QUOTA_MISSING",
  WARD_MAPPING_MISSING = "WARD_MAPPING_MISSING",
  EMPLOYEE_DATA_INCOMPLETE = "EMPLOYEE_DATA_INCOMPLETE",
  RATE_CONFIG_MISSING = "RATE_CONFIG_MISSING",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  OTHER = "OTHER",
}

// ─── Issue severity ───────────────────────────────────────────────────────────

export enum IssueSeverity {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

// ─── Issue status ─────────────────────────────────────────────────────────────

export enum IssueStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  IGNORED = "IGNORED",
}

// ─── dq_issues table ──────────────────────────────────────────────────────────

export interface DataQualityIssue {
  issue_id: number;
  issue_type: IssueType;
  severity: IssueSeverity;
  entity_type: string;
  entity_id: number | null;
  citizen_id: string | null;
  description: string;
  affected_calculation: boolean;
  status: IssueStatus;
  detected_at: Date;
  resolved_at: Date | null;
  resolved_by: number | null;
  resolution_note: string | null;
}

// ─── Issue summary ────────────────────────────────────────────────────────────

export interface IssueSummary {
  issue_type: IssueType;
  severity: IssueSeverity;
  issue_count: number;
  affecting_calc_count: number;
}

// ─── Dashboard data ───────────────────────────────────────────────────────────

export interface DataQualityDashboard {
  totalIssues: number;
  criticalIssues: number;
  affectingCalculation: number;
  byType: IssueSummary[];
  bySeverity: Array<{ severity: IssueSeverity; count: number }>;
  recentIssues: DataQualityIssue[];
}

// ─── Check result ─────────────────────────────────────────────────────────────

export interface DataQualityCheckResult {
  checksRun: number;
  issuesFound: number;
  errors: string[];
}
