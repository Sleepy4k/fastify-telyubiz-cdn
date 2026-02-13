import type { FileCategory } from '../../config/file-categories.config.ts';

export type TokenCategory = FileCategory | 'any';
export type TokenStatus = 'success' | 'failed' | 'rejected';

export interface UploadTokenModel {
  id: number;
  token: string;
  allowed_category: TokenCategory;
  max_file_size: number | null;
  max_uses: number;
  current_uses: number;
  created_by: string | null;
  metadata: Record<string, any> | null;
  is_active: boolean;
  is_used: boolean;
  expires_at: Date | null;
  created_at: Date;
  used_at: Date | null;
}

export interface CreateTokenInput {
  token: string;
  allowed_category?: TokenCategory;
  max_file_size?: number;
  max_uses?: number;
  created_by?: string;
  metadata?: Record<string, any>;
  expires_at?: Date;
}

export interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  token?: UploadTokenModel;
}

export interface TokenUsageLogModel {
  id: number;
  token_id: number;
  file_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: TokenStatus;
  error_message: string | null;
  created_at: Date;
}

export interface CreateTokenUsageLog {
  token_id: number;
  file_id?: string;
  ip_address?: string;
  user_agent?: string;
  status: TokenStatus;
  error_message?: string;
}
