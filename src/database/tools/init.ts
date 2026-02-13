import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";

config();

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Get database configuration from environment
 */
function getDatabaseConfig(): DatabaseConfig {
  const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  return {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  };
}

/**
 * Create connection without database selection
 */
async function createBaseConnection(config: Omit<DatabaseConfig, "database">) {
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });
}

/**
 * Check if database exists
 */
async function databaseExists(
  connection: mysql.Connection,
  databaseName: string,
): Promise<boolean> {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
    [databaseName],
  );

  return rows.length > 0;
}

/**
 * Create database
 */
async function createDatabase(
  connection: mysql.Connection,
  databaseName: string,
): Promise<void> {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`✅ Database '${databaseName}' created successfully`);
}

/**
 * Get all SQL migration files
 */
async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = path.join(
    process.cwd(),
    "src",
    "database",
    "migrations",
  );

  try {
    const files = await fs.readdir(migrationsDir);
    return files.filter((file) => file.endsWith(".sql")).sort();
  } catch (error) {
    console.error(`❌ Error reading migrations directory: ${migrationsDir}`);
    throw error;
  }
}

/**
 * Execute SQL migration file
 */
async function executeMigration(
  connection: mysql.Connection,
  filePath: string,
  fileName: string,
): Promise<void> {
  try {
    const sql = await fs.readFile(filePath, "utf-8");

    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => {
        if (stmt.length === 0) return false;
        const lines = stmt.split("\n").filter((line) => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !trimmed.startsWith("--");
        });
        return lines.length > 0;
      });

    if (statements.length === 0) {
      console.log(`  ⚠ ${fileName} - No statements to execute`);
      return;
    }

    for (const statement of statements) {
      const cleanStatement = statement
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !trimmed.startsWith("--");
        })
        .join("\n")
        .trim();

      if (cleanStatement.length > 0) {
        try {
          await connection.query(cleanStatement);
        } catch (err) {
          console.error(`  Failed to execute statement from ${fileName}:`);
          console.error(`  Statement: ${cleanStatement.substring(0, 100)}...`);
          throw err;
        }
      }
    }

    console.log(`  ✓ ${fileName}`);
  } catch (error) {
    console.error(`  ✗ ${fileName} - Error:`, error);
    throw error;
  }
}

/**
 * Run all migrations
 */
async function runMigrations(
  connection: mysql.Connection,
  databaseName: string,
): Promise<void> {
  console.log("\n📋 Running database migrations...");

  await connection.query(`USE \`${databaseName}\``);

  const migrationFiles = await getMigrationFiles();

  if (migrationFiles.length === 0) {
    console.log("⚠️  No migration files found");
    return;
  }

  const migrationsDir = path.join(
    process.cwd(),
    "src",
    "database",
    "migrations",
  );

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    await executeMigration(connection, filePath, file);
  }

  console.log(`✅ All migrations completed (${migrationFiles.length} files)`);
}

/**
 * Verify database tables
 */
async function verifyTables(
  connection: mysql.Connection,
  databaseName: string,
): Promise<void> {
  // Select database (USE doesn't support prepared statements)
  await connection.query(`USE \`${databaseName}\``);

  const [tables] = await connection.query<mysql.RowDataPacket[]>("SHOW TABLES");

  console.log("\n📊 Database tables:");
  if (tables.length === 0) {
    console.log("  (no tables found)");
  } else {
    tables.forEach((row) => {
      const tableName = Object.values(row)[0];
      console.log(`  • ${tableName}`);
    });
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  console.log("🚀 Database Initialization Script\n");
  console.log("=".repeat(50));

  let connection: mysql.Connection | null = null;

  try {
    console.log("\n1️⃣  Loading configuration...");
    const dbConfig = getDatabaseConfig();
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Database: ${dbConfig.database}`);

    console.log("\n2️⃣  Connecting to MySQL server...");
    connection = await createBaseConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    console.log("✅ Connected to MySQL server");

    console.log(`\n3️⃣  Checking if database '${dbConfig.database}' exists...`);
    const exists = await databaseExists(connection, dbConfig.database);

    if (exists) {
      console.log(`✅ Database '${dbConfig.database}' already exists`);
    } else {
      console.log(`⚠️  Database '${dbConfig.database}' does not exist`);
      console.log(`\n4️⃣  Creating database '${dbConfig.database}'...`);
      await createDatabase(connection, dbConfig.database);
    }

    console.log(`\n5️⃣  Applying migrations to '${dbConfig.database}'...`);
    await runMigrations(connection, dbConfig.database);

    console.log(`\n6️⃣  Verifying database structure...`);
    await verifyTables(connection, dbConfig.database);

    console.log("\n" + "=".repeat(50));
    console.log("✅ Database initialization completed successfully!");
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n" + "=".repeat(50));
    console.error("❌ Database initialization failed!");
    console.error("=".repeat(50));

    if (error instanceof Error) {
      console.error("\nError:", error.message);

      if (error.message.includes("ECONNREFUSED")) {
        console.error("\n💡 Hint: Make sure MariaDB/MySQL server is running");
        console.error("   Windows: net start MariaDB");
        console.error("   Linux:   sudo systemctl start mariadb");
      } else if (error.message.includes("Access denied")) {
        console.error(
          "\n💡 Hint: Check your database credentials in .env file",
        );
      }
    } else {
      console.error("\nUnknown error:", error);
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed\n");
    }
  }
}

initializeDatabase();
