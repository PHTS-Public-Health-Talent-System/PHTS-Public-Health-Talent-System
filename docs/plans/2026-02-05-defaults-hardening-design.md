# Defaults & Workflow Hardening Design

Date: 2026-02-05

## Goals
- Make workflow defaults consistent with DB and code to prevent silent drift.
- Enforce evidence (signature snapshot) for request actions.
- Prevent post-freeze data mutation and retroactive drift.
- Make alerts/notifications and readiness behavior predictable and testable.

## Scope
- Request workflow, rate mapping, signature snapshot.
- Payroll + snapshot hardening.
- Alerts/notifications job behavior and dedupe.
- System readiness (DB + Redis) and maintenance signaling.
- DB defaults/backfill for core workflow tables.

## Current Risks
- `req_submissions.current_step` defaults to 0 in DB but flow assumes step 1.
- SUBMIT action stores null signature snapshot while approve requires snapshot.
- Rate mapping falls back to `NURSE` when profession cannot be resolved.
- Freeze does not fully block recalculation/adjustment paths.
- Alerts jobs rely on manual runner; frequency not clearly defined.
- `/ready` checks DB only; Redis is an actual dependency.

## Design (By Phase)

### Phase A — Request & Rate Mapping
**Behavior**
- Create: always `current_step = 1`, `status = DRAFT`.
- Submit: must store `signature_snapshot` (sig_images or applicant signature). If missing, reject submit.
- Update by owner: only DRAFT/RETURNED.
- Update by PTS_OFFICER: allowed only for verification fields (no attachments/signature).
- Rate mapping: `item_no/sub_item_no` empty -> NULL; no fallback profession (must resolve or error).

**DB changes**
- Set default `req_submissions.current_step = 1`.
- Backfill: rows with `current_step = 0` -> `1` (only DRAFT/PENDING; others logged).

**Errors**
- Submit: "signature required" if no signature.
- Rate mapping: "profession not resolved" or "rate mapping not found".

### Phase B — Payroll & Snapshot
**Behavior**
- Calculation/adjustment blocked if `is_frozen = 1`.
- Freeze only allowed if `status = CLOSED` and not already frozen.
- Retroactive updates require unfreeze with reason (audit logged).

### Phase C — Alerts & Notifications
**Behavior**
- Alerts dedupe via `alert_logs` payload hash (daily).
- Jobs run frequency documented and enforced by ops schedule.
- Notification defaults: in-app on, email/sms off (fallback logic explicit).

### Phase D — System & Health
**Behavior**
- `/ready` checks DB + Redis.
- Maintenance mode returns standardized response for client handling.

## Implementation Steps
1. DB migration for `req_submissions.current_step` default + backfill.
2. Request submit: capture signature snapshot and block if missing.
3. Remove profession fallback; return explicit error.
4. Restrict PTS_OFFICER update surface (verification only).
5. Payroll calculate/update guards when frozen.
6. Snapshot unfreeze requires reason; audit event required.
7. Health readiness includes Redis ping.
8. Update docs for defaults and policy changes.

## Testing
- Unit: submit without signature -> error.
- Unit: rate mapping with NULL item/sub-item -> correct query.
- Integration: freeze -> calculate blocked.
- Migration: verify no `current_step=0` rows remain for active statuses.
- Readiness: Redis down -> /ready = 503.

## Rollback
- Revert migration and deploy previous code.
- Use audit logs to locate impacted requests/periods for manual correction.
