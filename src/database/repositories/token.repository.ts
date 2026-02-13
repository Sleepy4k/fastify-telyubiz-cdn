import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getDatabasePool } from "../connection.ts";
import type {
  UploadTokenModel,
  CreateTokenInput,
  TokenValidationResult,
  CreateTokenUsageLog,
  TokenUsageLogModel,
} from "../models/token.model.ts";

export class TokenRepository {
  /**
   * Create a new upload token
   */
  async create(input: CreateTokenInput): Promise<UploadTokenModel> {
    const pool = getDatabasePool();

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO upload_tokens (
        token, allowed_category, max_file_size, max_uses,
        created_by, metadata, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.token,
        input.allowed_category || "any",
        input.max_file_size || null,
        input.max_uses || 1,
        input.created_by || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.expires_at || null,
      ],
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error("Failed to create token");
    }

    return created;
  }

  /**
   * Find token by ID
   */
  async findById(id: number): Promise<UploadTokenModel | null> {
    const pool = getDatabasePool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM upload_tokens WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(rows[0]!);
  }

  /**
   * Find token by token string
   */
  async findByToken(token: string): Promise<UploadTokenModel | null> {
    const pool = getDatabasePool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM upload_tokens WHERE token = ?",
      [token],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(rows[0]!);
  }

  /**
   * Validate token and check all constraints
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    const tokenData = await this.findByToken(token);

    if (!tokenData) {
      return {
        valid: false,
        reason: "Token not found",
      };
    }

    if (!tokenData.is_active) {
      return {
        valid: false,
        reason: "Token is not active",
        token: tokenData,
      };
    }

    if (tokenData.current_uses >= tokenData.max_uses) {
      return {
        valid: false,
        reason: "Token has reached maximum usage limit",
        token: tokenData,
      };
    }

    if (tokenData.is_used && tokenData.max_uses === 1) {
      return {
        valid: false,
        reason: "Token has already been used",
        token: tokenData,
      };
    }

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return {
        valid: false,
        reason: "Token has expired",
        token: tokenData,
      };
    }

    return {
      valid: true,
      token: tokenData,
    };
  }

  /**
   * Mark token as used and increment usage count
   */
  async markAsUsed(id: number): Promise<void> {
    const pool = getDatabasePool();

    await pool.execute(
      `UPDATE upload_tokens
       SET is_used = TRUE, used_at = CURRENT_TIMESTAMP, current_uses = current_uses + 1
       WHERE id = ?`,
      [id],
    );
  }

  /**
   * Increment token usage count without marking as used
   */
  async incrementUsageCount(id: number): Promise<void> {
    const pool = getDatabasePool();

    await pool.execute(
      "UPDATE upload_tokens SET current_uses = current_uses + 1 WHERE id = ?",
      [id],
    );
  }

  /**
   * Deactivate token
   */
  async deactivate(id: number): Promise<void> {
    const pool = getDatabasePool();

    await pool.execute(
      "UPDATE upload_tokens SET is_active = FALSE WHERE id = ?",
      [id],
    );
  }

  /**
   * Log token usage
   */
  async logUsage(log: CreateTokenUsageLog): Promise<void> {
    const pool = getDatabasePool();

    await pool.execute(
      `INSERT INTO token_usage_log (
        token_id, file_id, ip_address, user_agent, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        log.token_id,
        log.file_id || null,
        log.ip_address || null,
        log.user_agent || null,
        log.status,
        log.error_message || null,
      ],
    );
  }

  /**
   * Get token usage history
   */
  async getUsageHistory(
    tokenId: number,
    limit: number = 100,
  ): Promise<TokenUsageLogModel[]> {
    const pool = getDatabasePool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM token_usage_log
       WHERE token_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [tokenId, limit],
    );

    return rows.map((row) => this.mapUsageLogRowToModel(row));
  }

  /**
   * Delete expired tokens (cleanup utility)
   */
  async deleteExpiredTokens(): Promise<number> {
    const pool = getDatabasePool();

    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM upload_tokens
       WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP`,
    );

    return result.affectedRows;
  }

  /**
   * Get token statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    used: number;
    expired: number;
  }> {
    const pool = getDatabasePool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as expired
       FROM upload_tokens`,
    );

    return {
      total: rows[0]!.total,
      active: rows[0]!.active,
      used: rows[0]!.used,
      expired: rows[0]!.expired,
    };
  }

  /**
   * Map database row to UploadTokenModel
   */
  private mapRowToModel(row: RowDataPacket): UploadTokenModel {
    return {
      id: row.id,
      token: row.token,
      allowed_category: row.allowed_category,
      max_file_size: row.max_file_size,
      max_uses: row.max_uses,
      current_uses: row.current_uses,
      created_by: row.created_by,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      is_active: Boolean(row.is_active),
      is_used: Boolean(row.is_used),
      expires_at: row.expires_at,
      created_at: row.created_at,
      used_at: row.used_at,
    };
  }

  /**
   * Map usage log row to TokenUsageLogModel
   */
  private mapUsageLogRowToModel(row: RowDataPacket): TokenUsageLogModel {
    return {
      id: row.id,
      token_id: row.token_id,
      file_id: row.file_id,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      status: row.status,
      error_message: row.error_message,
      created_at: row.created_at,
    };
  }
}
