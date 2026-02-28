import {
  inferScopeType,
  parseSpecialPositionScopes,
  removeOverlaps,
  type ApproverScopes,
} from '@/modules/request/scope/domain/scope.utils.js';

export function buildScopesFromSpecialPosition(
  specialPosition: string | null,
): ApproverScopes {
  if (!specialPosition) {
    return { wardScopes: [], deptScopes: [] };
  }

  const allScopes = parseSpecialPositionScopes(specialPosition);
  const wardScopes: string[] = [];
  const deptScopes: string[] = [];

  const normalizeScopeName = (scope: string): string => {
    const parts = scope.split('-');
    return parts.length > 1 ? parts.slice(1).join('-').trim() : scope.trim();
  };

  const addScope = (target: string[], scopeName: string): void => {
    if (!scopeName || inferScopeType(scopeName) === 'IGNORE') return;
    target.push(scopeName);
  };

  for (const scope of allScopes) {
    if (scope.includes('ตำแหน่งด้านบริหาร')) continue;

    const isHeadWard = scope.includes('หัวหน้าตึก') || scope.includes('หัวหน้างาน-');
    const isHeadDept = scope.includes('หัวหน้ากลุ่มงาน') || scope.includes('หัวหน้ากลุ่มภารกิจ');
    const scopeName = normalizeScopeName(scope);

    if (isHeadWard) {
      addScope(wardScopes, scopeName);
      if (inferScopeType(scopeName) === 'DEPT') {
        addScope(deptScopes, scopeName);
      }
      continue;
    }

    if (isHeadDept) {
      addScope(deptScopes, scopeName);
      continue;
    }
  }

  const cleanedWardScopes = removeOverlaps(wardScopes, deptScopes);
  return {
    wardScopes: Array.from(new Set(cleanedWardScopes.map((s) => s.trim()))),
    deptScopes: Array.from(new Set(deptScopes.map((s) => s.trim()))),
  };
}
