import { z } from "zod";
import { UserRole } from "../../types/auth.js";

// POST /delegations - Create delegation
export const createDelegationSchema = z.object({
  body: z.object({
    delegateId: z
      .number()
      .int()
      .positive({ message: "delegateId ต้องเป็นตัวเลข" }),
    delegatedRole: z.nativeEnum(UserRole, {
      error: "delegatedRole ต้องเป็นค่า role ที่ถูกต้อง",
    }),
    scopeType: z.enum(["ALL", "DEPARTMENT", "WARD"]).optional(),
    scopeValue: z.string().optional(),
    startDate: z
      .string()
      .refine((d) => !isNaN(Date.parse(d)), {
        message: "startDate ต้องเป็นรูปแบบวันที่ที่ถูกต้อง",
      }),
    endDate: z
      .string()
      .refine((d) => !isNaN(Date.parse(d)), {
        message: "endDate ต้องเป็นรูปแบบวันที่ที่ถูกต้อง",
      }),
    reason: z.string().optional(),
  }),
});

export type CreateDelegationBody = z.infer<
  typeof createDelegationSchema
>["body"];

// DELETE /delegations/:id - Cancel delegation
export const cancelDelegationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id ต้องเป็นตัวเลข"),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});

export type CancelDelegationParams = z.infer<
  typeof cancelDelegationSchema
>["params"];
export type CancelDelegationBody = z.infer<
  typeof cancelDelegationSchema
>["body"];

// GET /delegations/my?includeExpired=
export const getMyDelegationsSchema = z.object({
  query: z.object({
    includeExpired: z.string().optional(),
  }),
});

// GET /delegations/check/:role
export const checkCanActSchema = z.object({
  params: z.object({
    role: z.string().min(1),
  }),
  query: z.object({
    scopeType: z.string().optional(),
    scopeValue: z.string().optional(),
  }),
});

// GET /delegations/candidates?q=
export const searchCandidatesSchema = z.object({
  query: z.object({
    q: z.string().optional(),
  }),
});
