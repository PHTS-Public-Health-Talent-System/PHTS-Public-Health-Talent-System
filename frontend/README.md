# PHTS Frontend

Next.js (App Router) UI for the P.T.S. system.

This README is written to be practical and complete: folder structure, feature organization, and how the UI is wired to backend APIs.

---

## 1) UI Architecture Overview

The frontend is organized by domain under `src/features/`, and routes are under `src/app/`.
Each feature module typically has:
- `api.ts` – API wrapper
- `hooks.ts` – React Query hooks
- `utils.ts` – domain helpers

---

## 2) Directory Structure

```
frontend/
├─ src/
│  ├─ app/                    # Next.js App Router
│  │  ├─ dashboard/           # Role-based pages
│  │  └─ login/               # Auth page
│  ├─ components/             # Shared UI components
│  ├─ features/               # Feature modules (api + hooks)
│  ├─ theme/                  # Theme setup
│  └─ types/                  # App-wide types
├─ public/
├─ next.config.ts
└─ package.json
```

---

## 3) Environment

Required file:
- `frontend/.env.local`

Common keys:
- `NEXT_PUBLIC_API_URL`

---

## 4) Commands

```
# dev
cd frontend
npm run dev

# lint / typecheck
npm run lint
npm run typecheck

# build
npm run build
```

---

## 5) Roles & Main Routes

Routes live under `/dashboard/*`.

- USER
  - `/dashboard/user/*`

- HEAD_WARD
  - `/dashboard/head-ward/*`

- HEAD_DEPT
  - `/dashboard/head-dept/*`

- PTS_OFFICER
  - `/dashboard/pts-officer/*`

- HEAD_HR
  - `/dashboard/hr-head/*`

- HEAD_FINANCE
  - `/dashboard/finance-head/*`

- DIRECTOR
  - `/dashboard/director/*`

- FINANCE_OFFICER
  - `/dashboard/finance-officer/*`

- ADMIN
  - `/dashboard/admin/*`

---

## 6) Feature Modules (Examples)

- `features/request/` – request workflow APIs, approvals, attachments
- `features/payroll/` – periods, calculation, reports
- `features/snapshot/` – freeze/unfreeze and snapshot data
- `features/license-alerts/` – license expiry monitoring
- `features/master-data/` – holidays and payment rates

---

## 7) Development Conventions
- Pages should call **hooks** instead of calling API directly
- Keep API and UI concerns separated
- New features should follow the `features/<domain>` pattern

---

## 8) UI Stack
- Next.js App Router
- React Query
- Shadcn UI + Tailwind
