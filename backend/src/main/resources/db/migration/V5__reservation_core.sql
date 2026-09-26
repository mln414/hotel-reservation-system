-- LankaStay Reservation module. This migration is authoritative for room-type
-- inventory, rates and reservations; Hibernate is not required to create them.

CREATE TABLE IF NOT EXISTS rooms (
    id BIGINT NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    room_category VARCHAR(50) NOT NULL,
    description TEXT NULL,
    max_occupancy INT NOT NULL DEFAULT 2,
    max_adults INT NOT NULL DEFAULT 2,
    max_children INT NOT NULL DEFAULT 1,
    size_sqm DOUBLE NULL,
    bed_type VARCHAR(50) NULL,
    inventory_count INT NOT NULL DEFAULT 1,
    base_price DECIMAL(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    main_image VARCHAR(255) NULL,
    amenities_json TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_rooms_hotel_status (hotel_id, status),
    CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS room_rates (
    id BIGINT NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    rate_plan_name VARCHAR(150) NOT NULL,
    rate_plan_code VARCHAR(50) NOT NULL,
    base_nightly_rate DECIMAL(14,2) NOT NULL,
    weekend_nightly_rate DECIMAL(14,2) NULL,
    meal_plan VARCHAR(50) NOT NULL DEFAULT 'ROOM_ONLY',
    cancellation_policy VARCHAR(50) NOT NULL DEFAULT 'FLEXIBLE_24H',
    deposit_required BOOLEAN NOT NULL DEFAULT FALSE,
    deposit_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_room_rates_room_status (room_id, status),
    INDEX idx_room_rates_hotel (hotel_id),
    CONSTRAINT fk_room_rates_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_room_rates_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reservation_code VARCHAR(32) NOT NULL,
    hotel_id BIGINT NOT NULL,
    customer_id BINARY(16) NOT NULL,
    guest_name VARCHAR(150) NOT NULL,
    guest_email VARCHAR(254) NOT NULL,
    guest_phone VARCHAR(30) NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    number_of_nights INT NOT NULL,
    adults INT NOT NULL,
    children INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(14,2) NOT NULL,
    tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(14,2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    reservation_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    assignment_state VARCHAR(30) NOT NULL DEFAULT 'UNASSIGNED',
    assigned_room_number VARCHAR(50) NULL,
    special_requests TEXT NULL,
    estimated_arrival_time VARCHAR(20) NULL,
    cancelled_at TIMESTAMP(6) NULL,
    cancellation_reason VARCHAR(300) NULL,
    cancellation_note VARCHAR(500) NULL,
    cancelled_by_type VARCHAR(30) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_reservations_code UNIQUE (reservation_code),
    INDEX idx_reservations_customer_created (customer_id, created_at),
    INDEX idx_reservations_hotel_dates_status (hotel_id, check_in, check_out, reservation_status),
    INDEX idx_reservations_status (reservation_status),
    CONSTRAINT fk_reservations_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES customer_users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS reservation_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    room_rate_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    nightly_rate DECIMAL(14,2) NOT NULL,
    total_price DECIMAL(14,2) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_reservation_items_reservation (reservation_id),
    INDEX idx_reservation_items_room_reservation (room_id, reservation_id),
    CONSTRAINT fk_reservation_items_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_items_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reservation_items_rate FOREIGN KEY (room_rate_id) REFERENCES room_rates(id) ON DELETE RESTRICT
);

-- Reconcile tables previously produced by ddl-auto=update. Numeric customer IDs
-- never identified a CustomerUser UUID, so those unverifiable links are cleared
-- while the historical reservation rows themselves are retained.
DELIMITER $$
CREATE PROCEDURE migrate_legacy_reservation_schema()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'reservations'
          AND column_name = 'customer_id' AND data_type <> 'binary'
    ) THEN
        UPDATE reservations SET customer_id = NULL;
        ALTER TABLE reservations MODIFY customer_id BINARY(16) NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'reservations' AND column_name = 'cancelled_at') THEN
        ALTER TABLE reservations ADD COLUMN cancelled_at TIMESTAMP(6) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'reservations' AND column_name = 'cancellation_reason') THEN
        ALTER TABLE reservations ADD COLUMN cancellation_reason VARCHAR(300) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'reservations' AND column_name = 'cancellation_note') THEN
        ALTER TABLE reservations ADD COLUMN cancellation_note VARCHAR(500) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'reservations' AND column_name = 'cancelled_by_type') THEN
        ALTER TABLE reservations ADD COLUMN cancelled_by_type VARCHAR(30) NULL;
    END IF;

    ALTER TABLE reservations
        MODIFY reservation_code VARCHAR(32) NOT NULL,
        MODIFY total_amount DECIMAL(14,2) NOT NULL,
        MODIFY tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
        MODIFY net_amount DECIMAL(14,2) NOT NULL;
    ALTER TABLE reservation_items
        MODIFY room_rate_id BIGINT NOT NULL,
        MODIFY nightly_rate DECIMAL(14,2) NOT NULL,
        MODIFY total_price DECIMAL(14,2) NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'reservations' AND index_name = 'idx_reservations_customer_created') THEN
        CREATE INDEX idx_reservations_customer_created ON reservations(customer_id, created_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'reservations' AND index_name = 'idx_reservations_hotel_dates_status') THEN
        CREATE INDEX idx_reservations_hotel_dates_status ON reservations(hotel_id, check_in, check_out, reservation_status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'reservation_items' AND index_name = 'idx_reservation_items_room_reservation') THEN
        CREATE INDEX idx_reservation_items_room_reservation ON reservation_items(room_id, reservation_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND constraint_name = 'fk_reservations_hotel') THEN
        ALTER TABLE reservations ADD CONSTRAINT fk_reservations_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND constraint_name = 'fk_reservations_customer') THEN
        ALTER TABLE reservations ADD CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES customer_users(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND constraint_name = 'fk_reservation_items_reservation') THEN
        ALTER TABLE reservation_items ADD CONSTRAINT fk_reservation_items_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND constraint_name = 'fk_reservation_items_room') THEN
        ALTER TABLE reservation_items ADD CONSTRAINT fk_reservation_items_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND constraint_name = 'fk_reservation_items_rate') THEN
        ALTER TABLE reservation_items ADD CONSTRAINT fk_reservation_items_rate FOREIGN KEY (room_rate_id) REFERENCES room_rates(id) ON DELETE RESTRICT;
    END IF;
END$$
DELIMITER ;

CALL migrate_legacy_reservation_schema();
DROP PROCEDURE migrate_legacy_reservation_schema;
