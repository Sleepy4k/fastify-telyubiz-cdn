import sharp from "sharp";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { validatePath } from "../utils/path.util.ts";

export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
}

export class ImageService {
  private baseDir: string;

  constructor(baseDir: string = "./uploads") {
    this.baseDir = path.resolve(baseDir);
  }

  /**
   * Process and optimize image with caching
   */
  async processImage(
    storedFilename: string,
    options: OptimizationOptions = {},
  ): Promise<Buffer> {
    const { width, height, quality = 80, format = "webp" } = options;
    const cacheKey = this.buildCacheKey(storedFilename, options);
    const cachePath = path.join(this.baseDir, "cache", "image", cacheKey);

    try {
      const cachedBuffer = await fsPromises.readFile(cachePath);
      return cachedBuffer;
    } catch {
      // Cache miss, continue with processing
    }

    const rawPath = path.join(this.baseDir, "raw", "image", storedFilename);

    // Validate paths
    if (
      !validatePath(rawPath, this.baseDir) ||
      !validatePath(cachePath, this.baseDir)
    ) {
      throw new Error("Invalid file path");
    }

    await fsPromises.mkdir(path.dirname(cachePath), { recursive: true });

    let transformer = sharp(rawPath);

    if (width || height) {
      transformer = transformer.resize({
        width,
        height,
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    const clampedQuality = Math.max(1, Math.min(100, quality));

    switch (format) {
      case "webp":
        transformer = transformer.webp({ quality: clampedQuality });
        break;
      case "jpeg":
        transformer = transformer.jpeg({ quality: clampedQuality });
        break;
      case "png":
        transformer = transformer.png({ quality: clampedQuality });
        break;
      case "avif":
        transformer = transformer.avif({ quality: clampedQuality });
        break;
    }

    const buffer = await transformer.toBuffer();
    await fsPromises.writeFile(cachePath, buffer);

    return buffer;
  }

  /**
   * Get original image stream
   */
  getOriginalStream(storedFilename: string): fs.ReadStream {
    const rawPath = path.join(this.baseDir, "raw", "image", storedFilename);

    if (!validatePath(rawPath, this.baseDir)) {
      throw new Error("Invalid file path");
    }

    return fs.createReadStream(rawPath);
  }

  /**
   * Validate image file
   */
  async validateImage(storedFilename: string): Promise<boolean> {
    try {
      const rawPath = path.join(this.baseDir, "raw", "image", storedFilename);
      const metadata = await sharp(rawPath).metadata();
      return (metadata.width ?? 0) > 0 && (metadata.height ?? 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(storedFilename: string): Promise<sharp.Metadata> {
    const rawPath = path.join(this.baseDir, "raw", "image", storedFilename);

    if (!validatePath(rawPath, this.baseDir)) {
      throw new Error("Invalid file path");
    }

    return await sharp(rawPath).metadata();
  }

  /**
   * Build cache key from optimization options
   */
  private buildCacheKey(
    filename: string,
    options: OptimizationOptions,
  ): string {
    const { name } = path.parse(filename);
    const { width, height, quality = 80, format = "webp" } = options;

    let key = name;

    if (width) key += `_w${width}`;
    if (height) key += `_h${height}`;
    key += `_q${quality}`;
    key += `.${format}`;

    return key;
  }

  /**
   * Clear cached versions for a specific image
   */
  async clearCache(storedFilename: string): Promise<void> {
    const { name } = path.parse(storedFilename);
    const cacheDir = path.join(this.baseDir, "cache", "image");

    try {
      const files = await fsPromises.readdir(cacheDir);
      const matchingFiles = files.filter((file) => file.startsWith(name + "_"));

      for (const file of matchingFiles) {
        await fsPromises.unlink(path.join(cacheDir, file));
      }
    } catch {
      // Ignore errors
    }
  }
}
