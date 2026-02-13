import Fastify from "fastify";
import { loadConfig } from "./config/index.ts";
import databasePlugin from "./plugins/internal/database.plugin.ts";
import errorHandlerPlugin from "./plugins/internal/error-handler.plugin.ts";
import securityPlugin from "./plugins/internal/security.plugin.ts";
import multipartPlugin from "./plugins/external/multipart.plugin.ts";
import corsPlugin from "./plugins/external/cors.plugin.ts";
import helmetPlugin from "./plugins/external/helmet.plugin.ts";
import rateLimitPlugin from "./plugins/external/rate-limit.plugin.ts";
import v1Routes from "./modules/v1/routes/index.ts";
import { StorageService } from "./shared/services/storage.service.ts";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty" }
          : undefined,
    },
    trustProxy: true,
    disableRequestLogging: process.env.NODE_ENV !== "development",
  });

  try {
    await app.register(loadConfig);
    app.log.info("✅ Configuration loaded");

    await app.register(helmetPlugin);
    await app.register(corsPlugin);
    await app.register(rateLimitPlugin);
    await app.register(multipartPlugin);
    app.log.info("✅ External plugins registered");

    await app.register(errorHandlerPlugin);
    await app.register(securityPlugin);
    await app.register(databasePlugin);
    app.log.info("✅ Internal plugins registered");

    const storageService = new StorageService(app.config.UPLOAD_DIR);
    await storageService.ensureDirectories();
    app.log.info("✅ Storage directories initialized");

    await app.register(v1Routes, { prefix: "/v1" });
    app.log.info("✅ V1 API routes registered");

    app.get("/", async () => {
      return {
        service: "Fastify Telyubiz CDN",
        version: "1.0.0",
        status: "running",
        endpoints: {
          v1: {
            health: "/health",
            generateToken: "/token/generate",
            upload: "/upload",
            download: "/files/:identifier",
          },
        },
      };
    });

    const signals = ["SIGINT", "SIGTERM"];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, closing server...`);
        await app.close();
        process.exit(0);
      });
    });

    return app;
  } catch (error: any) {
    app.log.error("Failed to build application:", error);
    throw error;
  }
}

const start = async () => {
  try {
    const app = await buildApp();

    const host = app.config.HOST;
    const port = app.config.PORT;

    await app.listen({ host, port });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
