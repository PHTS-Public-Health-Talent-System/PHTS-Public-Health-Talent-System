# Request Detail Rate-Mapping Display Design

Date: 2026-02-09

## Goal
Show the user’s Step 4 selections (rate mapping) in the request detail page at
`frontend/src/app/(user)/user/my-requests/[id]/page.tsx`, using data saved in
`req_submissions.submission_data`.

The UI should combine a short key–value summary and a compact “summary card”
style similar to Step 4, without changing the existing page layout.

## Current Findings
- `submission_data` stores `rate_mapping` (snake_case), not `rateMapping`.
- Some rows have `rate_mapping` with only `professionCode` + `groupId`, others
  include `itemId`, `subItemId`, `rate_id`, and `amount`.
- Request detail page currently does not render these fields.

## Design Summary (Option A, accepted)
Add a new block inside the “รายละเอียดคำขอ” card:

1) **Key–Value Summary (top)**
- Show: วิชาชีพ, กลุ่ม, เกณฑ์/เงื่อนไข, เงื่อนไขย่อย, งานเฉพาะ (if present)
- Hide any empty fields (no “-” placeholders)

2) **Compact Summary Card (bottom)**
- Similar to Step 4 summary (read-only)
- Show: วิชาชีพ + กลุ่ม; เงื่อนไขอ้างอิง; เงื่อนไขย่อย/งานเฉพาะ when present
- No buttons or interactive elements

## Data Source & Mapping
Primary source: `submission_data.rate_mapping` (snake_case)
Fallback: `submission_data.rateMapping` (camelCase)

Mapping to labels uses the same hierarchy as Step 4:
- `professionCode` → profession label
- `groupId` → group name
- `itemId` → criteria label
- `subItemId` → sub-criteria label
- If hierarchy missing: fall back to code/id text (e.g., `PHARMACIST`, `groupId: 1`)

## Edge Cases
- If `rate_mapping` exists but is “empty” (e.g. `groupId` empty and `amount = 0`):
  display a short warning: “ยังไม่มีข้อมูลการคำนวณจากขั้นตอนที่ 4”.
- If hierarchy loading fails: show raw ids/codes instead of blank.

## Testing (TDD)
Add tests for a small mapping helper:
1. `rate_mapping` + hierarchy → correct labels
2. `rate_mapping` without hierarchy → raw ids/codes
3. empty `rate_mapping` → warning state
4. reads both `rate_mapping` and `rateMapping`

Tests should be written and verified failing first, then implement minimal code
until green.

## Files to Change
Frontend:
- `frontend/src/app/(user)/user/my-requests/[id]/page.tsx`
- `frontend/src/components/request/wizard/steps/step-4-rate-mapping.tsx` (read-only reference)
- New helper or local mapping function in detail page
- New unit tests in `frontend/src/app/(user)/user/__tests__/`

Backend: none

## Success Criteria
- Detail page shows Step 4 selections accurately
- No layout shifts or broken sections
- Works even if hierarchy is slow/unavailable
- Tests cover mapping behavior and fallback
