import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getDatabasePool } from "../connection.ts";
import type {
  FileModel,
  CreateFileInput,
  UpdateFileInput,
} from "../models/file.model.ts";

export class FileRepository {
  /**
   * Create a new file record in database
   */
  async create(input: CreateFileInput): Promise<FileModel> {
    const pool = getDatabasePool();

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO files (
        id, filename, stored_filename, category, mime_type,
        file_size, file_extension, storage_path, is_optimizable,
        hash_sha256, uploaded_by_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.filename,
        input.stored_filename,
        input.category,
        input.mime_type,
        input.file_size,
        input.file_extension,
        input.storage_path,
        input.is_optimizable,
        input.hash_sha256,
        input.uploaded_by_token || null,
      ],
    );

    const created = await this.findById(input.id);
    if (!created) {
      throw new Error("Failed to create file record");
    }

    return created;
  }

  /**
   * Find file by ID
   */
  async findById(id: string): Promise<FileModel | null> {
    const pool = getDatabasePool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM files WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(rows[0]!);
  }

  /**
   * Find file by stored filename
   */
  async findByStoredFilename(
    storedFilename: string,
  ): Promise<FileModel | null> {
    const pool = getDatabasePool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM files WHERE stored_filename = ?",
      [storedFilename],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(rows[0]!);
  }

  /**
   * Find file by SHA256 hash (for deduplication)
   */
  async findByHash(hash: string): Promise<FileModel | null> {
    const pool = getDatabasePool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM files WHERE hash_sha256 = ? AND is_validated = TRUE AND validation_status = ?",
      [hash, "safe"],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(rows[0]!);
  }

  /**
   * Update file record
   */
  async update(id: string, input: UpdateFileInput): Promise<FileModel | null> {
    const pool = getDatabasePool();

    const updates: string[] = [];
    const values: any[] = [];

    if (input.is_validated !== undefined) {
      updates.push("is_validated = ?");
      values.push(input.is_validated);
    }

    if (input.validation_status !== undefined) {
      updates.push("validation_status = ?");
      values.push(input.validation_status);
    }

    if (input.optimized_versions !== undefined) {
      updates.push("optimized_versions = ?");
      values.push(JSON.stringify(input.optimized_versions));
    }

    if (input.download_count !== undefined) {
      updates.push("download_count = ?");
      values.push(input.download_count);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE files SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id: string): Promise<void> {
    const pool = getDatabasePool();

    await pool.execute(
      "UPDATE files SET download_count = download_count + 1 WHERE id = ?",
      [id],
    );
  }

  /**
   * Delete file record
   */
  async delete(id: string): Promise<boolean> {
    const pool = getDatabasePool();

    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM files WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  /**
   * Get all files by category
   */
  async findByCategory(
    category: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<FileModel[]> {
    const pool = getDatabasePool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM files WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [category, limit, offset],
    );

    return rows.map((row) => this.mapRowToModel(row));
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    by_category: Record<string, number>;
    total_size: number;
  }> {
    const pool = getDatabasePool();

    const [countRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as total, SUM(file_size) as total_size FROM files",
    );

    const [categoryRows] = await pool.execute<RowDataPacket[]>(
      "SELECT category, COUNT(*) as count FROM files GROUP BY category",
    );

    const by_category: Record<string, number> = {};
    for (const row of categoryRows) {
      by_category[row.category] = row.count;
    }

    return {
      total: countRows[0]!.total,
      by_category,
      total_size: countRows[0]!.total_size || 0,
    };
  }

  /**
   * Map database row to FileModel
   */
  private mapRowToModel(row: RowDataPacket): FileModel {
    return {
      id: row.id,
      filename: row.filename,
      stored_filename: row.stored_filename,
      category: row.category,
      mime_type: row.mime_type,
      file_size: row.file_size,
      file_extension: row.file_extension,
      storage_path: row.storage_path,
      is_optimizable: Boolean(row.is_optimizable),
      optimized_versions: row.optimized_versions
        ? JSON.parse(row.optimized_versions)
        : null,
      hash_sha256: row.hash_sha256,
      is_validated: Boolean(row.is_validated),
      validation_status: row.validation_status,
      uploaded_by_token: row.uploaded_by_token,
      download_count: row.download_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
