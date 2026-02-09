# User Dashboard (/user) - Data Integration Design

Date: 2026-02-09

## Goal
Replace mock data on `/user` dashboard with real API data while preserving existing UI structure and layout. Use existing endpoints first; add new endpoints only if a gap is found.

## Data Sources & Mapping
- Current user: `GET /api/auth/me` via `useCurrentUser()`
  - Map to PageHeader greeting: first_name + last_name (fallback to existing fields if missing).
- My requests: `GET /api/requests/my` via `useMyRequests()` (or existing my-requests hook)
  - Stats (all-time):
    - Total = count
    - Pending = status === PENDING
    - Approved = status === APPROVED (optionally include PAID if backend uses it later)
  - Recent requests (top 3): sort by `created_at` (fallback `submitted_at`, then `updated_at`), desc.
  - Display ID: use `toRequestDisplayId(request_id, created_at)`.
  - Status labels: reuse `StatusBadge` with label derived from status + `current_step`.
- Notifications: `GET /api/notifications` via `useNotifications()`
  - Use `unreadCount` for “แจ้งเตือนใหม่”.
- Announcements: `GET /api/announcements/active` via `useActiveAnnouncements()`
  - Show latest 3 by `created_at` (fallback to index order).

## Data Flow
- Page remains client component. Load data via existing hooks.
- Map API data into existing arrays (`stats`, `recentRequests`, `announcements`) without altering layout/structure.

## Loading & Error Handling
- Do not alter layout. When loading, keep sections and show placeholders (e.g., '-' or 0) without removing blocks.
- If a data source fails, degrade only that section: set safe defaults and avoid crashing the page.
- No blocking errors; optional toast for errors if already used in similar pages.

## Edge Cases
- Missing `created_at`: fallback to `submitted_at` or `updated_at`.
- Missing amount: display “-”.
- Unknown status: fallback label using raw status.

## Testing
- Manual checks:
  - Dashboard renders with real data, structure unchanged.
  - Stats numbers match request list counts.
  - Recent requests show correct order.
  - Announcements show up to 3.
  - Notifications unread count displays correctly.

## Implementation Notes
- Prefer reusing existing hooks in `/features`.
- Avoid adding new endpoints unless required by missing data.
