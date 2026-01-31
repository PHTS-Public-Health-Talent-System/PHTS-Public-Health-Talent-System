import {
  RuleCondition,
  ClassificationRule,
} from "./rules.repository.js";
import { requestRepository } from "../repositories/request.repository.js";

export interface EmployeeProfile {
  citizen_id: string;
  position_name: string;
  specialist: string | null;
  expert: string | null;
  sub_department: string | null;
}

export interface MasterRate {
  rate_id: number;
  profession_code: string;
  group_no: number;
  item_no: string;
  sub_item_no?: string | null;
  amount: number;
}

export interface ClassificationResult {
  group_id: number;
  group_name: string;
  rate_amount: number;
  item_no?: string | null;
  sub_item_no?: string | null;
  criteria_text?: string | null;
}

function normalize(value?: string | null): string {
  return (value || "").trim();
}

/**
 * Evaluates a single rule condition against an employee profile.
 * Recursive for AND/OR logic.
 */
function evaluateCondition(
  condition: RuleCondition,
  profile: EmployeeProfile,
): boolean {
  // 1. Logic Gates (OR/AND)
  if (condition.OR) {
    return condition.OR.some((subCond) => evaluateCondition(subCond, profile));
  }
  if (condition.AND) {
    return condition.AND.every((subCond) =>
      evaluateCondition(subCond, profile),
    );
  }

  // 2. Simple Field Checks
  const { field, operator, values } = condition;

  if (operator === "true") return true;
  if (!field) return false;

  const rawValue = (profile as any)[field];
  const profileValue = normalize(rawValue);

  switch (operator) {
    case "not_empty":
      return profileValue.length > 0;

    case "equals":
      return values ? values.includes(profileValue) : false;

    case "contains":
      if (!values || values.length === 0) return false;
      return profileValue.includes(values[0]);

    case "contains_any":
      if (!values) return false;
      return values.some((v) => profileValue.includes(v));

    case "starts_with_any":
      if (!values) return false;
      return values.some((v) => profileValue.startsWith(v));

    default:
      return false;
  }
}

/**
 * Resolve profession code from position name (Legacy mapping)
 * This helps filter the rules to process.
 */
function resolveProfession(pos: string): string | null {
  if (pos.includes("ทันตแพทย์")) return "DENTIST";
  if (pos.includes("นายแพทย์") || pos.includes("แพทย์")) return "DOCTOR";
  if (pos.includes("เภสัชกร")) return "PHARMACIST";
  if (pos.includes("พยาบาล")) {
    if (
      ["ผู้ช่วยพยาบาล", "พนักงานช่วยการพยาบาล", "พนักงานช่วยเหลือคนไข้"].some(
        (p) => pos.startsWith(p),
      )
    ) {
      return null; // Assistant nurses are not eligible for PTS under current logic
    }
    return "NURSE";
  }
  if (pos.startsWith("นักเทคนิคการแพทย์")) return "MED_TECH";
  if (pos.startsWith("นักรังสีการแพทย์")) return "RAD_TECH";
  if (pos.startsWith("นักกายภาพบำบัด") || pos.startsWith("นักกายภาพบําบัด"))
    return "PHYSIO";
  if (pos.startsWith("นักกิจกรรมบำบัด") || pos.startsWith("นักกิจกรรมบําบัด"))
    return "OCC_THERAPY";
  if (pos.startsWith("นักอาชีวบำบัด") || pos.startsWith("นักอาชีวบําบัด"))
    return "OCC_THERAPY";
  if (
    pos.startsWith("นักจิตวิทยาคลินิก") ||
    pos.startsWith("นักจิตวิทยาคลินิค") ||
    pos.startsWith("นักจิตวิทยา")
  ) {
    return "CLIN_PSY";
  }
  if (
    pos.startsWith("นักแก้ไขความผิดปกติการสื่อความหมาย") ||
    pos.startsWith("นักแก้ไขความผิดปกติของการสื่อความหมาย")
  ) {
    return "SPEECH_THERAPIST";
  }
  if (pos.startsWith("นักวิชาการศึกษาพิเศษ")) return "SPECIAL_EDU";
  if (pos.startsWith("นักเทคโนโลยีหัวใจและทรวงอก")) return "CARDIO_TECH";

  return null;
}

export function resolveProfessionFromPositionName(
  positionName: string,
): string | null {
  return resolveProfession(normalize(positionName));
}

export async function getProfessionForCitizenId(
  citizenId: string,
): Promise<string | null> {
  const positionName = await requestRepository.findPositionNameByCitizenId(citizenId);
  if (!positionName) return null;
  return resolveProfessionFromPositionName(positionName);
}

/**
 * Simple keyword extractor for qualifications from OCR text
 */
