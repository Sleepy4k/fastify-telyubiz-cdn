export const ERROR_CODES = {
  // Authentication errors (1xxx)
  AUTH_TOKEN_MISSING: {
    code: 1001,
    message: "Upload token is required",
  },
  AUTH_TOKEN_INVALID: {
    code: 1002,
    message: "Invalid or expired token",
  },
  AUTH_TOKEN_USED: {
    code: 1003,
    message: "Token has already been used",
  },
  AUTH_TOKEN_EXPIRED: {
    code: 1004,
    message: "Token has expired",
  },
  AUTH_TOKEN_INACTIVE: {
    code: 1005,
    message: "Token is not active",
  },

  // File validation errors (2xxx)
  FILE_NOT_PROVIDED: {
    code: 2001,
    message: "No file provided",
  },
  FILE_TOO_LARGE: {
    code: 2002,
    message: "File size exceeds maximum allowed size",
  },
  FILE_TYPE_NOT_ALLOWED: {
    code: 2003,
    message: "File type is not allowed",
  },
  FILE_MIME_TYPE_MISMATCH: {
    code: 2004,
    message: "File MIME type does not match extension",
  },
  FILE_NOT_FOUND: {
    code: 2005,
    message: "File not found",
  },
  FILE_CATEGORY_MISMATCH: {
    code: 2006,
    message: "File category does not match token restriction",
  },

  // Security errors (3xxx)
  SECURITY_MALWARE_DETECTED: {
    code: 3001,
    message: "File failed security validation - potential malware detected",
  },
  SECURITY_CODE_INJECTION: {
    code: 3002,
    message: "File contains suspicious code or script injection",
  },
  SECURITY_PATH_TRAVERSAL: {
    code: 3003,
    message: "Invalid file path detected",
  },
  SECURITY_VALIDATION_FAILED: {
    code: 3004,
    message: "File security validation failed",
  },

  // Database errors (4xxx)
  DB_CONNECTION_FAILED: {
    code: 4001,
    message: "Database connection failed",
  },
  DB_QUERY_FAILED: {
    code: 4002,
    message: "Database query failed",
  },
  DB_DUPLICATE_ENTRY: {
    code: 4003,
    message: "Duplicate entry detected",
  },

  // Storage errors (5xxx)
  STORAGE_WRITE_FAILED: {
    code: 5001,
    message: "Failed to write file to storage",
  },
  STORAGE_READ_FAILED: {
    code: 5002,
    message: "Failed to read file from storage",
  },
  STORAGE_DELETE_FAILED: {
    code: 5003,
    message: "Failed to delete file from storage",
  },

  // General errors (9xxx)
  INTERNAL_SERVER_ERROR: {
    code: 9001,
    message: "Internal server error",
  },
  INVALID_REQUEST: {
    code: 9002,
    message: "Invalid request parameters",
  },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class CDNError extends Error {
  code: number;
  errorCode: ErrorCode;
  statusCode: number;

  constructor(
    errorCode: ErrorCode,
    statusCode: number = 400,
    additionalMessage?: string,
  ) {
    const error = ERROR_CODES[errorCode];
    const message = additionalMessage
      ? `${error.message}: ${additionalMessage}`
      : error.message;
    super(message);

    this.code = error.code;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.name = "CDNError";
  }
}
