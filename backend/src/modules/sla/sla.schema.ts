import { z } from "zod";

// PUT /sla/config/:stepNo
export const updateSLAConfigSchema = z.object({
  params: z.object({
    stepNo: z.string().regex(/^\d+$/, "stepNo ต้องเป็นตัวเลข"),
  }),
  body: z.object({
    slaDays: z.number().int().min(1, "slaDays ต้องมากกว่า 0"),
    reminderBeforeDays: z.number().int().min(0).optional(),
    reminderAfterDays: z.number().int().min(0).optional(),
  }),
});

export type UpdateSLAConfigParams = z.infer<
  typeof updateSLAConfigSchema
>["params"];
export type UpdateSLAConfigBody = z.infer<typeof updateSLAConfigSchema>["body"];

// GET /sla/calculate-days?start=&end=
export const calculateBusinessDaysSchema = z.object({
  query: z.object({
    start: z
      .string()
      .refine((d) => !isNaN(Date.parse(d)), {
        message: "start ต้องเป็นรูปแบบวันที่ที่ถูกต้อง",
      }),
    end: z
      .string()
      .refine((d) => !isNaN(Date.parse(d)), {
        message: "end ต้องเป็นรูปแบบวันที่ที่ถูกต้อง",
      }),
  }),
});

export type CalculateBusinessDaysQuery = z.infer<
  typeof calculateBusinessDaysSchema
>["query"];
