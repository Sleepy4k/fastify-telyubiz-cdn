-- Create token_usage_log table for audit trail
CREATE TABLE IF NOT EXISTS token_usage_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_id INT NOT NULL,
    file_id CHAR(36),

    ip_address VARCHAR(45),
    user_agent VARCHAR(500),

    status ENUM('success', 'failed', 'rejected') NOT NULL,
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (token_id) REFERENCES upload_tokens(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,

    INDEX idx_token_id (token_id),
    INDEX idx_file_id (file_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
