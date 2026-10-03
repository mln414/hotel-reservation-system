-- Reconnect bundled project photos without copying assets or overwriting manager uploads.
-- These paths are resolved from frontend/src/assets/images by hotelMedia.js.
UPDATE hotels SET main_image = '/assets/images/home/ocean-view-colombo.png'
WHERE id = 102 AND main_image = '/assets/images/colombo.png';

UPDATE hotels SET main_image = '/assets/images/home/heritage-fort.png'
WHERE id = 301 AND main_image = '/assets/images/galle.png';

UPDATE hotels SET main_image = '/assets/images/home/ocean-bay.png'
WHERE id = 302 AND main_image = '/assets/images/galle.png';

INSERT INTO hotel_gallery (hotel_id, image_url)
SELECT h.id, media.image_url
FROM (
    SELECT 301 AS hotel_id, '/assets/images/lankastay-heritage-fort.png' AS image_url
    UNION ALL SELECT 302, '/assets/images/lankastay-ocean-bay.png'
    UNION ALL SELECT 302, '/assets/images/home/ocean - bay/pool.png'
    UNION ALL SELECT 302, '/assets/images/home/ocean - bay/restaurant.png'
    UNION ALL SELECT 302, '/assets/images/home/ocean - bay/beach.png'
) media
JOIN hotels h ON h.id = media.hotel_id
WHERE NOT EXISTS (
    SELECT 1 FROM hotel_gallery existing
    WHERE existing.hotel_id = media.hotel_id AND existing.image_url = media.image_url
);
