import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { UploadService } from "../services/upload.service.ts";
import { DownloadService } from "../services/download.service.ts";
import { TokenService } from "../services/token.service.ts";
import { CDNError } from "../../../shared/constants/error-codes.ts";
import type {
  DownloadFileParams,
  DownloadFileQuery,
  UploadFileResponse,
} from "../types/index.ts";

export class CdnController {
  private uploadService: UploadService;
  private downloadService: DownloadService;
  private tokenService: TokenService;

  constructor(fastify: FastifyInstance) {
    this.uploadService = new UploadService(fastify);
    this.downloadService = new DownloadService(fastify);
    this.tokenService = new TokenService(fastify);
  }

  /**
   * Upload file
   * POST /v1/upload
   * Requires X-Upload-Token header
   */
  uploadFile = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<UploadFileResponse> => {
    const uploadToken = request.uploadToken;

    if (!uploadToken) {
      throw new CDNError("AUTH_TOKEN_MISSING", 401);
    }

    const file = await request.file();

    if (!file) {
      throw new CDNError("FILE_NOT_PROVIDED", 400);
    }

    try {
      const result = await this.uploadService.handleUpload(file, uploadToken);

      await this.tokenService.markTokenAsUsed(uploadToken.id, result.file.id);

      const response: UploadFileResponse = {
        success: true,
        file: {
          id: result.file.id,
          url: `/v1/files/${result.file.id}`,
          directUrl: `/v1/files/${result.file.stored_filename}`,
          filename: result.file.filename,
          size: result.file.file_size,
          mimeType: result.file.mime_type,
          category: result.file.category as any,
          hash: result.file.hash_sha256,
        },
      };

      return reply.code(200).send(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.tokenService.logFailedUsage(
        uploadToken.id,
        request.ip,
        request.headers["user-agent"],
        errorMessage,
      );

      throw error;
    }
  };

  /**
   * Download file by ID or filename
   * GET /v1/files/:identifier
   */
  downloadFile = async (
    request: FastifyRequest<{
      Params: DownloadFileParams;
      Querystring: DownloadFileQuery;
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { identifier } = request.params;
    const { w: width, h: height, q: quality, format } = request.query;

    await this.downloadService.streamFile(
      identifier,
      { width, height, quality, format },
      reply,
    );
  };
}
