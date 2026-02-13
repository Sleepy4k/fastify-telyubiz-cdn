import path from "path";
import { fileTypeFromBuffer } from "file-type";
import mime from "mime-types";

/**
 * Get file extension from filename
 * @param filename - Filename
 * @returns Extension with dot (e.g., '.jpg') or empty string
 */
export function getFileExtension(filename: string): string {
  return filename.match(/\.[^.]+$/)?.[0] || "";
}

/**
 * Get filename without extension
 * @param filename - Filename
 * @returns Filename without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  return path.basename(filename, getFileExtension(filename));
}

/**
 * Detect MIME type from file buffer
 * @param buffer - File buffer (first chunk sufficient)
 * @returns MIME type or null if cannot detect
 */
export async function detectMimeFromBuffer(
  buffer: Buffer,
): Promise<string | null> {
  try {
    const detected = await fileTypeFromBuffer(buffer);
    return detected?.mime || null;
  } catch {
    return null;
  }
}

/**
 * Get MIME type from filename extension
 * @param filename - Filename
 * @returns MIME type or 'application/octet-stream' if unknown
 */
export function getMimeFromFilename(filename: string): string {
  return mime.lookup(filename) || "application/octet-stream";
}

/**
 * Verify that detected MIME matches declared MIME
 * @param buffer - File buffer
 * @param declaredMime - Declared MIME type
 * @returns true if matches, false otherwise
 */
export async function verifyMimeType(
  buffer: Buffer,
  declaredMime: string,
): Promise<boolean> {
  const detectedMime = await detectMimeFromBuffer(buffer);

  if (!detectedMime) {
    // Cannot detect, might be text files or unsupported types
    // Allow if declared MIME is text/* or application/json
    return (
      declaredMime.startsWith("text/") ||
      declaredMime === "application/json" ||
      declaredMime === "application/xml"
    );
  }

  return detectedMime === declaredMime;
}

/**
 * Format file size to human readable string
 * @param bytes - File size in bytes
 * @returns Human readable size (e.g., '1.5 MB')
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Check if file extension is in list of allowed extensions
 * @param filename - Filename
 * @param allowedExtensions - Array of allowed extensions (e.g., ['.jpg', '.png'])
 * @returns true if allowed, false otherwise
 */
export function isAllowedExtension(
  filename: string,
  allowedExtensions: string[],
): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return allowedExtensions.some((allowed) => allowed.toLowerCase() === ext);
}
