type OcrAssignmentDocument = {
  fileName?: string | null;
  markdown?: string | null;
};

import { detectOcrDocumentKind } from "./requestDetail.ocrDocuments";

export type AssignmentOrderSummary = {
  fileName: string;
  orderNo: string | null;
  subject: string | null;
  department: string | null;
  effectiveDate: string | null;
  signedDate: string | null;
  personMatched: boolean;
  personLine: string | null;
  sectionTitle: string | null;
  dutyHighlights: string[];
};

const PERSON_TITLES = ["นาย", "นางสาว", "นาง", "แพทย์หญิง", "แพทย์ชาย"];

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").replace(/[ \t]+$/gm, "").trim();

const ORDER_NO_PATTERN = /^(?:ที่|ที)\s+([^\n\)]+)/m;
const SUBJECT_PATTERN = /(?:เรื่อง|เรอง)\s+([^\n]+)/;
const EFFECTIVE_DATE_PATTERN = /(?:ทั้งนี้\s*)?(?:ตั้งแต่วันที่|ต้งแต่วันที่)\s+([^\n]+)/;
const SIGNED_DATE_PATTERN = /(?:สั่ง\s*ณ\s*วันที่|สง\s*ณ\s*วันที่)\s+([^\n]+)/;

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

const normalizePersonLine = (value: string): string =>
  normalizeWhitespace(value).replace(/^[^\d๑๒๓๔๕๖๗๘๙]+\/?\s*/, "");

const findPersonLine = (lines: string[], personName: string): string | null => {
  const normalizedPerson = normalizeNameForMatch(personName);
  if (!normalizedPerson) return null;
  const line = lines.find((rawLine) =>
    normalizeNameForMatch(rawLine).includes(normalizedPerson),
  );
  return line ? normalizePersonLine(line) : null;
};

const findNearestSectionTitle = (lines: string[], personLine: string | null): string | null => {
  if (!personLine) return null;
  const personIndex = lines.findIndex((line) => normalizeWhitespace(line) === personLine);
  if (personIndex < 0) return null;
  for (let index = personIndex - 1; index >= 0; index -= 1) {
    const line = normalizeWhitespace(lines[index] || "");
    if (!line) continue;
    if (/^[0-9๑๒๓๔๕๖๗๘๙]+\.[0-9๑๒๓๔๕๖๗๘๙]+(?:\.[0-9๑๒๓๔๕๖๗๘๙]+)*\s+/.test(line)) continue;
    if (/^[0-9๑๒๓๔๕๖๗๘๙]+\.\s+/.test(line)) return line;
  }
  return null;
};

const extractDutyHighlights = (lines: string[]): string[] => {
  const anchorIndex = lines.findIndex((line) => /โดยมีหน้าที่\s*ดังนี้/.test(line));
  if (anchorIndex < 0) return [];

  const highlights: string[] = [];
  for (let index = anchorIndex + 1; index < lines.length; index += 1) {
    const line = normalizeWhitespace(lines[index] || "");
    if (!line) {
      if (highlights.length > 0) break;
      continue;
    }
    if (/^[0-9๑๒๓๔๕๖๗๘๙]+\.\s+/.test(line) || /^[0-9๑๒๓๔๕๖๗๘๙]+\.\d+\s+/.test(line)) {
      highlights.push(line);
      if (highlights.length === 3) break;
    }
  }
  return highlights;
};

export const parseAssignmentOrderSummary = (
  document: OcrAssignmentDocument,
  personName: string,
): AssignmentOrderSummary | null => {
  const rawMarkdown = document.markdown || "";
  if (
    !rawMarkdown.trim() ||
    detectOcrDocumentKind({
      fileName: document.fileName,
      markdown: rawMarkdown,
    }) !== "assignment_order"
  ) {
    return null;
  }

  const lines = rawMarkdown
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
  const headerWindow = lines.slice(0, 6);
  const hasAssignmentHeading = headerWindow.some(
    (line) =>
      /(?:คำสั่ง|คําสั่ง|คำสัง|คําสัง)/.test(line) &&
      (/(มอบหมาย|รับผิดชอบ|ปฏิบัติงาน)/.test(line) ||
        /^คำสั่ง/.test(line) ||
        /^คําสั่ง/.test(line) ||
        /^คำสัง/.test(line) ||
        /^คําสัง/.test(line)),
  );
  if (!hasAssignmentHeading) {
    return null;
  }
  const markdown = lines.join("\n");

  const personLine = findPersonLine(lines, personName);

  return {
    fileName: document.fileName?.trim() || "เอกสาร OCR",
    orderNo: extractFirst(markdown, [ORDER_NO_PATTERN]),
    subject: extractFirst(markdown, [SUBJECT_PATTERN]),
    department: extractFirst(markdown, [/^คำสั่ง([^\n\(]+)/m, /(กลุ่มงาน[^\n\(]+)/]),
    effectiveDate: extractFirst(markdown, [EFFECTIVE_DATE_PATTERN]),
    signedDate: extractFirst(markdown, [SIGNED_DATE_PATTERN]),
    personMatched: Boolean(personLine),
    personLine,
    sectionTitle: findNearestSectionTitle(lines, personLine),
    dutyHighlights: extractDutyHighlights(lines),
  };
};

export const findAssignmentOrderSummary = (
  documents: OcrAssignmentDocument[],
  personName: string,
): AssignmentOrderSummary | null => {
  let best: { score: number; summary: AssignmentOrderSummary } | null = null;

  for (const document of documents) {
    const summary = parseAssignmentOrderSummary(document, personName);
    if (!summary) continue;
    if (!summary.personMatched) continue;
    const score =
      100 +
      (summary.sectionTitle ? 20 : 0) +
      summary.dutyHighlights.length * 5 +
      (summary.subject ? 3 : 0) +
      (summary.orderNo ? 2 : 0);
    if (!best || score > best.score) {
      best = { score, summary };
    }
  }

  return best?.summary ?? null;
};

export const shouldSuppressAssignmentOrderOcrUi = (
  document: OcrAssignmentDocument,
  personName: string,
): boolean => {
  const summary = parseAssignmentOrderSummary(document, personName);
  return Boolean(summary && !summary.personMatched);
};
