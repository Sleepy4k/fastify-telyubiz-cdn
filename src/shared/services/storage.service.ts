import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import type { FileCategory } from "../../config/file-categories.config.ts";
import {
  generateUniqueFilename,
  calculateFileHash,
} from "../utils/crypto.util.ts";
import { validatePath } from "../utils/path.util.ts";

export interface SaveFileResult {
  storedFilename: string;
  storagePath: string;
  fileHash: string;
  fileSize: number;
}

export class StorageService {
  private baseDir: string;

  constructor(baseDir: string = "./uploads") {
    this.baseDir = path.resolve(baseDir);
  }

  /**
   * Save file stream to storage with category-based organization
   */
  async saveStream(
    fileStream: NodeJS.ReadableStream,
    originalFilename: string,
    category: FileCategory,
  ): Promise<SaveFileResult> {
    const storedFilename = generateUniqueFilename(originalFilename);
    const categoryDir = path.join(this.baseDir, "raw", category);
    const filePath = path.join(categoryDir, storedFilename);

    await fs.mkdir(categoryDir, { recursive: true });

    if (!validatePath(filePath, this.baseDir)) {
      throw new Error("Invalid file path");
    }

    const writeStream = fsSync.createWriteStream(filePath);
    await pipeline(fileStream, writeStream);

    const fileBuffer = await fs.readFile(filePath);
    const fileHash = calculateFileHash(fileBuffer);
    const stats = await fs.stat(filePath);

    const relativePath = path.relative(this.baseDir, filePath);

    return {
      storedFilename,
      storagePath: relativePath,
      fileHash,
      fileSize: stats.size,
    };
  }

  /**
   * Get file path by stored filename and category
   */
  getFilePath(storedFilename: string, category: FileCategory): string {
    const filePath = path.join(this.baseDir, "raw", category, storedFilename);

    if (!validatePath(filePath, this.baseDir)) {
      throw new Error("Invalid file path");
    }

    return filePath;
  }

  /**
   * Check if file exists
   */
  async fileExists(
    storedFilename: string,
    category: FileCategory,
  ): Promise<boolean> {
    try {
      const filePath = this.getFilePath(storedFilename, category);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(
    storedFilename: string,
    category: FileCategory,
  ): Promise<boolean> {
    try {
      const filePath = this.getFilePath(storedFilename, category);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stream for reading
   */
  getFileStream(
    storedFilename: string,
    category: FileCategory,
  ): fsSync.ReadStream {
    const filePath = this.getFilePath(storedFilename, category);
    return fsSync.createReadStream(filePath);
  }

  /**
   * Get file buffer
   */
  async getFileBuffer(
    storedFilename: string,
    category: FileCategory,
  ): Promise<Buffer> {
    const filePath = this.getFilePath(storedFilename, category);
    return await fs.readFile(filePath);
  }

  /**
   * Ensure upload directories exist for all categories
   */
  async ensureDirectories(): Promise<void> {
    const categories: FileCategory[] = [
      "image",
      "video",
      "document",
      "audio",
      "archive",
      "other",
    ];

    for (const category of categories) {
      await fs.mkdir(path.join(this.baseDir, "raw", category), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.baseDir, "cache", category), {
        recursive: true,
      });
    }
  }
}
