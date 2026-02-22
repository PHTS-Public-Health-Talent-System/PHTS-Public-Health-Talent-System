# PHTS Backend

Express + TypeScript API for the P.T.S. system.

This document is deliberately detailed to reflect the real system design and to help onboarding new engineers quickly.

---

## 1) Architecture Overview

The backend is organized into domain modules inside `src/modules/`:
- **request** – request workflow, approvals, attachments, verification snapshot
- **payroll** – period creation, calculation, retroactive logic, reporting
- **snapshot** – period snapshots, freeze/unfreeze, report data
- **alerts** – license expiry monitoring, retirements, SLA digests
- **master-data** – holidays, payment rates
- **notification** – in‑app notifications

Each module typically contains:
- `*.routes.ts`
- `*.controller.ts`
- `*.service.ts`
- `*.repository.ts`
- `*.schema.ts`
- `entities/*`

---

## 2) Directory Structure

```
backend/
├─ src/
│  ├─ modules/
│  │  ├─ request/
│  │  ├─ payroll/
│  │  ├─ snapshot/
│  │  ├─ alerts/
│  │  ├─ master-data/
│  │  └─ notification/
│  ├─ middlewares/       # auth, validation, error handling
│  ├─ shared/            # shared utils and helpers
│  ├─ config/            # db, jwt, redis, upload
│  └─ index.ts           # app entry
├─ scripts/              # jobs / utilities
├─ uploads/              # file uploads (gitkept)
├─ .env.example
├─ jest.config.cjs
└─ package.json
```

---

## 3) Environment Setup

Required files:
- `backend/.env`
- `backend/.env.example` is the template

Common keys:
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- JWT_SECRET
- REDIS_HOST, REDIS_PORT (optional)

---

## 4) Commands

```
# dev (hot reload)
cd backend
npm run dev

# tests
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:ci

# lint / format
npm run lint
npm run format
```

---

## 5) Testing Guidelines
- Jest is separated into 3 tiers:
  - `test:unit`
  - `test:integration`
  - `test:e2e`
- Full local/CI sequence: `npm run test:ci`
- Integration tests use test DB defined by `.env.test`
- Integration test files should use `*.integration.test.ts`

Run single test:
```
cd backend
npx jest src/modules/request/__tests__/workflow.test.ts
```

---

## 6) Key Data Models (Summary)
- `req_submissions`: all request data
- `req_approvals`: approval history
- `req_eligibility`: finalized eligibility records
- `pay_periods`: payroll period
- `pay_results`: calculation results per person
- `pay_snapshots`: frozen results for reporting

---

## 7) Conventions
- TypeScript only
- camelCase for APIs and services
- Domain separation is mandatory
- Never commit secrets

---

## 8) Leave Return Report Events API (Frontend Contract)

Purpose:
- Support one leave record with multiple report/resume cycles.
- `leave_return_report_events` is the source of truth for pause/resume logic.

Base path:
- `/api/leave-management`

### List events
- `GET /:leaveManagementId/return-report-events`
- Response:
```json
{
  "success": true,
  "data": [
    {
      "event_id": 1,
      "leave_record_id": 123,
      "report_date": "2026-01-31",
      "resume_date": "2026-02-15",
      "resume_study_program": "B"
    }
  ]
}
```

### Replace events (full replace)
- `PUT /:leaveManagementId/return-report-events`
- Request:
```json
{
  "events": [
    {
      "report_date": "2026-01-31",
      "resume_date": "2026-02-15",
      "resume_study_program": "B"
    },
    {
      "report_date": "2026-03-07",
      "resume_date": "2026-03-17",
      "resume_study_program": "A"
    }
  ]
}
```
- Rules:
  - `events` must be sorted by `report_date` ascending.
  - `resume_date` must be strictly after `report_date`.
  - This endpoint replaces all existing events for that leave record.

Compatibility:
- After replace, backend also syncs legacy fields in `leave_record_extensions`
  (`return_report_status`, `return_date`) for backward compatibility.
