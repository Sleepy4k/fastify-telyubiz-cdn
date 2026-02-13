import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import authRoutes from "./auth.routes.ts";
import cdnRoutes from "./cdn.routes.ts";
import { healthCheckSchema } from "../validators/schemas.ts";
import type { HealthCheckResponse } from "../types/index.ts";

const v1Routes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(authRoutes);
  await fastify.register(cdnRoutes);

  fastify.get<{ Reply: HealthCheckResponse }>(
    "/health",
    {
      schema: healthCheckSchema.response ? { response: healthCheckSchema.response } : {},
    },
    async () => {
      const response: HealthCheckResponse = {
        status: "ok",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      };

      return response;
    }
  );
};

export default v1Routes;
