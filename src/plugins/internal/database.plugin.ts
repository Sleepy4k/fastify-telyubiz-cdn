import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import {
  createDatabasePool,
  closeDatabasePool,
} from "../../database/connection.ts";
import { FileRepository } from "../../database/repositories/file.repository.ts";
import { TokenRepository } from "../../database/repositories/token.repository.ts";

declare module "fastify" {
  interface FastifyInstance {
    db: {
      files: FileRepository;
      tokens: TokenRepository;
    };
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await createDatabasePool(fastify);

  const fileRepository = new FileRepository();
  const tokenRepository = new TokenRepository();

  fastify.decorate("db", {
    files: fileRepository,
    tokens: tokenRepository,
  });

  fastify.addHook("onClose", async () => {
    await closeDatabasePool();
    fastify.log.info("Database connection closed");
  });

  fastify.log.info("Database plugin registered");
};

export default fp(databasePlugin, {
  name: "database-plugin",
});
