CREATE TABLE physical_rooms (
    id BIGINT NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    room_type_id BIGINT NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    room_number_key VARCHAR(50) NOT NULL,
    floor VARCHAR(50) NULL,
    wing VARCHAR(100) NULL,
    base_operational_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    room_condition VARCHAR(30) NOT NULL DEFAULT 'READY',
    notes VARCHAR(1000) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_physical_rooms_hotel_number UNIQUE (hotel_id, room_number_key),
    INDEX idx_physical_rooms_type (room_type_id),
    CONSTRAINT fk_physical_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_physical_rooms_type FOREIGN KEY (room_type_id) REFERENCES rooms(id) ON DELETE RESTRICT
);

CREATE TABLE physical_room_blocks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    physical_room_id BIGINT NOT NULL,
    block_type VARCHAR(20) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    from_date DATE NOT NULL,
    through_date DATE NOT NULL,
    return_state VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_physical_room_blocks_room_dates (physical_room_id, from_date, through_date),
    CONSTRAINT fk_physical_room_blocks_room FOREIGN KEY (physical_room_id) REFERENCES physical_rooms(id) ON DELETE RESTRICT
);

ALTER TABLE reservations
    ADD COLUMN assigned_physical_room_id BIGINT NULL,
    ADD INDEX idx_reservations_assigned_physical_room (assigned_physical_room_id),
    ADD CONSTRAINT fk_reservations_assigned_physical_room FOREIGN KEY (assigned_physical_room_id)
        REFERENCES physical_rooms(id) ON DELETE RESTRICT;
