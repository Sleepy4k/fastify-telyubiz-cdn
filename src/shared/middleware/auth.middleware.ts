import type { FastifyRequest, FastifyReply } from "fastify";
import type { UploadTokenModel } from "../../database/models/token.model.ts";
import { CDNError } from "../constants/error-codes.ts";

declare module "fastify" {
  interface FastifyRequest {
    uploadToken?: UploadTokenModel;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.headers["x-upload-token"] as string | undefined;

  if (!token) {
    throw new CDNError("AUTH_TOKEN_MISSING", 401);
  }

  try {
    const validation = await request.server.db.tokens.validateToken(token);

    if (!validation.valid) {
      throw new CDNError("AUTH_TOKEN_INVALID", 401, validation.reason);
    }

    request.uploadToken = validation.token!;
  } catch (error: any) {
    if (error instanceof CDNError) {
      throw error;
    }

    request.log.error("Token validation error:", error);
    throw new CDNError("AUTH_TOKEN_INVALID", 401);
  }
}
