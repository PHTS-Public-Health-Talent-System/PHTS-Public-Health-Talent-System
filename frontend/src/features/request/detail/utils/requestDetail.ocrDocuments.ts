type OcrDocument = {
  fileName?: string | null;
  markdown?: string | null;
};

export type OcrDocumentKind =
  | "assignment_order"
  | "memo"
  | "license"
  | "general";

export type MemoSummary = {
  fileName: string;
  documentNo: string | null;
  subject: string | null;
  department: string | null;
  documentDate: string | null;
  addressedTo: string | null;
  personMatched: boolean;
  personLine: string | null;
};

export type OcrDocumentOverview = {
  total: number;
  memo: number;
  license: number;
  assignment_order: number;
  general: number;
};

const PERSON_TITLES = ["นาย", "นางสาว", "นาง", "แพทย์หญิง", "แพทย์ชาย"];

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").replace(/[ \t]+$/gm, "").trim();

const ASSIGNMENT_ORDER_TITLE_PATTERN = /(?:คำสั่ง|คําสั่ง|คำสัง|คําสัง)/;
const ASSIGNMENT_ORDER_ACTION_PATTERN = /(มอบหมาย|รับผิดชอบ|ปฏิบัติงาน)/;

const normalizeNameForMatch = (value: string) => {
  let normalized = normalizeWhitespace(value);
  for (const title of PERSON_TITLES) {
    if (normalized.startsWith(title)) {
      normalized = normalized.slice(title.length).trim();
      break;
    }
  }
  return normalized.replace(/\s+/g, "").toLowerCase();
};

const extractFirst = (markdown: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    const value = match?.[1] ? normalizeWhitespace(match[1]) : "";
    if (value) return value;
  }
  return null;
};

const extractMentionedPeople = (lines: string[]): string[] => {
  const seen = new Set<string>();
  const people: string[] = [];

  for (const line of lines) {
    const matches = line.matchAll(
      /(นาย|นางสาว|นาง|แพทย์หญิง|แพทย์ชาย)\s*[^\s\d\/]{1,60}\s+[^\s\d\/]{1,60}/g,
    );
    for (const match of matches) {
      const name = normalizeWhitespace(match[0] || "");
      if (!name || seen.has(name)) continue;
      seen.add(name);
      people.push(name);
    }
  }

  return people;
};

const buildLines = (markdown: string) =>
  markdown
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

const looksLikeAssignmentOrderHeading = (lines: string[]) => {
  const headerWindow = lines.slice(0, 6);
  return headerWindow.some(
    (line) =>
      ASSIGNMENT_ORDER_TITLE_PATTERN.test(line) &&
      (ASSIGNMENT_ORDER_ACTION_PATTERN.test(line) ||
        /^คำสั่ง/.test(line) ||
        /^คําสั่ง/.test(line) ||
        /^คำสัง/.test(line) ||
        /^คําสัง/.test(line)),
  );
};

const findPersonLine = (lines: string[], personName: string): string | null => {
  const normalizedPerson = normalizeNameForMatch(personName);
  if (!normalizedPerson) return null;
  const line = lines.find((rawLine) =>
    normalizeNameForMatch(rawLine).includes(normalizedPerson),
  );
  return line ? normalizeWhitespace(line) : null;
};

