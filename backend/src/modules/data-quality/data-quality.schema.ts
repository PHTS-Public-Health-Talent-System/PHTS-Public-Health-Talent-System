import { z } from "zod";
import {
  IssueType,
  IssueSeverity,
  IssueStatus,
} from "./services/data-quality.service.js";

// GET /data-quality/issues
export const getIssuesSchema = z.object({
  query: z.object({
    type: z.nativeEnum(IssueType).optional(),
    severity: z.nativeEnum(IssueSeverity).optional(),
    status: z.nativeEnum(IssueStatus).optional(),
    affectsCalc: z.enum(["true", "false"]).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

// POST /data-quality/issues
export const createIssueSchema = z.object({
  body: z.object({
    type: z.nativeEnum(IssueType, { error: "type ไม่ถูกต้อง" }),
    severity: z.nativeEnum(IssueSeverity, { error: "severity ไม่ถูกต้อง" }),
    entityType: z.string().min(1, "entityType จำเป็นต้องระบุ"),
    description: z.string().min(1, "description จำเป็นต้องระบุ"),
    entityId: z.number().int().optional(),
    citizenId: z.string().optional(),
    affectsCalc: z.boolean().optional(),
  }),
});

export type CreateIssueBody = z.infer<typeof createIssueSchema>["body"];

// PUT /data-quality/issues/:id
export const updateIssueSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id ต้องเป็นตัวเลข"),
  }),
  body: z.object({
    status: z.nativeEnum(IssueStatus, { error: "status ไม่ถูกต้อง" }),
    note: z.string().optional(),
  }),
});

export type UpdateIssueParams = z.infer<typeof updateIssueSchema>["params"];
export type UpdateIssueBody = z.infer<typeof updateIssueSchema>["body"];
