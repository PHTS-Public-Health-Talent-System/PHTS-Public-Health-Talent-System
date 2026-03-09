import {
  inferScopeType,
  parseSpecialPositionScopes,
  removeOverlaps,
  type ApproverScopes,
} from '@/modules/request/scope/domain/scope.utils.js';

const EXCLUDED_SCOPE_TOKENS = ['ผู้ช่วยหัวหน้า', 'รองหัวหน้า'];
const WARD_SCOPE_PREFIXES = ['หัวหน้าตึก/หัวหน้างาน-', 'หัวหน้าตึก-', 'หัวหน้างาน-'];
const DEPT_SCOPE_PREFIXES = ['หัวหน้ากลุ่มงาน-', 'หัวหน้ากลุ่มภารกิจ-'];

export function buildScopesFromSpecialPosition(
  specialPosition: string | null,
): ApproverScopes {
  if (!specialPosition) {
    return { wardScopes: [], deptScopes: [] };
  }

  const allScopes = parseSpecialPositionScopes(specialPosition);
  const wardScopes: string[] = [];
  const deptScopes: string[] = [];

  const extractScopeName = (scope: string, prefixes: string[]): string | null => {
    const matchedPrefix = prefixes.find((prefix) => scope.startsWith(prefix));
    if (!matchedPrefix) return null;
    return scope.slice(matchedPrefix.length).trim();
  };

  const addScope = (target: string[], scopeName: string): void => {
    if (!scopeName || inferScopeType(scopeName) === 'IGNORE') return;
    target.push(scopeName);
  };

  for (const scope of allScopes) {
    const normalizedScope = scope.trim();
    if (normalizedScope.includes('ตำแหน่งด้านบริหาร')) continue;
    if (EXCLUDED_SCOPE_TOKENS.some((token) => normalizedScope.includes(token))) continue;

    const wardScopeName = extractScopeName(normalizedScope, WARD_SCOPE_PREFIXES);

    if (wardScopeName) {
      addScope(wardScopes, wardScopeName);
      continue;
    }

    const deptScopeName = extractScopeName(normalizedScope, DEPT_SCOPE_PREFIXES);
    if (deptScopeName) {
      addScope(deptScopes, deptScopeName);
      continue;
    }
  }

  const cleanedWardScopes = removeOverlaps(wardScopes, deptScopes);
  return {
    wardScopes: Array.from(new Set(cleanedWardScopes.map((s) => s.trim()))),
    deptScopes: Array.from(new Set(deptScopes.map((s) => s.trim()))),
  };
}
