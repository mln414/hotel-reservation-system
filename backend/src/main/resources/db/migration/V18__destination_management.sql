CREATE TABLE IF NOT EXISTS destinations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    short_description VARCHAR(255) NOT NULL,
    full_description TEXT NULL,
    category VARCHAR(100) NULL,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    main_image VARCHAR(500) NULL,
    card_image_position VARCHAR(50) DEFAULT 'center center',
    hero_image_position VARCHAR(50) DEFAULT 'center center',
    hero_fit_mode VARCHAR(50) DEFAULT 'cover',
    last_saved_step INT DEFAULT 1,
    last_completed_step INT DEFAULT 0,
    last_updated_section VARCHAR(100) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT uk_destinations_slug UNIQUE (slug),
    INDEX idx_destinations_status (status),
    INDEX idx_destinations_region (region),
    INDEX idx_destinations_district (district)
);

CREATE TABLE IF NOT EXISTS attractions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    destination_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    short_description TEXT NULL,
    latitude DOUBLE NULL,
    longitude DOUBLE NULL,
    image VARCHAR(500) NULL,
    estimated_travel_time VARCHAR(50) NULL,
    source VARCHAR(50) NULL,
    source_id VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),
    INDEX idx_attractions_destination (destination_id),
    INDEX idx_attractions_status (status),

    CONSTRAINT fk_attractions_destination
        FOREIGN KEY (destination_id)
        REFERENCES destinations(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS destinations_theme_keys (
    destination_id BIGINT NOT NULL,
    theme_key VARCHAR(50) NOT NULL,

    INDEX idx_destination_theme_keys_destination (destination_id),

    CONSTRAINT fk_destination_theme_keys_destination
        FOREIGN KEY (destination_id)
        REFERENCES destinations(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS destinations_highlights (
    destination_id BIGINT NOT NULL,
    highlight VARCHAR(255) NOT NULL,

    INDEX idx_destination_highlights_destination (destination_id),

    CONSTRAINT fk_destination_highlights_destination
        FOREIGN KEY (destination_id)
        REFERENCES destinations(id)
        ON DELETE CASCADE
);
