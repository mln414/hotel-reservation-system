-- =====================================================================
-- LankaStay Hotels & Resorts
-- V7__rate_and_offer_management.sql
-- Rate Model Enhancement, Offer Tables, and Reservation Discount Snapshots
-- =====================================================================

-- 1. Enhance room_rates table: convert money types and add rate configuration fields
ALTER TABLE room_rates
    MODIFY COLUMN base_nightly_rate DECIMAL(14,2) NOT NULL,
    MODIFY COLUMN weekend_nightly_rate DECIMAL(14,2) NULL,
    MODIFY COLUMN deposit_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN rate_type VARCHAR(50) NOT NULL DEFAULT 'BASE',
    ADD COLUMN pricing_method VARCHAR(50) NOT NULL DEFAULT 'SET_PRICE',
    ADD COLUMN valid_from DATE NULL,
    ADD COLUMN valid_to DATE NULL,
    ADD COLUMN minimum_stay INT NOT NULL DEFAULT 1,
    ADD COLUMN applicable_days VARCHAR(100) NULL,
    ADD COLUMN notes TEXT NULL;

CREATE INDEX idx_room_rates_validity ON room_rates (room_id, status, valid_from, valid_to);
CREATE INDEX idx_room_rates_plan_code ON room_rates (hotel_id, room_id, rate_plan_code);

-- 2. Create offers table
CREATE TABLE IF NOT EXISTS offers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    slug VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    short_description VARCHAR(500) NOT NULL,
    full_description TEXT NOT NULL,
    discount_type VARCHAR(30) NOT NULL,
    discount_value DECIMAL(14,2) NOT NULL,
    fixed_discount_scope VARCHAR(30) NULL DEFAULT 'PER_STAY',
    stay_start_date DATE NOT NULL,
    stay_end_date DATE NOT NULL,
    booking_start_date DATE NULL,
    booking_end_date DATE NULL,
    minimum_stay INT NOT NULL DEFAULT 1,
    maximum_stay INT NULL,
    applicable_days VARCHAR(100) NOT NULL DEFAULT 'MON,TUE,WED,THU,FRI,SAT,SUN',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    image VARCHAR(500) NULL,
    terms_json TEXT NULL,
    target_room_category_keys VARCHAR(255) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE INDEX uq_offers_slug (slug),
    INDEX idx_offers_status (status),
    INDEX idx_offers_stay_dates (stay_start_date, stay_end_date),
    INDEX idx_offers_booking_dates (booking_start_date, booking_end_date)
);

-- 3. Create offer_hotels targeting table
CREATE TABLE IF NOT EXISTS offer_hotels (
    offer_id BIGINT NOT NULL,
    hotel_id BIGINT NOT NULL,
    PRIMARY KEY (offer_id, hotel_id),
    CONSTRAINT fk_offer_hotels_offer FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_hotels_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
    INDEX idx_offer_hotels_hotel (hotel_id)
);

-- 4. Create offer_rooms targeting table
CREATE TABLE IF NOT EXISTS offer_rooms (
    offer_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    PRIMARY KEY (offer_id, room_id),
    CONSTRAINT fk_offer_rooms_offer FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_rooms_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    INDEX idx_offer_rooms_room (room_id)
);

-- 5. Add discount and offer snapshot columns to reservations
ALTER TABLE reservations
    ADD COLUMN subtotal_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN applied_offer_id BIGINT NULL,
    ADD COLUMN offer_title_snapshot VARCHAR(200) NULL,
    ADD COLUMN discount_type_snapshot VARCHAR(30) NULL,
    ADD COLUMN discount_value_snapshot DECIMAL(14,2) NULL,
    ADD CONSTRAINT fk_reservations_offer FOREIGN KEY (applied_offer_id) REFERENCES offers (id) ON DELETE SET NULL;

-- 6. Backfill existing reservations to maintain historical financial consistency
UPDATE reservations
SET subtotal_amount = total_amount,
    discount_amount = 0.00
WHERE subtotal_amount = 0.00;
