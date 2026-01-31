import { RowDataPacket } from "mysql2/promise";
import { requestRepository } from "../repositories/request.repository.js";

export interface ClassificationRule extends RowDataPacket {
  id: number;
  profession: string;
  priority: number;
  rule_condition: any; // Using any for JSON structure ease, can be typed strictly if needed
  target_group_no: number;
  target_item_no: string | null;
  target_sub_item_no: string | null;
  description: string;
}

export interface RuleCondition {
  field?: string;
  operator?:
    | "true"
    | "equals"
    | "contains"
    | "contains_any"
    | "starts_with_any"
    | "not_empty";
  values?: string[];
  OR?: RuleCondition[];
  AND?: RuleCondition[];
}

export const rulesRepository = {
  /**
   * Get all active rules sorted by priority (ASC)
   */
  async getAllActiveRules(): Promise<ClassificationRule[]> {
    const rows = await requestRepository.findAllActiveRules();
    return rows as ClassificationRule[];
  },

  /**
   * Get rules by profession, sorted by priority
   */
  async getRulesByProfession(
    profession: string,
  ): Promise<ClassificationRule[]> {
    const rows = await requestRepository.findRulesByProfession(profession);
    return rows as ClassificationRule[];
  },
};