export const detectOcrDocumentKind = (document: OcrDocument): OcrDocumentKind => {
  const markdown = normalizeWhitespace(document.markdown || "");
  const fileName = normalizeWhitespace(document.fileName || "").toLowerCase();
  const lines = buildLines(document.markdown || "");
  const noisyLicenseSignalCount = [
    /(?:ใบอนุญาต|ไบอนุญาต|บอนญาต)/.test(markdown),
    /(?:ประกอบวิชา|วิชาจี|วิชาชี|วิชาชีพ).*(?:พยาบาล|ผยาบาล|แยายาล|เภสัช)/.test(
      markdown,
    ),
    /(?:ต่ออายุครั้งที่|ตออายุตรงที|ตอยอายุตรงที)/.test(markdown),
    /(?:หมดอายุ|หผดอายุ)/.test(markdown),
    /(?:ออกใบอนุญาตนี้ให้แก่|จอกใบอนุญาต|ลอกใบอนญาต)/.test(markdown),
  ].filter(Boolean).length;
  const memoSignalCount = [
    lines.some((line) => /(?:บันทึกข้อความ|บนทกขอความ|บันทึกขอความ)/.test(line)),
    lines.some((line) => /^ส่วนราชการ\s+/.test(line)),
    lines.some((line) => /^เรียน\s+/.test(line)),
    lines.some((line) => /(?:เรื่อง|เรอง)\s+/.test(line)),
    lines.some((line) => /วันที่\s+/.test(line)),
  ].filter(Boolean).length;

  if (memoSignalCount >= 3) {
    return "memo";
  }

  if (
    looksLikeAssignmentOrderHeading(lines) &&
    ASSIGNMENT_ORDER_ACTION_PATTERN.test(markdown)
  ) {
    return "assignment_order";
  }

  if (
    /ใบอนุญาตประกอบวิชาชีพ/.test(markdown) ||
    noisyLicenseSignalCount >= 2 ||
    fileName.includes("license") ||
    fileName.includes("ใบอนุญาต")
  ) {
    return "license";
  }

  return "general";
};

export const getOcrDocumentTypeLabel = (kind: OcrDocumentKind): string => {
  switch (kind) {
    case "assignment_order":
      return "คำสั่งมอบหมายงาน";
    case "memo":
      return "หนังสือนำส่ง";
    case "license":
      return "ใบอนุญาต";
    default:
      return "เอกสารทั่วไป";
  }
};

export const buildOcrDocumentOverview = (
  documents: OcrDocument[],
): OcrDocumentOverview => {
  const summary: OcrDocumentOverview = {
    total: 0,
    memo: 0,
    license: 0,
    assignment_order: 0,
    general: 0,
  };

  for (const document of documents) {
    const markdown = String(document.markdown ?? "").trim();
    if (!markdown) continue;
    summary.total += 1;
    summary[detectOcrDocumentKind(document)] += 1;
  }

  return summary;
};

export const findMentionedPeopleInMemoDocuments = (
  documents: OcrDocument[],
): string[] => {
  const seen = new Set<string>();
  const people: string[] = [];

  for (const document of documents) {
    if (detectOcrDocumentKind(document) !== "memo") continue;
    const lines = buildLines(document.markdown || "");
    for (const name of extractMentionedPeople(lines)) {
      if (seen.has(name)) continue;
      seen.add(name);
      people.push(name);
    }
  }

  return people;
};

export const parseMemoSummary = (
  document: OcrDocument,
  personName: string,
): MemoSummary | null => {
  const rawMarkdown = document.markdown || "";
  if (!rawMarkdown.trim() || detectOcrDocumentKind(document) !== "memo") {
    return null;
  }

  const lines = buildLines(rawMarkdown);
  const markdown = lines.join("\n");
  const personLine = findPersonLine(lines, personName);

  return {
    fileName: document.fileName?.trim() || "เอกสาร OCR",
    documentNo: extractFirst(markdown, [/^ที่\s+([^\n]+)/m]),
    subject: extractFirst(markdown, [/เรื่อง\s+([^\n]+)/]),
    department: extractFirst(markdown, [/^ส่วนราชการ\s+([^\n]+?)(?:โทร|$)/m]),
    documentDate: extractFirst(markdown, [/^วันที่\s+([^\n]+)/m]),
    addressedTo: extractFirst(markdown, [/^เรียน\s+([^\n]+)/m]),
    personMatched: Boolean(personLine),
    personLine,
  };
};

export const findMemoSummary = (
  documents: OcrDocument[],
  personName: string,
): MemoSummary | null => {
  let best: { score: number; summary: MemoSummary } | null = null;

  for (const document of documents) {
    const summary = parseMemoSummary(document, personName);
    if (!summary) continue;
    if (!summary.personMatched) continue;

    const score =
      100 +
      (summary.subject ? 10 : 0) +
      (summary.documentNo ? 5 : 0) +
      (summary.addressedTo ? 3 : 0);

    if (!best || score > best.score) {
      best = { score, summary };
    }
  }

  return best?.summary ?? null;
};

export const shouldSuppressMemoOcrActions = (
  document: OcrDocument,
  personName: string,
): boolean => {
  const summary = parseMemoSummary(document, personName);
  return Boolean(summary && !summary.personMatched);
};
