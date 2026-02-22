import { normalizeText } from '../identity/services/role-assignment.service.js';

describe('roleAssignmentService helpers', () => {
  test('normalizeText trims and handles nullish', () => {
    expect(normalizeText('  abc  ')).toBe('abc');
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });
});
