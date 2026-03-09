import { describe, expect, test } from 'vitest';
import {
  buildPersonnelChangeFiscalYearOptions,
  getFiscalYearFromDate,
} from './utils';

describe('personnel change fiscal year utils', () => {
  test('maps dates before October to the same buddhist year', () => {
    expect(getFiscalYearFromDate('2026-09-30')).toBe(2569);
  });

  test('maps dates from October onward to the next buddhist year', () => {
    expect(getFiscalYearFromDate('2026-10-01')).toBe(2570);
  });

  test('returns null for invalid dates', () => {
    expect(getFiscalYearFromDate('')).toBeNull();
    expect(getFiscalYearFromDate('invalid-date')).toBeNull();
  });

  test('builds sorted fiscal year options and includes fallback year', () => {
    expect(
      buildPersonnelChangeFiscalYearOptions(
        ['2025-10-01', '2026-01-15', '2025-09-30', '2024-09-30', 'invalid'],
        2571,
      ),
    ).toEqual([2571, 2569, 2568, 2567]);
  });
});
