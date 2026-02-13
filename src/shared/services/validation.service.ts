import fs from "fs/promises";
import path from "path";
import {
  type FileCategory,
  FILE_CATEGORIES,
  isAllowedExtension,
  isAllowedMimeType,
} from "../../config/file-categories.config.ts";
import {
  verifyMimeType,
  detectMimeFromBuffer,
  getFileExtension,
} from "../utils/file.util.ts";
import { validatePath } from "../utils/path.util.ts";
import { MalwareService, type MalwareScanResult } from "./malware.service.ts";

export interface ValidationOptions {
  enableMalwareScan?: boolean;
  enableMimeVerification?: boolean;
  category?: FileCategory;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  category?: FileCategory;
  mimeType?: string;
  fileSize?: number;
  malwareScan?: MalwareScanResult;
}

export class ValidationService {
  private malwareService: MalwareService;

  constructor() {
    this.malwareService = new MalwareService();
  }

  /**
   * Perform multi-layer file validation
   * @param filePath - Path to file to validate
   * @param category - Expected file category
   * @param declaredMime - Declared MIME type
   * @param options - Validation options
   * @returns Validation result
   */
  async validateFile(
    filePath: string,
    category: FileCategory,
    declaredMime: string,
    options: ValidationOptions = {},
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const existsCheck = await this.checkFileExists(filePath);
      if (!existsCheck) {
        errors.push("File does not exist");
        return { valid: false, errors, warnings };
      }

      const extCheck = this.validateExtension(filePath, category);
      if (!extCheck.valid) {
        errors.push(extCheck.error!);
      }

      const mimeCheck = await this.validateMimeType(
        filePath,
        category,
        declaredMime,
        options.enableMimeVerification,
      );
      if (!mimeCheck.valid) {
        errors.push(mimeCheck.error!);
      } else if (mimeCheck.warning) {
        warnings.push(mimeCheck.warning);
      }

      const sizeCheck = await this.validateFileSize(filePath, category);
      if (!sizeCheck.valid) {
        errors.push(sizeCheck.error!);
      }

      let malwareScan: MalwareScanResult | undefined;
      if (options.enableMalwareScan !== false) {
        malwareScan = await this.malwareService.scanFile(filePath, category);
        if (!malwareScan.safe) {
          errors.push(`Security validation failed: ${malwareScan.details}`);
        }
      }

      if (category === "image" && errors.length === 0) {
        const imageCheck = await this.validateImageIntegrity(filePath);
        if (!imageCheck.valid) {
          errors.push(imageCheck.error!);
        }
      }

      const stats = await fs.stat(filePath);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        category,
        mimeType: mimeCheck.detectedMime,
        fileSize: stats.size,
        malwareScan,
      };
    } catch (error) {
      errors.push(
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Check if file exists
   */
  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate file extension against category whitelist
   */
  private validateExtension(
    filePath: string,
    category: FileCategory,
  ): { valid: boolean; error?: string } {
    const filename = path.basename(filePath);

    if (!isAllowedExtension(filename, category)) {
      const ext = getFileExtension(filename);
      return {
        valid: false,
        error: `File extension '${ext}' is not allowed for category '${category}'`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate MIME type
   */
  private async validateMimeType(
    filePath: string,
    category: FileCategory,
    declaredMime: string,
    enableVerification: boolean = true,
  ): Promise<{
    valid: boolean;
    error?: string;
    warning?: string;
    detectedMime?: string;
  }> {
    // Check if declared MIME is in category whitelist
    if (!isAllowedMimeType(declaredMime, category)) {
      return {
        valid: false,
        error: `MIME type '${declaredMime}' is not allowed for category '${category}'`,
      };
    }

    if (!enableVerification) {
      return { valid: true, detectedMime: declaredMime };
    }

    // Read first chunk of file for MIME detection
    try {
      const buffer = await this.readFileChunk(filePath, 4096);
      const verified = await verifyMimeType(buffer, declaredMime);

      if (!verified) {
        const detectedMime = await detectMimeFromBuffer(buffer);
        return {
          valid: false,
          error: `MIME type mismatch: declared '${declaredMime}', detected '${detectedMime || "unknown"}'`,
          detectedMime: detectedMime || undefined,
        };
      }

      return { valid: true, detectedMime: declaredMime };
    } catch (error) {
      return {
        valid: true,
        warning: "Could not verify MIME type",
        detectedMime: declaredMime,
      };
    }
  }

  /**
   * Validate file size against category limits
   */
  private async validateFileSize(
    filePath: string,
    category: FileCategory,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const stats = await fs.stat(filePath);
      const maxSize = FILE_CATEGORIES[category].maxSize;

      if (stats.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
        const actualSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        return {
          valid: false,
          error: `File size ${actualSizeMB}MB exceeds maximum allowed size ${maxSizeMB}MB for category '${category}'`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Could not check file size: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Validate image file integrity
   */
  private async validateImageIntegrity(
    filePath: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const isValid =
        await this.malwareService.validateImageIntegrity(filePath);
      if (!isValid) {
        return {
          valid: false,
          error: "Image file is corrupted or invalid",
        };
      }
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Image validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Read first chunk of file for MIME detection
   */
  private async readFileChunk(
    filePath: string,
    chunkSize: number = 4096,
  ): Promise<Buffer> {
    const handle = await fs.open(filePath, "r");
    try {
      const buffer = Buffer.alloc(chunkSize);
      await handle.read(buffer, 0, chunkSize, 0);
      return buffer;
    } finally {
      await handle.close();
    }
  }

  /**
   * Validate file path for safety (prevent path traversal)
   */
  validateFilePath(filePath: string, baseDir: string): boolean {
    return validatePath(filePath, baseDir);
  }
}
