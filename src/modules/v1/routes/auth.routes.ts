import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { AuthController } from "../controllers/auth.controller.ts";
import { generateTokenSchema } from "../validators/schemas.ts";

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const authController = new AuthController(fastify);

  fastify.post(
    "/token/generate",
    { schema: generateTokenSchema },
    authController.generateToken,
  );
};

export default authRoutes;

