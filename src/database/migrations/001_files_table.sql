-- Create files table for storing file metadata
CREATE TABLE IF NOT EXISTS files (
    id CHAR(36) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    category ENUM('image', 'video', 'document', 'audio', 'archive', 'other') NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,
    file_extension VARCHAR(20) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,

    -- Optimization metadata
    is_optimizable BOOLEAN DEFAULT FALSE,
    optimized_versions JSON,

    -- Security
    hash_sha256 CHAR(64) NOT NULL UNIQUE,
    is_validated BOOLEAN DEFAULT FALSE,
    validation_status ENUM('pending', 'safe', 'malicious', 'failed') DEFAULT 'pending',

    -- Tracking
    uploaded_by_token CHAR(64),
    download_count INT UNSIGNED DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category (category),
    INDEX idx_hash (hash_sha256),
    INDEX idx_created_at (created_at),
    INDEX idx_stored_filename (stored_filename),
    INDEX idx_validation_status (validation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
