/**
 * Delegation Module - Entity Definitions
 *
 * TypeScript interfaces matching delegation-related DB tables
 */

// ─── Delegation Status ────────────────────────────────────────────────────────

export enum DelegationStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

// ─── Scope Type ───────────────────────────────────────────────────────────────

export enum DelegationScopeType {
  ALL = "ALL",
  DEPARTMENT = "DEPARTMENT",
  SUB_DEPARTMENT = "SUB_DEPARTMENT",
}

// ─── wf_delegations table ─────────────────────────────────────────────────────

export interface Delegation {
  delegation_id: number;
  delegator_id: number;
  delegator_name: string;
  delegate_id: number;
  delegate_name: string;
  delegated_role: string;
  scope_type: DelegationScopeType;
  scope_value: string | null;
  start_date: Date;
  end_date: Date;
  reason: string | null;
  status: DelegationStatus;
  cancelled_at: Date | null;
  cancelled_by: number | null;
  created_at: Date;
}

// ─── Create delegation input ──────────────────────────────────────────────────

export interface CreateDelegationInput {
  delegateId: number;
  delegatedRole: string;
  scopeType?: DelegationScopeType;
  scopeValue?: string;
  startDate: Date | string;
  endDate: Date | string;
  reason?: string;
}

// ─── Can act as role result ───────────────────────────────────────────────────

export interface CanActAsRoleResult {
  canAct: boolean;
  delegationId: number | null;
  delegatorId: number | null;
}

// ─── User candidate ───────────────────────────────────────────────────────────

export interface UserCandidate {
  id: number;
  role: string;
  citizen_id: string;
  first_name: string;
  last_name: string;
}
