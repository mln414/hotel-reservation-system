-- =====================================================================
-- LankaStay Hotels & Resorts
-- V6__room_management_core.sql
-- Room Management Repair: Constraints, Indexes, Room Gallery & Snapshots
-- =====================================================================

-- 1. Ensure foreign key on rooms.hotel_id
ALTER TABLE rooms
    ADD CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE RESTRICT;

CREATE INDEX idx_rooms_hotel_status ON rooms (hotel_id, status);
CREATE INDEX idx_rooms_hotel_slug ON rooms (hotel_id, slug);

-- 2. Ensure foreign keys and indexes on room_rates
ALTER TABLE room_rates
    ADD CONSTRAINT fk_room_rates_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE RESTRICT;

ALTER TABLE room_rates
    ADD CONSTRAINT fk_room_rates_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT;

CREATE INDEX idx_room_rates_room_status ON room_rates (room_id, status);
CREATE INDEX idx_room_rates_hotel ON room_rates (hotel_id);

-- 3. Room Gallery table for multi-image persistence
CREATE TABLE IF NOT EXISTS room_gallery (
    id BIGINT NOT NULL AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255) NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_room_gallery_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    INDEX idx_room_gallery_room_order (room_id, display_order)
);

-- 4. Backfill initial room_gallery cover from rooms.main_image where available
INSERT INTO room_gallery (room_id, image_url, caption, display_order, is_cover, created_at)
SELECT id, main_image, 'Cover photo', 0, TRUE, NOW(6)
FROM rooms
WHERE main_image IS NOT NULL AND main_image != '';

-- 5. Add historical room name snapshot column to reservation_items and backfill
ALTER TABLE reservation_items
    ADD COLUMN room_name_snapshot VARCHAR(150) NULL;

UPDATE reservation_items ri
JOIN rooms r ON ri.room_id = r.id
SET ri.room_name_snapshot = r.name
WHERE ri.room_name_snapshot IS NULL;
