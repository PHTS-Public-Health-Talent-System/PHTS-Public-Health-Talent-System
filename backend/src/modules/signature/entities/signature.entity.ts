/**
 * Signature Module - Entity Definitions
 *
 * TypeScript interfaces matching signature-related DB tables
 */

// ─── sig_images table ─────────────────────────────────────────────────────────

export interface UserSignature {
  signature_id: number;
  user_id: number;
  signature_image: Buffer;
  created_at: Date;
  updated_at: Date;
}

// ─── Signature response for API ───────────────────────────────────────────────

export interface SignatureResponse {
  user_id: number;
  image_base64: string;
  mime_type: string;
  created_at: Date;
}
