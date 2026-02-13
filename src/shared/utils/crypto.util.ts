import crypto from "crypto";

/**
 * Generate a cryptographically secure random token
 * @param length - Length in bytes (default: 32 bytes = 64 hex characters)
 * @returns Hexadecimal token string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash a token using SHA256
 * @param token - Token to hash
 * @returns SHA256 hash in hexadecimal
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Calculate SHA256 hash of a file
 * @param buffer - File buffer
 * @returns SHA256 hash in hexadecimal
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Generate a unique filename with UUID and original extension
 * @param originalFilename - Original filename
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const uuid = crypto.randomUUID();
  const ext = originalFilename.match(/\.[^.]+$/)?.[0] || "";
  return `${uuid}${ext}`;
}
