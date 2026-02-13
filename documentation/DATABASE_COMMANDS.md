# Database Commands Guide

## Available Commands

### 1. `bun run db:init` - Initialize Database

**Purpose**: Setup database for the first time or run new migrations

**What it does:**
1. ✅ Connects to MySQL server
2. ✅ Checks if database exists
3. ✅ Creates database if not exists
4. ✅ Runs all migration files
5. ✅ Verifies table structure

**When to use:**
- First time setup
- Running new migration files on existing database
- Production deployments
- When database doesn't exist yet

**Safe to use:** ✅ Yes - Won't delete existing data

---

### 2. `bun run db:fresh` - Fresh Migration (Reset)

**Purpose**: Completely reset database like Laravel's `migrate:fresh`

**What it does:**
1. ⚠️  **DROPS ALL TABLES** in the database
2. ✅ Runs all migrations from scratch
3. ✅ Verifies new table structure

**When to use:**
- 🔧 Development: Need a clean slate
- 🔧 Changed migration files
- 🔧 Database structure corrupted
- 🔧 Testing with fresh data

**Safe to use:** ⚠️ **NO - ALL DATA WILL BE LOST!**

---

## Comparison Table

| Feature | `db:init` | `db:fresh` |
|---------|-----------|------------|
| Creates database if not exists | ✅ Yes | ❌ No (database must exist) |
| Drops existing tables | ❌ No | ✅ **YES - ALL TABLES** |
| Runs migrations | ✅ Yes | ✅ Yes |
| Safe for production | ✅ Yes | ⚠️ **NEVER!** |
| Preserves existing data | ✅ Yes | ❌ **NO - DELETES ALL** |
| Good for first setup | ✅ Yes | ✅ Yes |
| Good for updates | ✅ Yes | ❌ No (use migrations) |

---

## Usage Examples

### First Time Setup

```bash
# Step 1: Configure .env
cp .env.example .env
nano .env  # Edit database credentials

# Step 2: Initialize database
bun run db:init
```

**Expected Output:**
```
🚀 Database Initialization Script
==================================================

1️⃣  Loading configuration...
   Host: localhost:3306
   User: cdn_user
   Database: fastify_cdn

2️⃣  Connecting to MySQL server...
✅ Connected to MySQL server

3️⃣  Checking if database 'fastify_cdn' exists...
⚠️  Database 'fastify_cdn' does not exist

4️⃣  Creating database 'fastify_cdn'...
✅ Database 'fastify_cdn' created successfully

📋 Running database migrations...
  ✓ 001_files_table.sql
  ✓ 002_tokens_table.sql
  ✓ 003_usage_log.sql
✅ All migrations completed (3 files)

6️⃣  Verifying database structure...

📊 Database tables:
  • files
  • token_usage_log
  • upload_tokens

==================================================
✅ Database initialization completed successfully!
==================================================
```

---

### Reset Database (Development)

```bash
# ⚠️ WARNING: This will DELETE ALL DATA!
bun run db:fresh
```

**Expected Output:**
```
🔄 Database Fresh Migration (Laravel-style)

==================================================
⚠️  WARNING: This will DROP ALL TABLES and recreate them!
==================================================

1️⃣  Loading configuration...
   Host: localhost:3306
   User: cdn_user
   Database: fastify_cdn

2️⃣  Connecting to database...
✅ Connected to database

3️⃣  Dropping all existing tables...

🗑️  Dropping all tables...
  ✓ Dropped table: files
  ✓ Dropped table: upload_tokens
  ✓ Dropped table: token_usage_log
✅ All tables dropped (3 tables)

4️⃣  Running migrations from scratch...

📋 Running database migrations...
  ✓ 001_files_table.sql
  ✓ 002_tokens_table.sql
  ✓ 003_usage_log.sql
✅ All migrations completed (3 files)

5️⃣  Verifying database structure...

📊 Database tables:
  • files
  • token_usage_log
  • upload_tokens

==================================================
✅ Database fresh migration completed successfully!
==================================================
```

---

## Common Scenarios

### Scenario 1: Database Already Exists

**Use:** `bun run db:init`

This will skip database creation and only run migrations that haven't been run yet.

### Scenario 2: Changed Migration Files

**Development:** `bun run db:fresh` ⚠️ (resets everything)

**Production:** Create new migration files and run `bun run db:init`

### Scenario 3: Corrupted Database

```bash
# Option A: Drop database manually and recreate
mysql -u root -p -e "DROP DATABASE fastify_cdn;"
bun run db:init

# Option B: Use fresh (easier but requires database to exist)
bun run db:fresh
```

### Scenario 4: Testing

```bash
# Start fresh for each test run
bun run db:fresh
bun run test
```

---

## Error Handling

### Error: "Unknown database"

When running `db:fresh`:

```bash
# Fix: Create database first
mysql -u root -p -e "CREATE DATABASE fastify_cdn;"
# Then run fresh
bun run db:fresh
```

Or use `db:init` instead:
```bash
bun run db:init
```

### Error: "Access denied"

```bash
# Check credentials in .env
cat .env | grep DB_

# Test connection manually
mysql -h localhost -u cdn_user -p
```

### Error: "Connection refused"

```bash
# Start MariaDB/MySQL
# Windows:
net start MariaDB

# Linux:
sudo systemctl start mariadb
```

---

## Best Practices

### ✅ DO:

- Use `db:init` for production deployments
- Use `db:fresh` during development
- Backup production data before any database operations
- Test migrations locally before deploying
- Keep migration files in version control

### ❌ DON'T:

- **NEVER** use `db:fresh` in production
- Don't modify existing migration files (create new ones)
- Don't skip backups
- Don't commit `.env` file to git

---

## Quick Reference

```bash
# Initialize (safe, keeps data)
bun run db:init

# Reset (⚠️ deletes everything)
bun run db:fresh

# Development server
bun run dev

# Check database manually
mysql -u cdn_user -p fastify_cdn
> SHOW TABLES;
> DESCRIBE files;
> SELECT COUNT(*) FROM files;
```
