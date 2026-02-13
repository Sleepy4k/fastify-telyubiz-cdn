import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  if (!fastify.config.ENABLE_CORS) {
    fastify.log.info("CORS disabled");
    return;
  }

  const allowedOrigins = fastify.config.ALLOWED_ORIGINS.split(",").map((o) =>
    o.trim(),
  );

  await fastify.register(fastifyCors, {
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Upload-Token"],
  });

  fastify.log.info(
    `CORS plugin registered (origins: ${allowedOrigins.join(", ")})`,
  );
};

export default fp(corsPlugin, {
  name: "cors-plugin",
  dependencies: ["env-plugin"],
});
