CREATE TABLE reservation_physical_rooms (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT NOT NULL,
    physical_room_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_reservation_physical_room UNIQUE (reservation_id, physical_room_id),
    INDEX idx_reservation_physical_rooms_room (physical_room_id),
    CONSTRAINT fk_reservation_physical_rooms_reservation FOREIGN KEY (reservation_id)
        REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_physical_rooms_room FOREIGN KEY (physical_room_id)
        REFERENCES physical_rooms(id) ON DELETE RESTRICT
);

INSERT INTO reservation_physical_rooms (reservation_id, physical_room_id, created_at)
SELECT id, assigned_physical_room_id, CURRENT_TIMESTAMP(6)
FROM reservations
WHERE assigned_physical_room_id IS NOT NULL;
