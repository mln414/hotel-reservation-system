CREATE TABLE rooms (
    id BIGINT NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    room_category VARCHAR(50) NULL,
    description TEXT NULL,
    max_occupancy INT NULL,
    max_adults INT NULL,
    max_children INT NULL,
    size_sqm DOUBLE NULL,
    bed_type VARCHAR(50) NULL,
    inventory_count INT NOT NULL DEFAULT 0,
    base_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    main_image VARCHAR(500) NULL,
    amenities_json TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT uk_rooms_slug UNIQUE (slug),
    INDEX idx_rooms_hotel (hotel_id),
    INDEX idx_rooms_status (status)
);

CREATE TABLE amenities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NULL,
    icon VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT uk_amenities_name UNIQUE (name),
    INDEX idx_amenities_status (status)
);
