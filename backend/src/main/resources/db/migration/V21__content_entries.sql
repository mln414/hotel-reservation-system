CREATE TABLE content_entries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    content_type VARCHAR(64) NOT NULL,
    content_key VARCHAR(160) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    display_order INT NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_content_type_key UNIQUE (content_type, content_key),
    INDEX idx_content_type_status_order (content_type, status, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
