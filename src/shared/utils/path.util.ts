import path from "path";

/**
 * Sanitize filename to prevent malicious characters
 * Removes path separators and dangerous characters
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Validate that a file path is within the allowed base directory
 * Prevents path traversal attacks (e.g., ../../../etc/passwd)
 * @param filepath - File path to validate
 * @param baseDir - Base directory that should contain the file
 * @returns true if path is safe, false otherwise
 */
export function validatePath(filepath: string, baseDir: string): boolean {
  const normalized = path.normalize(filepath);
  const absolute = path.resolve(baseDir, normalized);
  const baseAbsolute = path.resolve(baseDir);

  return absolute.startsWith(baseAbsolute);
}

/**
 * Safely join paths and validate result
 * @param baseDir - Base directory
 * @param parts - Path parts to join
 * @returns Validated safe path or null if invalid
 */
export function safeJoinPath(
  baseDir: string,
  ...parts: string[]
): string | null {
  const joined = path.join(baseDir, ...parts);

  if (!validatePath(joined, baseDir)) {
    return null;
  }

  return joined;
}

/**
 * Get safe relative path within base directory
 * @param fullPath - Full path
 * @param baseDir - Base directory
 * @returns Relative path or null if outside base directory
 */
export function getSafeRelativePath(
  fullPath: string,
  baseDir: string,
): string | null {
  if (!validatePath(fullPath, baseDir)) {
    return null;
  }

  return path.relative(baseDir, fullPath);
}
