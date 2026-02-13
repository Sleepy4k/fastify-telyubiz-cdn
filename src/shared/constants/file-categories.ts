/**
 * File categories supported by the CDN
 */
export const FILE_CATEGORY = {
  IMAGE: "image",
  VIDEO: "video",
  DOCUMENT: "document",
  AUDIO: "audio",
  ARCHIVE: "archive",
  OTHER: "other",
} as const;

/**
 * Validation status for uploaded files
 */
export const VALIDATION_STATUS = {
  PENDING: "pending",
  SAFE: "safe",
  MALICIOUS: "malicious",
  FAILED: "failed",
} as const;

/**
 * Token usage status
 */
export const TOKEN_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  REJECTED: "rejected",
} as const;

/**
 * Supported image optimization formats
 */
export const OPTIMIZATION_FORMATS = {
  WEBP: "webp",
  JPEG: "jpeg",
  PNG: "png",
  AVIF: "avif",
} as const;

/**
 * Default optimization settings
 */
export const DEFAULT_OPTIMIZATION = {
  QUALITY: 80,
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  FORMAT: "webp",
} as const;