export function extractQualifications(text: string): {
  expert: string[];
  specialist: string[];
} {
  const expertFound: string[] = [];
  const specialistFound: string[] = [];
  const lowerText = text.toLowerCase();

  // 1. Master Degree
  if (
    lowerText.includes("ปริญญาโท") ||
    lowerText.includes("วิทยาศาสตรมหาบัณฑิต") ||
    lowerText.includes("master") ||
    lowerText.includes("m.sc") ||
    lowerText.includes("m.a.")
  ) {
    expertFound.push("ปริญญาโท");
  }

  // 2. PhD
  if (
    lowerText.includes("ปริญญาเอก") ||
    lowerText.includes("ดุษฎีบัณฑิต") ||
    lowerText.includes("doctor") ||
    lowerText.includes("ph.d")
  ) {
    expertFound.push("ปริญญาเอก");
  }

  // 3. Diploma / Board
  if (
    lowerText.includes("วุฒิบัตร") ||
    lowerText.includes("อนุมัติบัตร") ||
    lowerText.includes("diploma") ||
    lowerText.includes("board")
  ) {
    expertFound.push("วุฒิบัตร");
  }

  return { expert: expertFound, specialist: specialistFound };
}

/**
 * Resolve recommended rate for a citizen using Database-Driven Rules
 * Optionally augmented with OCR text
 */
export async function findRecommendedRate(
  citizenId: string,
  ocrText?: string,
): Promise<MasterRate | null> {
  // 1. Fetch Employee Profile
  const row = await requestRepository.findEmployeeForClassification(citizenId);
  if (!row) return null;
  let profile = row as EmployeeProfile;

  // 1.5 Augment with OCR Data if provided
  if (ocrText) {
    const extracted = extractQualifications(ocrText);
    if (extracted.expert.length > 0) {
      const existingExpert = normalize(profile.expert);
      const newExpert = extracted.expert.join(", ");
      profile = {
        ...profile,
        expert: existingExpert ? `${existingExpert}, ${newExpert}` : newExpert,
      };
    }
  }

  const positionName = normalize(profile.position_name);

  // 2. Resolve Profession to narrow down rules
  const profession = resolveProfession(positionName);

  // 3. Fetch Active Rules (fallback to all rules if profession is unknown)
  const rules = profession
    ? await requestRepository.findRulesByProfession(profession)
    : await requestRepository.findAllActiveRules();

  // 4. Evaluate Rules (Priority Order)
  let matchedRule: ClassificationRule | null = null;

  for (const rule of rules as ClassificationRule[]) {
    let condition: RuleCondition;
    try {
      condition =
        typeof rule.rule_condition === "string"
          ? JSON.parse(rule.rule_condition)
          : rule.rule_condition;
    } catch (e) {
      console.warn(`Invalid JSON in rule #${rule.id}`, e);
      continue;
    }

    const isMatch = evaluateCondition(condition, profile);
    if (isMatch) {
      matchedRule = rule;
      break; // Stop at first match (highest priority)
    }
  }

  if (!matchedRule) return null;

  // 5. Query Master Rate Table
  const professionCode = profession || matchedRule.profession;
  const rate = await requestRepository.findMatchingRate({
    groupNo: matchedRule.target_group_no,
    professionCode,
    itemNo: matchedRule.target_item_no,
    subItemNo: matchedRule.target_sub_item_no,
  });

  if (!rate) return null;

  // Return enhanced result with sub-item info from the RULE, not just the rate
  return {
    ...rate,
    item_no: matchedRule.target_item_no || rate.item_no,
    sub_item_no: matchedRule.target_sub_item_no,
  } as any;
}

export async function getAllActiveMasterRates(): Promise<any[]> {
  return requestRepository.findAllActiveMasterRates();
}

export async function classifyEmployee(
  employee: EmployeeProfile,
  ocrText?: string,
): Promise<ClassificationResult | null> {
  const result: any = await findRecommendedRate(employee.citizen_id, ocrText);
  if (!result) return null;

  const itemText =
    result.item_no && result.item_no !== "-" ? `ข้อ ${result.item_no}` : "";
  const subItemText = result.sub_item_no ? `.${result.sub_item_no}` : "";

  return {
    group_id: result.group_no,
    group_name: `กลุ่ม ${result.group_no}`,
    rate_amount: result.amount,
    item_no: result.item_no,
    sub_item_no: result.sub_item_no,
    criteria_text: `${itemText}${subItemText}`.trim() || null,
  };
}

export async function validateRateAmount(amount: number): Promise<boolean> {
  return requestRepository.findRateByAmount(amount);
}

export async function findRateByDetails(
  professionCode: string,
  groupNo: number,
  itemNo: string,
  subItemNo?: string | null,
): Promise<MasterRate | null> {
  const row = await requestRepository.findRateByDetails(
    professionCode,
    groupNo,
    itemNo,
    subItemNo,
  );
  return row ? (row as MasterRate) : null;
}
