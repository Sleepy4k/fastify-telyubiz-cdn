import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
  FastifyError,
} from "fastify";
import fp from "fastify-plugin";
import { CDNError } from "../../shared/constants/error-codes.ts";

const errorHandlerPlugin: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  fastify.setErrorHandler(
    async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.error({
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      });

      if (error instanceof CDNError) {
        return reply.code(error.statusCode).send({
          error: true,
          code: error.code,
          message: error.message,
          errorCode: error.errorCode,
        });
      }

      if (error.validation) {
        return reply.code(400).send({
          error: true,
          code: 9002,
          message: "Validation error",
          details: error.validation,
        });
      }

      if (error.message?.includes("multipart")) {
        return reply.code(400).send({
          error: true,
          code: 2001,
          message: "Invalid file upload",
        });
      }

      if (error.statusCode === 429) {
        return reply.code(429).send({
          error: true,
          code: 9003,
          message: "Too many requests, please try again later",
        });
      }

      return reply.code(error.statusCode || 500).send({
        error: true,
        code: 9001,
        message:
          fastify.config.NODE_ENV === "production"
            ? "Internal server error"
            : error.message,
      });
    },
  );

  fastify.log.info("Error handler plugin registered");
};

export default fp(errorHandlerPlugin, {
  name: "error-handler-plugin",
});
