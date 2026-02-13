import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import fastifyMultipart from "@fastify/multipart";

const multipartPlugin: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: fastify.config.MAX_FILE_SIZE_MB * 1024 * 1024,
      files: 1, // Only allow single file upload
    },
    attachFieldsToBody: false,
  });

  fastify.log.info(
    `Multipart plugin registered (max size: ${fastify.config.MAX_FILE_SIZE_MB}MB)`,
  );
};

export default fp(multipartPlugin, {
  name: "multipart-plugin",
  dependencies: ["env-plugin"],
});
