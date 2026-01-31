/**
 * Master Data Module - Entity Definitions
 *
 * TypeScript interfaces for holidays and payment rates
 */

// ─── cfg_holidays table ───────────────────────────────────────────────────────

export interface Holiday {
  holiday_id: number;
  holiday_date: string;
  holiday_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── cfg_payment_rates table ──────────────────────────────────────────────────

export interface PaymentRate {
  rate_id: number;
  profession_code: string;
  group_no: number;
  item_no: number;
  condition_desc: string;
  amount: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateHolidayInput {
  date: string;
  name: string;
}

export interface UpdateRateInput {
  rateId: number;
  amount: number;
  conditionDesc: string;
  isActive: boolean;
}
