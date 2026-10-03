-- ====================================================================
-- V8__review_management.sql
-- LankaStay Hotels & Resorts - Review Management Module
-- ====================================================================

CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BINARY(16) NOT NULL,
    hotel_id BIGINT NOT NULL,
    reservation_id BIGINT NOT NULL,
    overall_rating TINYINT NOT NULL,
    cleanliness_rating TINYINT NULL,
    comfort_rating TINYINT NULL,
    staff_service_rating TINYINT NULL,
    facilities_rating TINYINT NULL,
    location_rating TINYINT NULL,
    value_for_money_rating TINYINT NULL,
    title VARCHAR(120) NOT NULL,
    comment TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    customer_updated_at TIMESTAMP(6) NULL,
    deleted_at TIMESTAMP(6) NULL,
    moderation_reason VARCHAR(100) NULL,
    moderation_note TEXT NULL,
    hidden_at TIMESTAMP(6) NULL,
    hidden_by_staff_id BINARY(16) NULL,
    management_response TEXT NULL,
    response_created_at TIMESTAMP(6) NULL,
    response_updated_at TIMESTAMP(6) NULL,
    response_by_staff_id BINARY(16) NULL,
    response_role VARCHAR(50) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_reviews_reservation UNIQUE (reservation_id),
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customer_users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE RESTRICT
);

CREATE TABLE review_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_review_photos_review FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE
);

CREATE INDEX idx_reviews_hotel_status_created ON reviews (hotel_id, status, created_at);
CREATE INDEX idx_reviews_customer_created ON reviews (customer_id, created_at);
CREATE INDEX idx_reviews_status ON reviews (status);
