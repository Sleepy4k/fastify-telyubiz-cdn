/**
 * JSON Schema Validators for V1 API
 * Using @sinclair/typebox for type-safe schemas
 */

import { Type } from "@sinclair/typebox";

/**
 * Auth Schemas
 */

const FileCategoryEnum = Type.Union([
  Type.Literal("image"),
  Type.Literal("video"),
  Type.Literal("document"),
  Type.Literal("audio"),
  Type.Literal("archive"),
  Type.Literal("any"),
]);

const GenerateTokenBody = Type.Object(
  {
    category: Type.Optional(FileCategoryEnum),
    maxFileSize: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 1000000000 }),
    ),
    expiresIn: Type.Optional(
      Type.Integer({ minimum: 60, maximum: 2592000 }), // 30 days
    ),
    createdBy: Type.Optional(Type.String({ maxLength: 100 })),
    metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
  },
  { additionalProperties: false },
);

const GenerateTokenResponse = Type.Object({
  success: Type.Literal(true),
  token: Type.String({ minLength: 64, maxLength: 64 }),
  expiresAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  restrictions: Type.Object({
    category: FileCategoryEnum,
    maxFileSize: Type.Union([Type.Integer(), Type.Null()]),
    maxUses: Type.Integer({ minimum: 1 }),
  }),
});

export const generateTokenSchema = {
  body: GenerateTokenBody,
  response: {
    200: GenerateTokenResponse,
  },
} as const;

/**
 * CDN Upload Schema
 */

const UploadFileCategoryEnum = Type.Union([
  Type.Literal("image"),
  Type.Literal("video"),
  Type.Literal("document"),
  Type.Literal("audio"),
  Type.Literal("archive"),
  Type.Literal("other"),
]);

const UploadHeaders = Type.Object({
  "x-upload-token": Type.String({ minLength: 64, maxLength: 64 }),
});

const UploadFileResponse = Type.Object({
  success: Type.Literal(true),
  file: Type.Object({
    id: Type.String({ format: "uuid" }),
    url: Type.String(),
    directUrl: Type.String(),
    filename: Type.String(),
    size: Type.Integer({ minimum: 0 }),
    mimeType: Type.String(),
    category: UploadFileCategoryEnum,
    hash: Type.String({ minLength: 64, maxLength: 64 }),
  }),
});

export const uploadFileSchema = {
  headers: UploadHeaders,
  response: {
    200: UploadFileResponse,
  },
} as const;

/**
 * CDN Download Schema
 */

const ImageFormatEnum = Type.Union([
  Type.Literal("webp"),
  Type.Literal("jpeg"),
  Type.Literal("png"),
  Type.Literal("avif"),
]);

const DownloadParams = Type.Object({
  identifier: Type.String({ minLength: 1, maxLength: 255 }),
});

const DownloadQuery = Type.Object(
  {
    w: Type.Optional(Type.Integer({ minimum: 1, maximum: 4096 })),
    h: Type.Optional(Type.Integer({ minimum: 1, maximum: 4096 })),
    q: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    format: Type.Optional(ImageFormatEnum),
  },
  { additionalProperties: false },
);

export const downloadFileSchema = {
  params: DownloadParams,
  querystring: DownloadQuery,
} as const;

/**
 * Health Check Schema
 */

const HealthStatusEnum = Type.Union([
  Type.Literal("ok"),
  Type.Literal("degraded"),
  Type.Literal("down"),
]);

const HealthCheckResponse = Type.Object({
  status: HealthStatusEnum,
  version: Type.String(),
  timestamp: Type.String({ format: "date-time" }),
  database: Type.Optional(Type.Boolean()),
  storage: Type.Optional(Type.Boolean()),
});

export const healthCheckSchema = {
  response: {
    200: HealthCheckResponse,
  },
} as const;

/**
 * Error Response Schema
 */

export const errorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.String(),
  code: Type.Optional(Type.Union([Type.String(), Type.Integer()])),
  details: Type.Optional(Type.Any()),
});
