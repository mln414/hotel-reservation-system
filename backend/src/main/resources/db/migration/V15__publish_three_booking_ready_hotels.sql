-- Demo publication set: retain every hotel for management and expose only the
-- three properties that have complete catalog, inventory, rates, offers and media.

UPDATE hotels
SET status = 'INACTIVE', publication_status = 'INACTIVE'
WHERE id IN (101, 201, 401, 501, 601);

UPDATE hotels
SET status = 'ACTIVE', publication_status = 'ACTIVE', setup_status = 'COMPLETE'
WHERE id IN (102, 301, 302);

-- Correct two legacy Heritage Fort room labels while keeping their stable IDs,
-- inventory, rates and reservation relationships intact.
UPDATE rooms
SET name = 'Colonial Deluxe King', slug = 'colonial-deluxe-king',
    description = 'A refined heritage room with a king bed, period-inspired details and modern comforts.',
    room_category = 'DELUXE', updated_at = NOW(6)
WHERE id = 101 AND hotel_id = 301;

UPDATE rooms
SET name = 'Heritage Balcony Suite', slug = 'heritage-balcony-suite',
    description = 'A spacious heritage suite with a balcony, separate sitting area and Galle Fort character.',
    room_category = 'SUITE', updated_at = NOW(6)
WHERE id = 102 AND hotel_id = 301;

-- Reuse the three existing room photographs across the demo room catalog.
-- The frontend resolves these bundled asset paths without public/ duplication.
UPDATE rooms
SET main_image = CASE MOD(id, 3)
    WHEN 0 THEN '/assets/images/home/ocean - bay/deluxe-ocean-view-room.png'
    WHEN 1 THEN '/assets/images/home/ocean - bay/premium-ocean-suite.png'
    ELSE '/assets/images/home/ocean - bay/family-ocean-room.png'
END,
updated_at = NOW(6)
WHERE hotel_id IN (102, 301, 302);

INSERT INTO room_gallery (room_id, image_url, caption, display_order, is_cover, created_at)
SELECT r.id, r.main_image, CONCAT(r.name, ' room photo'), 0, TRUE, NOW(6)
FROM rooms r
WHERE r.hotel_id IN (102, 301, 302)
  AND r.main_image IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM room_gallery rg
      WHERE rg.room_id = r.id AND rg.image_url = r.main_image
  );

-- The three existing offers are current and realistic. Include Ocean View in
-- their persisted targeting so each published hotel has valid promotions.
INSERT IGNORE INTO offer_hotels (offer_id, hotel_id)
SELECT o.id, 102
FROM offers o
WHERE o.id IN (1, 2, 3) AND o.status = 'ACTIVE';
