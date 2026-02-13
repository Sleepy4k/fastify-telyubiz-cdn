import mysql from "mysql2/promise";
import type { FastifyInstance } from "fastify";
import { getDatabaseConfig } from "../config/database.config.ts";

let pool: mysql.Pool | null = null;

export async function createDatabasePool(
  fastify: FastifyInstance,
): Promise<mysql.Pool> {
  if (pool) {
    return pool;
  }

  const dbConfig = getDatabaseConfig(fastify.config);

  pool = mysql.createPool(dbConfig);

  try {
    const connection = await pool.getConnection();
    fastify.log.info("✅ Database connected successfully");
    connection.release();
  } catch (error: any) {
    fastify.log.error("❌ Database connection failed:", error);
    throw error;
  }

  return pool;
}

export function getDatabasePool(): mysql.Pool {
  if (!pool) {
    throw new Error(
      "Database pool not initialized. Call createDatabasePool first.",
    );
  }
  return pool;
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
