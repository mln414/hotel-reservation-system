-- Restore the discount table expected by the Discount entity/service.
-- The table was missing from the live schema even though the rate/offer
-- migration had already been recorded as applied.

CREATE TABLE IF NOT EXISTS discounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT NULL,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    discount_type VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE',
    discount_value DECIMAL(14,2) NOT NULL,
    minimum_nights INT NULL DEFAULT 1,
    valid_from DATE NULL,
    valid_to DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE INDEX uq_discounts_code (code),
    INDEX idx_discounts_hotel_status (hotel_id, status),
    INDEX idx_discounts_valid_dates (valid_from, valid_to)
);
