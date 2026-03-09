import type { OcrDocumentKind } from '@/modules/ocr/services/ocr-document-classifier.service.js';

type QualitySummary = {
  required_fields: number;
  captured_fields: number;
  passed: boolean;
};

const THAI_DIGIT_MAP: Record<string, string> = {
  '๐': '0',
  '๑': '1',
  '๒': '2',
  '๓': '3',
  '๔': '4',
  '๕': '5',
  '๖': '6',
  '๗': '7',
  '๘': '8',
  '๙': '9',
};

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').replace(/[ \t]+$/gm, '').trim();

const normalizeThaiDigits = (value: string): string =>
  value.replace(/[๐-๙]/g, (digit) => THAI_DIGIT_MAP[digit] ?? digit);

export const buildOcrLines = (markdown: string): string[] =>
  markdown
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

const findLine = (lines: string[], patterns: RegExp[]): string | null => {
  for (const line of lines) {
    if (patterns.some((pattern) => pattern.test(line))) {
      return line;
    }
  }
  return null;
};

const extractFirst = (markdown: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    const value = match?.[1] ? normalizeThaiDigits(normalizeWhitespace(match[1])) : '';
    if (value) return value;
  }
  return null;
};

const extractFromLine = (line: string | null, patterns: RegExp[]): string | null => {
  if (!line) return null;
  return extractFirst(line, patterns);
};

const findLineAfterAnchor = (lines: string[], patterns: RegExp[]): string | null => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    if (!patterns.some((pattern) => pattern.test(line))) continue;
    for (let next = index + 1; next < lines.length; next += 1) {
      const candidate = normalizeWhitespace(lines[next] || '');
      if (!candidate) continue;
      return candidate;
    }
  }
  return null;
};

const parseMemoFields = (markdown: string, lines: string[]): Record<string, unknown> => {
  const documentNoLine = findLine(lines, [
    /(?:^|\s)(?:ที่|อต)\s*[0-9๐-๙./]+\/[0-9๐-๙a-zA-Z]+/i,
  ]);
  const documentDateLine = findLine(lines, [/วันที่\s+[0-9๐-๙]+/]);
  const subjectLine = findLine(lines, [/(?:เรื่อง|เรอง)\s+/]);

  return {
    document_no: extractFromLine(documentNoLine, [
      /((?:[ก-ฮA-Za-z]{1,4}\s*)?[0-9๐-๙.]+\/[0-9๐-๙a-zA-Z]+)/,
    ]),
    document_date: extractFromLine(documentDateLine, [/วันที่\s+(.+)$/]),
    subject: extractFromLine(subjectLine, [/(?:เรื่อง|เรอง)\s+(.+)$/]),
    department: extractFirst(markdown, [/^ส่วนราชการ\s+([^\n]+?)(?:โทร|$)/m]),
    addressed_to: extractFirst(markdown, [/^เรียน\s+([^\n]+)/m]),
  };
};

const parseLicenseFields = (_markdown: string, lines: string[]): Record<string, unknown> => {
  const licenseNoLine = findLine(lines, [
    /(ใบอนุญาตที่|ใบอนุญาตปี|ไบอนุญาต|บอนญาต)/,
  ]);
  const personNameLine =
    findLineAfterAnchor(lines, [/(ออกใบอนุญาตนี้ให้แก่|จอกใบอนุญาต|ลอกใบอนญาต)/]) ??
    findLine(lines, [/(นาย|นางสาว|นาง|แพทย์หญิง|แพทย์ชาย)\s*\S+\s+\S+/]);
  const validUntilLine = findLine(lines, [/(หมดอายุ|หผดอายุ)/]);

  return {
    license_no: extractFromLine(licenseNoLine, [
      /([0-9๐-๙]{6,})/,
    ]),
    person_name: extractFromLine(personNameLine, [
      /((?:นาย|นางสาว|นาง|แพทย์หญิง|แพทย์ชาย)\s*[^\s\d/]{1,80}\s+[^\s\d/]{1,80})/,
    ]),
    license_valid_until: extractFromLine(validUntilLine, [
      /(?:หมดอายุ(?: วันที่)?|หผดอายุ(?: วันที่)?|วันหมดอายุ)\s*([^\n]+)/,
    ]),
  };
};

const parseAssignmentOrderFields = (markdown: string, lines: string[]): Record<string, unknown> => {
  const personLine =
    lines.find((line) =>
      /^[0-9๑๒๓๔๕๖๗๘๙]+\.[0-9๑๒๓๔๕๖๗๘๙]+(?:\.[0-9๑๒๓๔๕๖๗๘๙]+)*\s+/.test(line),
    ) ?? null;
  const sectionTitle = lines.find((line) => /^[0-9๑๒๓๔๕๖๗๘๙]+\.\s+/.test(line)) ?? null;

  return {
    order_no: extractFirst(markdown, [/^ที่\s+([^\n)]+)/m]),
    subject: extractFirst(markdown, [/เรื่อง\s+([^\n]+)/]),
    person_name: personLine,
    section_title: sectionTitle,
  };
};

export const parseOcrFields = (
  documentKind: OcrDocumentKind,
  markdown: string,
  lines: string[],
): { fields: Record<string, unknown>; requiredKeys: string[] } => {
  if (documentKind === 'memo') {
    return {
      fields: parseMemoFields(markdown, lines),
      requiredKeys: ['document_no', 'document_date', 'subject'],
    };
  }
  if (documentKind === 'license') {
    return {
      fields: parseLicenseFields(markdown, lines),
      requiredKeys: ['person_name', 'license_no', 'license_valid_until'],
    };
  }
  if (documentKind === 'assignment_order') {
    return {
      fields: parseAssignmentOrderFields(markdown, lines),
      requiredKeys: ['order_no', 'subject', 'person_name', 'section_title'],
    };
  }
  return {
    fields: {},
    requiredKeys: [],
  };
};

export const evaluateOcrFields = (
  fields: Record<string, unknown>,
  requiredKeys: string[],
): { missing_fields: string[]; quality: QualitySummary } => {
  const missing_fields = requiredKeys.filter((key) => {
    const value = fields[key];
    return value === null || value === undefined || String(value).trim() === '';
  });

  return {
    missing_fields,
    quality: {
      required_fields: requiredKeys.length,
      captured_fields: requiredKeys.length - missing_fields.length,
      passed: missing_fields.length === 0,
    },
  };
};
