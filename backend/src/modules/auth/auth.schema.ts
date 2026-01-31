import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    citizen_id: z
      .string()
      .min(1, "Citizen ID is required")
      .max(13, "Citizen ID must be 13 characters"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// Infer types
export type LoginSchema = z.infer<typeof loginSchema>["body"];
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>["body"];
