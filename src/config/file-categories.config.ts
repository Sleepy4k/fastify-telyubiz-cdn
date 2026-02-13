export interface CategoryConfig {
  extensions: string[];
  mimeTypes: string[];
  maxSize: number;
  allowOptimization: boolean;
}

export type FileCategory =
  | "image"
  | "video"
  | "document"
  | "audio"
  | "archive"
  | "other";

export const FILE_CATEGORIES: Record<FileCategory, CategoryConfig> = {
  image: {
    extensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".ico",
    ],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/x-icon",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    allowOptimization: true,
  },
  video: {
    extensions: [".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv"],
    mimeTypes: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/x-flv",
      "video/x-ms-wmv",
    ],
    maxSize: 500 * 1024 * 1024, // 500MB
    allowOptimization: true,
  },
  document: {
    extensions: [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".txt",
      ".csv",
    ],
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    allowOptimization: false,
  },
  audio: {
    extensions: [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".wma"],
    mimeTypes: [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/flac",
      "audio/aac",
      "audio/x-ms-wma",
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    allowOptimization: false,
  },
  archive: {
    extensions: [".zip", ".tar", ".gz", ".7z", ".rar", ".bz2"],
    mimeTypes: [
      "application/zip",
      "application/x-tar",
      "application/gzip",
      "application/x-7z-compressed",
      "application/x-rar-compressed",
      "application/x-bzip2",
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    allowOptimization: false,
  },
  other: {
    extensions: [],
    mimeTypes: [],
    maxSize: 10 * 1024 * 1024, // 10MB default
    allowOptimization: false,
  },
};

export function detectCategoryFromExtension(filename: string): FileCategory {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];

  if (!ext) return "other";

  for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
    if (config.extensions.includes(ext)) {
      return category as FileCategory;
    }
  }

  return "other";
}

export function detectCategoryFromMimeType(mimeType: string): FileCategory {
  const normalizedMime = mimeType.toLowerCase();

  for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
    for (const mime of config.mimeTypes) {
      if (
        normalizedMime === mime.toLowerCase() ||
        (mime.includes("*") && normalizedMime.startsWith(mime.split("*")[0]!))
      ) {
        return category as FileCategory;
      }
    }
  }

  return "other";
}

export function isAllowedExtension(
  filename: string,
  category: FileCategory,
): boolean {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext) return false;

  const config = FILE_CATEGORIES[category];
  return config.extensions.includes(ext);
}

export function isAllowedMimeType(
  mimeType: string,
  category: FileCategory,
): boolean {
  const config = FILE_CATEGORIES[category];
  return config.mimeTypes.some(
    (allowed) => mimeType.toLowerCase() === allowed.toLowerCase(),
  );
}

export function getMaxSize(category: FileCategory): number {
  return FILE_CATEGORIES[category].maxSize;
}

export function isOptimizable(category: FileCategory): boolean {
  return FILE_CATEGORIES[category].allowOptimization;
}
