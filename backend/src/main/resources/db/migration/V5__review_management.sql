-- SE2030 LankaStay - Customer Review Management and Moderation Schema
-- Functional Owner: Customer Review Management and Moderation

CREATE TABLE reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    customer_id BINARY(16) NULL,
    reservation_id BIGINT NULL,
    guest_name VARCHAR(150) NOT NULL,
    guest_email VARCHAR(150) NOT NULL,
    rating DOUBLE NOT NULL,
    cleanliness_rating DOUBLE NULL,
    staff_rating DOUBLE NULL,
    facilities_rating DOUBLE NULL,
    location_rating DOUBLE NULL,
    value_rating DOUBLE NULL,
    title VARCHAR(200) NOT NULL,
    comment TEXT NOT NULL,
    trip_type VARCHAR(50) NULL,
    room_type VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    moderation_note VARCHAR(500) NULL,
    moderated_by BINARY(16) NULL,
    moderated_at TIMESTAMP(6) NULL,
    is_verified_stay BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_count INT NOT NULL DEFAULT 0,
    management_reply TEXT NULL,
    replied_by BINARY(16) NULL,
    replied_by_name VARCHAR(100) NULL,
    replied_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_reviews_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customer_users(id) ON DELETE SET NULL,
    CONSTRAINT fk_reviews_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
    CONSTRAINT fk_reviews_moderated_by FOREIGN KEY (moderated_by) REFERENCES staff_users(id) ON DELETE SET NULL,
    CONSTRAINT fk_reviews_replied_by FOREIGN KEY (replied_by) REFERENCES staff_users(id) ON DELETE SET NULL,
    INDEX idx_reviews_hotel_status (hotel_id, status),
    INDEX idx_reviews_status (status),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_created_at (created_at)
);

CREATE TABLE review_images (
    review_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (review_id, image_url),
    CONSTRAINT fk_review_images_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);
