# Setup Guide - Fastify Telyubiz CDN

## Prerequisites

Before running the CDN, ensure you have:

1. **Bun** v1.0+ installed
2. **MariaDB** v10.6+ installed and running
3. **Git** (for cloning)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd fastify-telyubiz-cdn
bun install
```

### 2. Setup MariaDB Database

**Start MariaDB service** (if not running):
```bash
# Windows (as Administrator)
net start MariaDB

# Linux/Mac
sudo systemctl start mariadb
# or
sudo service mysql start
```

**Create database and user:**
```bash
mysql -u root -p
```

Run these SQL commands:
```sql
-- Create database
CREATE DATABASE fastify_cdn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (change password!)
CREATE USER 'cdn_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON fastify_cdn.* TO 'cdn_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` file and update these critical values:
```env
# Database Configuration - MUST MATCH YOUR MARIADB SETTINGS
DB_HOST=localhost
DB_PORT=3306
DB_USER=cdn_user
DB_PASSWORD=your_strong_password_here  # <- Change this!
DB_NAME=fastify_cdn

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Others can use defaults or customize as needed
```

### 4. Initialize Database (Automated)

**Option A: Using automated script (Recommended)**

Run the database initialization script that will:
- Check if database exists
- Create database if not exists
- Run all migrations automatically
- Verify table structure

```bash
bun run db:init
```

You should see:
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

**Option B: Manual migration (Advanced users)**

If you prefer manual control:
```bash
# Run all migrations in order
mysql -u cdn_user -p fastify_cdn < src/database/migrations/001_files_table.sql
mysql -u cdn_user -p fastify_cdn < src/database/migrations/002_tokens_table.sql
mysql -u cdn_user -p fastify_cdn < src/database/migrations/003_usage_log.sql
```

**Option C: Fresh Migration (Reset Database)**

⚠️ **WARNING**: This will DROP ALL TABLES and recreate them from scratch!

Use this command to completely reset your database (like Laravel's `migrate:fresh`):

```bash
bun run db:fresh
```

This will:
1. Drop all existing tables
2. Run all migrations from scratch
3. Verify the new structure

**When to use `db:fresh`:**
- During development when you need a clean slate
- After changing migration files
- When database structure is corrupted
- To reset all data (⚠️ ALL DATA WILL BE LOST!)

### 5. Verify Setup (Optional)

Test database connection:
```bash
mysql -u cdn_user -p -D fastify_cdn -e "SHOW TABLES;"
```

You should see:
```
+------------------------+
| Tables_in_fastify_cdn  |
+------------------------+
| files                  |
| token_usage_log        |
| upload_tokens          |
+------------------------+
```

### 6. Start Development Server

```bash
bun run dev
```

You should see:
```
✅ Configuration loaded
✅ External plugins registered
✅ Internal plugins registered
✅ Database connected successfully
✅ Storage directories initialized
✅ V1 API routes registered

🚀 =====================================
   Fastify Telyubiz CDN Server
   =====================================
   Environment: development
   Server:      http://0.0.0.0:3000
   Health:      http://0.0.0.0:3000/v1/health
   =====================================
```

### 7. Test the API

**Health check:**
```bash
curl http://localhost:3000/v1/health
```

**Generate upload token:**
```bash
curl -X POST http://localhost:3000/v1/auth/token/generate \
  -H "Content-Type: application/json" \
  -d '{"category":"image","expiresIn":3600}'
```

**Upload file** (use token from previous step):
```bash
curl -X POST http://localhost:3000/v1/cdn/upload \
  -H "X-Upload-Token: YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/image.jpg"
```

## Common Issues

### Error: "Access denied for user 'cdn_user'@'localhost'"

**Problem:** Database credentials in `.env` don't match MariaDB

**Solution:**
1. Verify MariaDB user exists: `mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User='cdn_user';"`
2. Reset password if needed:
   ```sql
   ALTER USER 'cdn_user'@'localhost' IDENTIFIED BY 'new_password';
   FLUSH PRIVILEGES;
   ```
3. Update `.env` with correct password

### Error: "Cannot find module '@fastify/env'"

**Problem:** Dependencies not installed

**Solution:**
```bash
bun install
```

### Error: "Port 3000 already in use"

**Problem:** Another service is using port 3000

**Solution:**
- Change `PORT=3000` in `.env` to another port (e.g., `PORT=3001`)
- Or stop the conflicting service

### Error: "Database connection failed: ECONNREFUSED"

**Problem:** MariaDB is not running

**Solution:**
```bash
# Windows
net start MariaDB

# Linux/Mac
sudo systemctl start mariadb
```

## Production Deployment

For production, ensure:

1. Change `NODE_ENV=production` in `.env`
2. Use strong passwords for database
3. Configure proper `ALLOWED_ORIGINS` for CORS
4. Enable HTTPS/TLS
5. Set up proper firewall rules
6. Use process manager (PM2, systemd)
7. Configure reverse proxy (nginx, Caddy)

Example with PM2:
```bash
bun run build
pm2 start dist/app.js --name cdn-server
pm2 save
```

## Next Steps

- Read the main [README.md](README.md) for API documentation
- Configure file categories in `src/config/file-categories.config.ts`
- Customize security settings in `.env`
- Set up monitoring and logging

## Support

If you encounter issues not covered here:
1. Check the error logs in console
2. Verify database connection manually
3. Ensure all dependencies are installed
4. Open an issue on GitHub with error details
