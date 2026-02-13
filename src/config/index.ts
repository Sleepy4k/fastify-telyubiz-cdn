import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import fp from "fastify-plugin";

const schema = {
  type: "object",
  required: ["PORT", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"],
  properties: {
    NODE_ENV: {
      type: "string",
      default: "development",
    },
    PORT: {
      type: "number",
      default: 3000,
    },
    HOST: {
      type: "string",
      default: "0.0.0.0",
    },

    DB_HOST: {
      type: "string",
    },
    DB_PORT: {
      type: "number",
      default: 3306,
    },
    DB_USER: {
      type: "string",
    },
    DB_PASSWORD: {
      type: "string",
    },
    DB_NAME: {
      type: "string",
    },
    DB_POOL_MIN: {
      type: "number",
      default: 2,
    },
    DB_POOL_MAX: {
      type: "number",
      default: 10,
    },

    UPLOAD_DIR: {
      type: "string",
      default: "./uploads",
    },
    MAX_FILE_SIZE_MB: {
      type: "number",
      default: 100,
    },
    ENABLE_AUTO_OPTIMIZATION: {
      type: "boolean",
      default: true,
    },

    ENABLE_RATE_LIMIT: {
      type: "boolean",
      default: true,
    },
    RATE_LIMIT_MAX: {
      type: "number",
      default: 100,
    },
    RATE_LIMIT_WINDOW: {
      type: "number",
      default: 60000,
    },
    ENABLE_CORS: {
      type: "boolean",
      default: true,
    },
    ALLOWED_ORIGINS: {
      type: "string",
      default: "http://localhost:3000",
    },

    TOKEN_DEFAULT_EXPIRY: {
      type: "number",
      default: 3600,
    },
    TOKEN_LENGTH: {
      type: "number",
      default: 32,
    },

    ENABLE_MALWARE_SCAN: {
      type: "boolean",
      default: true,
    },
    ENABLE_MIME_VERIFICATION: {
      type: "boolean",
      default: true,
    },

    LOG_LEVEL: {
      type: "string",
      default: "info",
    },
  },
};

async function configPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
    data: process.env,
  });
}

export const loadConfig = fp(configPlugin, {
  name: 'env-plugin'
});

declare module "fastify" {
  interface FastifyInstance {
    config: {
      NODE_ENV: string;
      PORT: number;
      HOST: string;
      DB_HOST: string;
      DB_PORT: number;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_NAME: string;
      DB_POOL_MIN: number;
      DB_POOL_MAX: number;
      UPLOAD_DIR: string;
      MAX_FILE_SIZE_MB: number;
      ENABLE_AUTO_OPTIMIZATION: boolean;
      ENABLE_RATE_LIMIT: boolean;
      RATE_LIMIT_MAX: number;
      RATE_LIMIT_WINDOW: number;
      ENABLE_CORS: boolean;
      ALLOWED_ORIGINS: string;
      TOKEN_DEFAULT_EXPIRY: number;
      TOKEN_LENGTH: number;
      ENABLE_MALWARE_SCAN: boolean;
      ENABLE_MIME_VERIFICATION: boolean;
      LOG_LEVEL: string;
    };
  }
}
