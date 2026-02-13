import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import fastifyRateLimit from "@fastify/rate-limit";

const rateLimitPlugin: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  if (!fastify.config.ENABLE_RATE_LIMIT) {
    fastify.log.info("Rate limiting disabled");
    return;
  }

  await fastify.register(fastifyRateLimit, {
    max: fastify.config.RATE_LIMIT_MAX,
    timeWindow: fastify.config.RATE_LIMIT_WINDOW,
    errorResponseBuilder: () => ({
      error: true,
      code: 9003,
      message: "Too many requests, please try again later",
    }),
  });

  fastify.log.info(
    `Rate limit plugin registered (${fastify.config.RATE_LIMIT_MAX} req/${fastify.config.RATE_LIMIT_WINDOW}ms)`,
  );
};

export default fp(rateLimitPlugin, {
  name: "rate-limit-plugin",
  dependencies: ["env-plugin"],
});
