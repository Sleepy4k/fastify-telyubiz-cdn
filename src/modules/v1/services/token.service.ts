import type { FastifyInstance } from "fastify";
import { TokenRepository } from "../../../database/repositories/token.repository.ts";
import type {
  UploadTokenModel,
  CreateTokenInput,
  TokenCategory,
} from "../../../database/models/token.model.ts";
import { generateSecureToken } from "../../../shared/utils/crypto.util.ts";
import { CDNError } from "../../../shared/constants/error-codes.ts";

export interface GenerateTokenOptions {
  category?: TokenCategory;
  maxFileSize?: number;
  expiresIn?: number;
  createdBy?: string;
  metadata?: Record<string, any>;
  maxUses?: number;
}

export interface TokenGenerationResult {
  token: string;
  expiresAt: Date | null;
  restrictions: {
    category: TokenCategory;
    maxFileSize: number | null;
    maxUses: number;
  };
}

export class TokenService {
  private tokenRepository: TokenRepository;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.tokenRepository = fastify.db.tokens;
  }

  /**
   * Generate a new upload token
   */
  async generateToken(
    options: GenerateTokenOptions = {},
  ): Promise<TokenGenerationResult> {
    const token = generateSecureToken(this.fastify.config.TOKEN_LENGTH);
    const expiresIn =
      options.expiresIn || this.fastify.config.TOKEN_DEFAULT_EXPIRY;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const tokenInput: CreateTokenInput = {
      token,
      allowed_category: options.category || "any",
      max_file_size: options.maxFileSize,
      max_uses: options.maxUses || 1,
      created_by: options.createdBy,
      metadata: options.metadata,
      expires_at: expiresAt,
    };

    const createdToken = await this.tokenRepository.create(tokenInput);

    return {
      token: createdToken.token,
      expiresAt: createdToken.expires_at,
      restrictions: {
        category: createdToken.allowed_category,
        maxFileSize: createdToken.max_file_size,
        maxUses: createdToken.max_uses,
      },
    };
  }

  /**
   * Validate token and return token data if valid
   */
  async validateToken(token: string): Promise<UploadTokenModel> {
    const validation = await this.tokenRepository.validateToken(token);

    if (!validation.valid) {
      throw new CDNError("AUTH_TOKEN_INVALID", 401, validation.reason);
    }

    return validation.token!;
  }

  /**
   * Mark token as used after successful upload
   */
  async markTokenAsUsed(tokenId: number, fileId?: string): Promise<void> {
    await this.tokenRepository.markAsUsed(tokenId);

    await this.tokenRepository.logUsage({
      token_id: tokenId,
      file_id: fileId,
      status: "success",
    });
  }

  /**
   * Log failed token usage
   */
  async logFailedUsage(
    tokenId: number,
    ipAddress: string | undefined,
    userAgent: string | undefined,
    errorMessage: string,
  ): Promise<void> {
    await this.tokenRepository.logUsage({
      token_id: tokenId,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: "failed",
      error_message: errorMessage,
    });
  }

  /**
   * Log rejected token usage
   */
  async logRejectedUsage(
    token: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
    errorMessage: string,
  ): Promise<void> {
    const tokenData = await this.tokenRepository.findByToken(token);

    if (tokenData) {
      await this.tokenRepository.logUsage({
        token_id: tokenData.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: "rejected",
        error_message: errorMessage,
      });
    }
  }
}
