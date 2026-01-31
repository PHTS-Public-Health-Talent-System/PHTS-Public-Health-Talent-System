/**
 * PHTS System - Signature Routes
 *
 * API routes for managing user digital signatures.
 * All routes require authentication.
 */

import { Router } from "express";
import multer from "multer";
import { protect } from "../../middlewares/authMiddleware.js";
import { validate } from "../../shared/validate.middleware.js";
import * as signatureController from "./signature.controller.js";
import { uploadSignatureSchema } from "./signature.schema.js";

const router = Router();

/**
 * Configure multer for memory storage (signature files)
 * We use memory storage since signatures are stored in DB as BLOB
 */
const signatureUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for signatures
  },
  fileFilter: (_req, file, cb) => {
    if (["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG and JPEG images are allowed"));
    }
  },
});

/**
 * All routes require authentication
 */
router.use(protect);

/**
 * GET /api/signatures/my-signature
 * Get current user's stored signature as Base64
 */
router.get("/my-signature", signatureController.getMySignature);

/**
 * GET /api/signatures/check
 * Check if current user has a stored signature
 */
router.get("/check", signatureController.checkSignature);

/**
 * POST /api/signatures/upload
 * Upload signature from Base64 string
 * Body: { image_base64: string }
 */
router.post(
  "/upload",
  validate(uploadSignatureSchema),
  signatureController.uploadSignature,
);

/**
 * POST /api/signatures/upload-file
 * Upload signature from file
 * Form field: signature (file)
 */
router.post(
  "/upload-file",
  signatureUpload.single("signature"),
  signatureController.uploadSignatureFile,
);

/**
 * DELETE /api/signatures
 * Delete current user's stored signature
 */
router.delete("/", signatureController.deleteSignature);

export default router;
