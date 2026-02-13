import type { FileCategory } from "../../../config/file-categories.config.ts";

/**
 * Request Types
 */

export interface GenerateTokenRequest {
  category?: FileCategory | "any";
  maxFileSize?: number;
  expiresIn?: number;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface DownloadFileParams {
  identifier: string;
}

export interface DownloadFileQuery {
  w?: number;
  h?: number;
  q?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
}

/**
 * Response Types
 */

export interface GenerateTokenResponse {
  success: true;
  token: string;
  expiresAt: string | null;
  restrictions: {
    category: FileCategory | "any";
    maxFileSize: number | null;
    maxUses: number;
  };
}

export interface UploadFileResponse {
  success: true;
  file: {
    id: string;
    url: string;
    directUrl: string;
    filename: string;
    size: number;
    mimeType: string;
    category: FileCategory;
    hash: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string | number;
  details?: any;
}

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "down";
  version: string;
  timestamp: string;
  database?: boolean;
  storage?: boolean;
}

/**
 * Internal Types (DTOs)
 */

export interface UploadFileData {
  filename: string;
  storedFilename: string;
  category: FileCategory;
  mimeType: string;
  fileSize: number;
  fileExtension: string;
  storagePath: string;
  hash: string;
  tokenId: number;
}

export interface TokenGenerationOptions {
  category?: FileCategory | "any";
  maxFileSize?: number;
  expiresIn?: number;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface TokenGenerationResult {
  token: string;
  expiresAt: Date | null;
  restrictions: {
    category: FileCategory | "any";
    maxFileSize: number | null;
    maxUses: number;
  };
}

/**
 * Type Guards
 */

export function isValidFileCategory(value: any): value is FileCategory {
  return ["image", "video", "document", "audio", "archive", "other"].includes(
    value,
  );
}

export function isValidTokenCategory(
  value: any,
): value is FileCategory | "any" {
  return isValidFileCategory(value) || value === "any";
}

export function isValidImageFormat(
  value: any,
): value is "webp" | "jpeg" | "png" | "avif" {
  return ["webp", "jpeg", "png", "avif"].includes(value);
}
