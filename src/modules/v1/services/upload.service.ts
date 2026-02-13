import type { FastifyInstance } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import {
  detectCategoryFromExtension,
  detectCategoryFromMimeType,
  getMaxSize,
  isOptimizable,
} from "../../../config/file-categories.config.ts";
import { StorageService } from "../../../shared/services/storage.service.ts";
import { ValidationService } from "../../../shared/services/validation.service.ts";
import { FileRepository } from "../../../database/repositories/file.repository.ts";
import type { FileModel } from "../../../database/models/file.model.ts";
import type { UploadTokenModel } from "../../../database/models/token.model.ts";
import { CDNError } from "../../../shared/constants/error-codes.ts";
import {
  getFileExtension,
  getMimeFromFilename,
} from "../../../shared/utils/file.util.ts";
import crypto from "crypto";

export interface UploadResult {
  file: FileModel;
}

export class UploadService {
  private fastify: FastifyInstance;
  private storageService: StorageService;
  private validationService: ValidationService;
  private fileRepository: FileRepository;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.storageService = new StorageService(fastify.config.UPLOAD_DIR);
    this.validationService = new ValidationService();
    this.fileRepository = fastify.db.files;
  }

  /**
   * Handle file upload with full validation and token verification
   */
  async handleUpload(
    file: MultipartFile,
    token: UploadTokenModel,
  ): Promise<UploadResult> {
    const filename = file.filename;
    const mimeType = file.mimetype;

    const categoryFromExt = detectCategoryFromExtension(filename);
    const categoryFromMime = detectCategoryFromMimeType(mimeType);

    const category =
      categoryFromMime !== "other" ? categoryFromMime : categoryFromExt;

    this.fastify.log.info(
      `Uploading file: ${filename}, category: ${category}, mime: ${mimeType}`,
    );

    if (
      token.allowed_category !== "any" &&
      token.allowed_category !== category
    ) {
      throw new CDNError(
        "FILE_CATEGORY_MISMATCH",
        403,
        `Token only allows '${token.allowed_category}' files, got '${category}'`,
      );
    }

    const tempResult = await this.storageService.saveStream(
      file.file,
      filename,
      category,
    );

    try {
      const maxSize = token.max_file_size || getMaxSize(category);
      if (tempResult.fileSize > maxSize) {
        await this.storageService.deleteFile(
          tempResult.storedFilename,
          category,
        );
        throw new CDNError(
          "FILE_TOO_LARGE",
          400,
          `File size ${(tempResult.fileSize / 1024 / 1024).toFixed(2)}MB exceeds limit ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
        );
      }

      const existingFile = await this.fileRepository.findByHash(
        tempResult.fileHash,
      );
      if (existingFile) {
        await this.storageService.deleteFile(
          tempResult.storedFilename,
          category,
        );
        this.fastify.log.info(
          `Duplicate file detected, returning existing: ${existingFile.id}`,
        );
        return { file: existingFile };
      }

      const filePath = this.storageService.getFilePath(
        tempResult.storedFilename,
        category,
      );

      const validationResult = await this.validationService.validateFile(
        filePath,
        category,
        mimeType,
        {
          enableMalwareScan: this.fastify.config.ENABLE_MALWARE_SCAN,
          enableMimeVerification: this.fastify.config.ENABLE_MIME_VERIFICATION,
          category,
        },
      );

      if (!validationResult.valid) {
        await this.storageService.deleteFile(
          tempResult.storedFilename,
          category,
        );
        throw new CDNError(
          "SECURITY_VALIDATION_FAILED",
          400,
          validationResult.errors.join("; "),
        );
      }

      const fileModel: FileModel = await this.fileRepository.create({
        id: crypto.randomUUID(),
        filename,
        stored_filename: tempResult.storedFilename,
        category,
        mime_type: mimeType,
        file_size: tempResult.fileSize,
        file_extension: getFileExtension(filename),
        storage_path: tempResult.storagePath,
        is_optimizable: isOptimizable(category),
        hash_sha256: tempResult.fileHash,
        uploaded_by_token: token.token,
      });

      await this.fileRepository.update(fileModel.id, {
        is_validated: true,
        validation_status: "safe",
      });

      this.fastify.log.info(`File uploaded successfully: ${fileModel.id}`);

      return { file: fileModel };
    } catch (error) {
      await this.storageService.deleteFile(tempResult.storedFilename, category);
      throw error;
    }
  }
}
