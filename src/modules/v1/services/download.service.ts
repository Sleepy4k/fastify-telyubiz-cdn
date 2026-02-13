import type { FastifyInstance, FastifyReply } from "fastify";
import fs from "fs";
import fsPromises from "fs/promises";
import { FileRepository } from "../../../database/repositories/file.repository.ts";
import { StorageService } from "../../../shared/services/storage.service.ts";
import { ImageService } from "../../../shared/services/image.service.ts";
import { CDNError } from "../../../shared/constants/error-codes.ts";
import type { FileCategory } from "../../../config/file-categories.config.ts";
import { getMimeFromFilename } from "../../../shared/utils/file.util.ts";

export interface DownloadOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
}

export class DownloadService {
  private fastify: FastifyInstance;
  private fileRepository: FileRepository;
  private storageService: StorageService;
  private imageService: ImageService;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.fileRepository = fastify.db.files;
    this.storageService = new StorageService(fastify.config.UPLOAD_DIR);
    this.imageService = new ImageService(fastify.config.UPLOAD_DIR);
  }

  /**
   * Stream file to client with optional optimization
   */
  async streamFile(
    fileIdentifier: string,
    options: DownloadOptions,
    reply: FastifyReply,
  ): Promise<void> {
    let file = await this.fileRepository.findById(fileIdentifier);

    if (!file) {
      file = await this.fileRepository.findByStoredFilename(fileIdentifier);
    }

    if (!file) {
      throw new CDNError("FILE_NOT_FOUND", 404);
    }

    const exists = await this.storageService.fileExists(
      file.stored_filename,
      file.category as FileCategory,
    );
    if (!exists) {
      throw new CDNError("FILE_NOT_FOUND", 404, "File not found in storage");
    }

    await this.fileRepository.incrementDownloadCount(file.id);

    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    reply.header("ETag", file.hash_sha256);

    if (
      file.category === "image" &&
      (options.width || options.height || options.format)
    ) {
      await this.streamOptimizedImage(file.stored_filename, options, reply);
    } else {
      await this.streamOriginalFile(
        file.stored_filename,
        file.category as FileCategory,
        file.mime_type,
        reply,
      );
    }
  }

  /**
   * Stream original file without optimization
   */
  private async streamOriginalFile(
    storedFilename: string,
    category: FileCategory,
    mimeType: string,
    reply: FastifyReply,
  ): Promise<void> {
    const filePath = this.storageService.getFilePath(storedFilename, category);

    const stats = await fsPromises.stat(filePath);

    reply.header("Content-Length", stats.size.toString());
    reply.type(mimeType);

    const fileStream = fs.createReadStream(filePath);
    return reply.send(fileStream);
  }

  /**
   * Stream optimized image
   */
  private async streamOptimizedImage(
    storedFilename: string,
    options: DownloadOptions,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const optimizedBuffer = await this.imageService.processImage(
        storedFilename,
        {
          width: options.width,
          height: options.height,
          quality: options.quality,
          format: options.format,
        },
      );

      const mimeType = options.format
        ? `image/${options.format}`
        : "image/webp";

      reply.header("Content-Length", optimizedBuffer.length.toString());
      reply.type(mimeType);

      return reply.send(optimizedBuffer);
    } catch (error: any) {
      this.fastify.log.error("Image optimization failed:", error);

      const filePath = this.storageService.getFilePath(storedFilename, "image");
      const stats = await fsPromises.stat(filePath);

      reply.header("Content-Length", stats.size.toString());
      reply.type(getMimeFromFilename(storedFilename));

      const fileStream = fs.createReadStream(filePath);
      return reply.send(fileStream);
    }
  }

  /**
   * Stream file by stored filename (direct access)
   */
  async streamByFilename(
    storedFilename: string,
    options: DownloadOptions,
    reply: FastifyReply,
  ): Promise<void> {
    const file = await this.fileRepository.findByStoredFilename(storedFilename);

    if (!file) {
      throw new CDNError("FILE_NOT_FOUND", 404);
    }

    await this.streamFile(file.id, options, reply);
  }
}
