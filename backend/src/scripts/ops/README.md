# Scheduled Jobs (Ops Checklist)

## Timezone

- Job date logic uses `OPS_JOB_TIMEZONE` (default: `Asia/Bangkok`).
- Set in runtime environment:
  - `OPS_JOB_TIMEZONE=Asia/Bangkok`

## Run all jobs

```bash
npm run jobs:run
```

Note:
- Backup schedule now has a built-in worker in backend app process (`BACKUP_WORKER_ENABLED=true`).
- `jobs:run` cron can still be used as an ops fallback if needed.

## Run specific jobs

```bash
npm run jobs:run leave-report
npm run jobs:run retirement-cut
npm run jobs:run movement-cut
npm run jobs:run notification-outbox
npm run jobs:run sync
```

`movement-cut` is intentionally on-demand as a safety-net, because movement cutoff is already applied immediately in sync flow.

## Legacy movement report

Use this to inspect `emp_movements` rows that still do not have `source_movement_id`.
These are legacy/manual rows that were not linked to current HRMS source records.

```bash
npm run report:legacy-movements
```

The report shows:
- total linked vs legacy rows
- breakdown by `movement_type`
- recent creation dates of legacy rows
- latest sample rows for manual review

## Notification outbox notes

- App server now runs a built-in outbox worker by default (`NOTIFICATION_OUTBOX_WORKER_ENABLED=true`).
- Cron `notification-outbox` job is still useful as an operational fallback.
- Retry and dead-letter behavior are controlled by:
  - `NOTIFICATION_OUTBOX_MAX_ATTEMPTS`
  - `NOTIFICATION_OUTBOX_RETRY_BASE_SECONDS`
  - `NOTIFICATION_OUTBOX_RETRY_MAX_SECONDS`
  - `NOTIFICATION_OUTBOX_PROCESSING_TIMEOUT_SECONDS`

## Snapshot outbox notes

- App server runs a built-in snapshot worker by default (`SNAPSHOT_WORKER_ENABLED=true`).
- Cron `snapshot-outbox` job remains a valid operational fallback.
- Retry and dead-letter behavior are controlled by:
  - `SNAPSHOT_OUTBOX_MAX_ATTEMPTS`
  - `SNAPSHOT_OUTBOX_RETRY_BASE_SECONDS`
  - `SNAPSHOT_OUTBOX_RETRY_MAX_SECONDS`
  - `SNAPSHOT_OUTBOX_PROCESSING_TIMEOUT_SECONDS`

## Sync worker notes

- App server runs built-in sync worker by default (`SYNC_WORKER_ENABLED=true`).
- Schedule modes:
  - `SYNC_AUTO_MODE=DAILY` uses `SYNC_AUTO_DAILY_HOUR` + `SYNC_AUTO_DAILY_MINUTE`
  - `SYNC_AUTO_MODE=INTERVAL` uses `SYNC_AUTO_INTERVAL_MINUTES`
- Timezone for daily mode: `SYNC_AUTO_TIMEZONE` (default `Asia/Bangkok`).
- Worker poll interval: `SYNC_WORKER_POLL_MS`.
- Built-in sync lock prevents overlapping runs.

## OCR worker notes

- App server runs built-in OCR worker by default (`OCR_WORKER_ENABLED=true`).
- Current OCR status in system ops is based on:
  - Redis queue depth for `request:ocr:precheck:queue`
  - whether OCR service URL is configured
  - whether the worker is enabled
- OCR still stores per-request processing state under `submission_data.ocr_precheck`.

## Cron example

```cron
# every 15 minutes
*/15 * * * * cd /path/to/phts-project/backend && OPS_JOB_TIMEZONE=Asia/Bangkok npm run jobs:run >> /var/log/phts-jobs.log 2>&1
```

If you prefer wrapper script instead of npm command, use:

```bash
src/scripts/ops/cron/jobs.sh [job-name]
```
