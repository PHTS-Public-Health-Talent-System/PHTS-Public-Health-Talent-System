import { z } from "zod";

export const createPeriodSchema = z.object({
  body: z.object({
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12),
  }),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>["body"];

export const calculateOnDemandSchema = z.object({
  body: z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    citizen_id: z.string().optional(),
  }),
});

export const addPeriodItemsSchema = z.object({
  body: z.object({
    request_ids: z.array(z.number().int()).min(1),
  }),
});

export const rejectPeriodSchema = z.object({
  body: z.object({
    reason: z.string().min(1),
  }),
});

export type CalculateOnDemandInput = z.infer<
  typeof calculateOnDemandSchema
>["body"];

export const CalculatePayrollSchema = z.object({
  body: z.object({
    year: z
      .number()
      .int("year must be an integer")
      .min(1900, "year must be valid")
      .max(3000, "year must be valid"),
    month: z
      .number()
      .int("month must be an integer")
      .min(1, "month must be between 1-12")
      .max(12, "month must be between 1-12"),
    citizen_id: z.string().optional().nullable(),
  }),
});

export type CalculatePayrollInput = z.infer<
  typeof CalculatePayrollSchema
>["body"];

export const leavePayExceptionSchema = z.object({
  body: z
    .object({
      citizen_id: z.string().min(1),
      start_date: z.string().min(1),
      end_date: z.string().min(1),
      reason: z.string().optional(),
    })
    .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
      message: "start_date must be before or equal to end_date",
      path: ["end_date"],
    }),
});

export type LeavePayExceptionInput = z.infer<
  typeof leavePayExceptionSchema
>["body"];

export const leaveReturnReportSchema = z.object({
  body: z.object({
    leave_record_id: z.number().int(),
    return_date: z.string().min(1),
    remark: z.string().optional(),
  }),
});

export type LeaveReturnReportInput = z.infer<
  typeof leaveReturnReportSchema
>["body"];
