-- Create upload_tokens table for single-use token authentication
CREATE TABLE IF NOT EXISTS upload_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token CHAR(64) NOT NULL UNIQUE,

    -- Token constraints
    allowed_category ENUM('image', 'video', 'document', 'audio', 'archive', 'any') DEFAULT 'any',
    max_file_size BIGINT UNSIGNED,
    max_uses INT UNSIGNED DEFAULT 1,
    current_uses INT UNSIGNED DEFAULT 0,

    -- Metadata
    created_by VARCHAR(100),
    metadata JSON,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_used BOOLEAN DEFAULT FALSE,

    -- Expiration
    expires_at TIMESTAMP NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,

    INDEX idx_token (token),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_used (is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
