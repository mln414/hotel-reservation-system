-- SE2030 LankaStay - Hotel Management
-- Functional Owner: Wickramasinghe M.P.T.H - IT25300115

CREATE TABLE hotels (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    destination_id BIGINT NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NULL,
    rating DOUBLE NOT NULL DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    main_image VARCHAR(500) NULL,
    badge VARCHAR(50) NULL,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE',
    setup_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    publication_status VARCHAR(30) NOT NULL DEFAULT 'INACTIVE',
    short_description TEXT NULL,
    detail_description TEXT NULL,
    tagline VARCHAR(255) NULL,
    check_in_time VARCHAR(20) DEFAULT '2:00 PM',
    check_out_time VARCHAR(20) DEFAULT '12:00 PM',
    address VARCHAR(255) NULL,
    latitude DOUBLE NULL,
    longitude DOUBLE NULL,
    year_opened INT NULL,
    property_size VARCHAR(50) NULL,
    languages VARCHAR(255) NULL,
    video_url VARCHAR(500) NULL,
    last_updated_section VARCHAR(50) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_hotels_slug UNIQUE (slug),
    INDEX idx_hotels_destination (destination_id),
    INDEX idx_hotels_status (status),
    INDEX idx_hotels_publication (publication_status)
);

CREATE TABLE hotel_facilities (
    hotel_id BIGINT NOT NULL,
    facility_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (hotel_id, facility_name),
    CONSTRAINT fk_hotel_facilities_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE hotel_gallery (
    hotel_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (hotel_id, image_url),
    CONSTRAINT fk_hotel_gallery_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE hotel_collections (
    hotel_id BIGINT NOT NULL,
    collection_id VARCHAR(100) NOT NULL,
    PRIMARY KEY (hotel_id, collection_id),
    CONSTRAINT fk_hotel_collections_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);
