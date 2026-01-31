import { z } from "zod";

// POST /signatures/upload - Upload from base64
export const uploadSignatureSchema = z.object({
  body: z.object({
    image_base64: z.string().min(1, "image_base64 จำเป็นต้องระบุ"),
  }),
});

export type UploadSignatureBody = z.infer<typeof uploadSignatureSchema>["body"];

// Note: upload-file uses multer for file handling, validation handled by multer config
