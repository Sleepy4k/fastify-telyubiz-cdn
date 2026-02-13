import type { FileCategory } from '../../config/file-categories.config.ts';

export type ValidationStatus = 'pending' | 'safe' | 'malicious' | 'failed';

export interface FileModel {
  id: string;
  filename: string;
  stored_filename: string;
  category: FileCategory;
  mime_type: string;
  file_size: number;
  file_extension: string;
  storage_path: string;
  is_optimizable: boolean;
  optimized_versions: Record<string, string> | null;
  hash_sha256: string;
  is_validated: boolean;
  validation_status: ValidationStatus;
  uploaded_by_token: string | null;
  download_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFileInput {
  id: string;
  filename: string;
  stored_filename: string;
  category: FileCategory;
  mime_type: string;
  file_size: number;
  file_extension: string;
  storage_path: string;
  is_optimizable: boolean;
  hash_sha256: string;
  uploaded_by_token?: string;
}

export interface UpdateFileInput {
  is_validated?: boolean;
  validation_status?: ValidationStatus;
  optimized_versions?: Record<string, string>;
  download_count?: number;
}
