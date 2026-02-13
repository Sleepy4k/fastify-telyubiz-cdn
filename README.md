# Fastify Telyubiz CDN

Production-ready, scalable Content Delivery Network (CDN) built with Fastify, featuring secure file upload with single-use tokens, multi-layer validation, malware scanning, and automatic image optimization.

## ✨ Features

### Security
- **Single-Use Token Authentication** - Dynamic token generation for secure uploads
- **Multi-Layer File Validation** - Extension whitelist, MIME verification, path traversal prevention
- **Malware Scanning** - Code injection detection, executable pattern matching
- **File Deduplication** - SHA256 hash-based duplicate detection
- **Rate Limiting** - DDoS protection with configurable limits

### File Management
- **Category-Based Organization** - Images, videos, documents, audio, archives
- **Different Size Limits** - Per-category maximum file size
- **Auto-Optimization** - WebP conversion for images with caching
- **Public CDN Access** - No authentication required for downloads

### Architecture
- **Plugin-Based** - Modular internal and external plugins
- **API Versioning** - v1/v2/v3 support for backward compatibility
- **Database Integration** - MariaDB for metadata and token storage
- **Scalable Structure** - Ready for horizontal scaling

## 🚀 Quick Start

### Prerequisites
- **Bun** runtime installed
- **MariaDB** 10.6+ server
- **Node.js** 18+ (for some dependencies)

### Installation

1. **Clone and install dependencies:**
```bash
cd fastify-telyubiz-cdn
bun install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Create MariaDB database:**
```sql
CREATE DATABASE fastify_cdn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cdn_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON fastify_cdn.* TO 'cdn_user'@'localhost';
FLUSH PRIVILEGES;
```

4. **Run database migrations:**
```bash
# Connect to MariaDB and run migrations
mysql -u cdn_user -p fastify_cdn < src/database/migrations/001_files_table.sql
mysql -u cdn_user -p fastify_cdn < src/database/migrations/002_tokens_table.sql
mysql -u cdn_user -p fastify_cdn < src/database/migrations/003_usage_log.sql
```

5. **Start development server:**
```bash
bun run dev
```

Server will start at `http://localhost:3000`

## 📖 API Usage

### 1. Generate Upload Token

**Request:**
```bash
curl -X POST http://localhost:3000/v1/token/generate \
  -H "Content-Type: application/json" \
  -d '{
    "category": "image",
    "maxFileSize": 10485760,
    "expiresIn": 3600
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "a7b2c3d4e5f6...",
  "expiresAt": "2026-02-13T16:30:00Z",
  "restrictions": {
    "category": "image",
    "maxFileSize": 10485760,
    "maxUses": 1
  }
}
```

### 2. Upload File

**Request:**
```bash
curl -X POST http://localhost:3000/v1/upload \
  -H "X-Upload-Token: YOUR_TOKEN_HERE" \
  -F "file=@image.jpg"
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "uuid",
    "url": "/v1/files/uuid",
    "directUrl": "/v1/files/stored-filename.jpg",
    "filename": "image.jpg",
    "size": 1048576,
    "mimeType": "image/jpeg",
    "category": "image",
    "hash": "sha256hash"
  }
}
```

### 3. Download/View File

**Original:**
```
GET http://localhost:3000/v1/files/{id}
```

**Optimized (Images):**
```
GET http://localhost:3000/v1/files/{id}?w=500&q=80&format=webp
```

**Query Parameters:**
- `w` - Width in pixels
- `h` - Height in pixels
- `q` - Quality 1-100 (default: 80)
- `format` - Output format: webp, jpeg, png, avif

## 🗂️ File Categories & Limits

| Category | Extensions | Max Size | Optimization |
|----------|-----------|----------|--------------|
| **Image** | jpg, png, gif, webp, svg, bmp | 10 MB | ✅ WebP |
| **Video** | mp4, webm, mov, avi, mkv | 500 MB | 🔄 Future |
| **Document** | pdf, doc, docx, xls, xlsx, ppt | 20 MB | ❌ No |
| **Audio** | mp3, wav, ogg, m4a, flac | 50 MB | ❌ No |
| **Archive** | zip, tar, gz, 7z, rar | 100 MB | ❌ No |

## 🔒 Security Features

### Upload Protection
- ✅ Single-use token system (token invalid after use)
- ✅ Token expiration support
- ✅ Category restriction per token
- ✅ File size limit per token

### File Validation (5 Layers)
1. **Extension Whitelist** - Only allowed file types
2. **MIME Type Verification** - Detect actual file type from buffer
3. **File Size Limits** - Category-specific maximum sizes
4. **Malware Scanning** - Detect PHP/ASP code, script injection, executable patterns
5. **Image Integrity** - Validate image files with Sharp

### Additional Security
- Path traversal prevention
- SQL injection protection (parameterized queries)
- XSS prevention
- CORS configuration
- Helmet security headers
- Rate limiting

## 📂 Project Structure

```
src/
├── config/                             # Configuration
│   ├── index.ts                        # Config loader with validation
│   ├── database.config.ts              # Database settings
│   └── file-categories.config.ts       # File type rules
│
├── plugins/
│   ├── internal/                       # Custom plugins
│   │   ├── database.plugin.ts
│   │   ├── auth.plugin.ts
│   │   └── error-handler.plugin.ts
│   │
│   └── external/                       # Ecosystem plugins
│       ├── multipart.plugin.ts
│       ├── cors.plugin.ts
│       └── rate-limit.plugin.ts
│
├── database/
│   ├── connection.ts                   # MariaDB pool
│   ├── migrations/                     # SQL schemas
│   ├── repositories/                   # Data access
│   ├── tools/                          # DB scripts (init, fresh)
│   └── models/                         # TypeScript types
│
├── modules/
│   └── v1/                             # API v1
│       ├── routes/
│       ├── controllers/
│       └── services/
│
└── shared/                             # Shared utilities
    ├── services/                       # Business logic
    ├── utils/                          # Helpers
    ├── middleware/                     # Express-like middleware
    └── constants/                      # Constants & errors
```

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=cdn_user
DB_PASSWORD=your_password
DB_NAME=fastify_cdn

# Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=100

# Security
ENABLE_RATE_LIMIT=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
ENABLE_CORS=true
ALLOWED_ORIGINS=http://localhost:3000

# Token
TOKEN_DEFAULT_EXPIRY=3600
TOKEN_LENGTH=32

# Validation
ENABLE_MALWARE_SCAN=true
ENABLE_MIME_VERIFICATION=true
```

## 🚦 API Endpoints

### Health Check
```
GET /v1/health
```

### Authentication
```
POST /v1/token/generate - Generate upload token
```

### CDN Operations
```
POST /v1/upload       - Upload file (requires token)
GET  /v1/files/:id    - Download/view file (public)
```

## 📜 Scripts

```bash
# Development (with hot reload)
bun run dev

# Production start
bun run start

# Build (optional)
bun run build

# Database commands
bun run db:init    # Initialize database and run migrations
bun run db:fresh   # ⚠️  Drop all tables and run migrations (resets everything)
```

## 🎯 Future Enhancements (v2)

- Video optimization (transcoding, thumbnails)
- Document preview generation
- Batch upload support
- Admin dashboard
- CDN statistics API
- S3-compatible storage backend
- WebSocket upload progress
- Multi-region replication

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📧 Support

For issues and questions, please use GitHub Issues.

---

Built with ❤️ using Fastify, Bun, and MariaDB
