import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const securityPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook("onSend", async (request, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-XSS-Protection", "1; mode=block");

    // For CDN files, allow cross-origin access but with security
    if (request.url.startsWith("/v1/files/")) {
      reply.header("Cross-Origin-Resource-Policy", "cross-origin");
    }
  });

  fastify.log.info("Security plugin registered");
};

export default fp(securityPlugin, {
  name: "security-plugin",
});
