import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { TokenService } from "../services/token.service.ts";
import type {
  GenerateTokenRequest,
  GenerateTokenResponse,
  TokenGenerationOptions,
} from "../types/index.ts";

export class AuthController {
  private tokenService: TokenService;

  constructor(fastify: FastifyInstance) {
    this.tokenService = new TokenService(fastify);
  }

  /**
   * Generate new upload token
   * POST /v1/auth/token/generate
   */
  generateToken = async (
    request: FastifyRequest<{ Body: GenerateTokenRequest }>,
    reply: FastifyReply,
  ): Promise<GenerateTokenResponse> => {
    const { category, maxFileSize, expiresIn, createdBy, metadata } =
      request.body || {};

    const options: TokenGenerationOptions = {
      category,
      maxFileSize,
      expiresIn,
      createdBy,
      metadata,
    };

    const result = await this.tokenService.generateToken(options);

    return reply.code(200).send({
      success: true,
      token: result.token,
      expiresAt: result.expiresAt?.toISOString() || null,
      restrictions: result.restrictions,
    });
  };
}
