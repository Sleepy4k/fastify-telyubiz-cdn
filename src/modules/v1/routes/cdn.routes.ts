import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { CdnController } from "../controllers/cdn.controller.ts";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.ts";
import { uploadFileSchema, downloadFileSchema } from "../validators/schemas.ts";

const cdnRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const cdnController = new CdnController(fastify);

  // Upload file (requires token authentication)
  fastify.post(
    "/upload",
    {
      preHandler: authMiddleware,
      schema: uploadFileSchema,
    },
    cdnController.uploadFile,
  );

  // Download file (public access, no authentication)
  fastify.get(
    "/files/:identifier",
    { schema: downloadFileSchema },
    cdnController.downloadFile,
  );
};

export default cdnRoutes;

