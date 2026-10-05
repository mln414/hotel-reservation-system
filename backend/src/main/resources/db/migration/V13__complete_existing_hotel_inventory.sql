-- Complete the eight existing LankaStay properties with persistent operational data.
-- This migration deliberately does not write hotel, room, or gallery image fields.

SET @migration_sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'policies_json'),
    'SELECT 1', 'ALTER TABLE hotels ADD COLUMN policies_json TEXT NULL AFTER video_url'
);
PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

UPDATE hotels h
JOIN (
    SELECT 101 AS id, 'Contemporary Colombo comfort for business and leisure stays, close to the city centre, shopping and the waterfront.' AS detail_description, 'Central Colombo stays with thoughtful service.' AS tagline, '2:00 PM' AS check_in_time, '12:00 PM' AS check_out_time, '12 Union Place' AS address, 'Colombo' AS city, 'Western Province' AS province, '00200' AS postal_code, 'reservations.citygrand@lankastay.lk' AS email, '+94 11 245 8800' AS phone, 'https://www.lankastay.lk/city-grand' AS website, 6.9276 AS latitude, 79.8615 AS longitude, 2018 AS year_opened, '120 rooms' AS property_size, 'English, Sinhala, Tamil' AS languages
    UNION ALL SELECT 102, 'A calm oceanfront city hotel on Colombo’s Marine Drive, designed for sunset views, business travel and easy access to the capital.', 'Indian Ocean views on Colombo’s Marine Drive.', '2:00 PM', '12:00 PM', '41 Marine Drive', 'Colombo', 'Western Province', '00300', 'reservations.oceanview@lankastay.lk', '+94 11 275 4410', 'https://www.lankastay.lk/ocean-view', 6.8986, 79.8524, 2020, '86 rooms', 'English, Sinhala, Tamil'
    UNION ALL SELECT 201, 'A relaxed Negombo lagoon retreat with tropical gardens, local seafood and convenient access to the airport and beach.', 'Lagoon-side stays near Negombo.', '2:00 PM', '12:00 PM', '35 Porutota Road', 'Negombo', 'Western Province', '11500', 'reservations.lagoon@lankastay.lk', '+94 31 227 4600', 'https://www.lankastay.lk/lagoon-resort', 7.2378, 79.8421, 2017, '74 rooms', 'English, Sinhala, Tamil'
    UNION ALL SELECT 301, 'A heritage-inspired Galle Fort hotel combining colonial character, courtyard dining and considered modern comforts.', 'Historic Galle Fort character, restored for today.', '2:00 PM', '12:00 PM', '18 Church Street, Fort', 'Galle', 'Southern Province', '80000', 'reservations.heritagefort@lankastay.lk', '+94 91 222 6640', 'https://www.lankastay.lk/heritage-fort', 6.0268, 80.2173, 2016, '42 rooms', 'English, Sinhala, Tamil'
    UNION ALL SELECT 302, 'An intimate coastal resort near Unawatuna with ocean-facing villas, quiet gardens and family-friendly service.', 'Unawatuna coast, private villas and ocean air.', '2:00 PM', '12:00 PM', '175 Lighthouse Beach Road, Unawatuna', 'Galle', 'Southern Province', '80600', 'reservations.oceanbay@lankastay.lk', '+94 91 228 9900', 'https://www.lankastay.lk/ocean-bay', 6.0101, 80.2486, 2019, '36 villas and suites', 'English, Sinhala, Tamil'
    UNION ALL SELECT 401, 'A nature-led Sigiriya retreat with peaceful gardens, rock-view chalets and Sri Lankan hospitality close to the cultural triangle.', 'Stay close to Sigiriya’s timeless landscape.', '2:00 PM', '12:00 PM', 'Kimbissa, Sigiriya', 'Sigiriya', 'Central Province', '21120', 'reservations.sigiriya@lankastay.lk', '+94 66 228 7700', 'https://www.lankastay.lk/sigiriya-retreat', 7.9494, 80.7501, 2018, '58 chalets and villas', 'English, Sinhala, Tamil'
    UNION ALL SELECT 501, 'A cool-climate Nuwara Eliya hotel overlooking tea-country gardens, with warm interiors and mountain air.', 'Tea country calm above the clouds.', '2:00 PM', '12:00 PM', '72 Upper Lake Road', 'Nuwara Eliya', 'Central Province', '22200', 'reservations.highlandmist@lankastay.lk', '+94 52 222 3810', 'https://www.lankastay.lk/highland-mist', 6.9562, 80.7722, 2015, '64 rooms', 'English, Sinhala, Tamil'
    UNION ALL SELECT 601, 'A small Yala-edge wildlife resort offering comfortable safari accommodation, local cuisine and responsible nature experiences.', 'Wild Sri Lanka, thoughtfully hosted.', '2:00 PM', '12:00 PM', 'Palatupana, Tissamaharama', 'Yala', 'Southern Province', '82600', 'reservations.yalawild@lankastay.lk', '+94 47 223 5780', 'https://www.lankastay.lk/yala-wild-retreat', 6.3729, 81.5154, 2019, '48 chalets and villas', 'English, Sinhala, Tamil'
) seed ON seed.id = h.id
SET h.detail_description = COALESCE(NULLIF(h.detail_description, ''), seed.detail_description),
    h.tagline = COALESCE(NULLIF(h.tagline, ''), seed.tagline),
    h.check_in_time = COALESCE(NULLIF(h.check_in_time, ''), seed.check_in_time),
    h.check_out_time = COALESCE(NULLIF(h.check_out_time, ''), seed.check_out_time),
    h.address = COALESCE(NULLIF(h.address, ''), seed.address),
    h.city = COALESCE(NULLIF(h.city, ''), seed.city),
    h.province = COALESCE(NULLIF(h.province, ''), seed.province),
    h.postal_code = COALESCE(NULLIF(h.postal_code, ''), seed.postal_code),
    h.email = COALESCE(NULLIF(h.email, ''), seed.email),
    h.phone = COALESCE(NULLIF(h.phone, ''), seed.phone),
    h.website = COALESCE(NULLIF(h.website, ''), seed.website),
    h.latitude = COALESCE(h.latitude, seed.latitude),
    h.longitude = COALESCE(h.longitude, seed.longitude),
    h.year_opened = COALESCE(h.year_opened, seed.year_opened),
    h.property_size = COALESCE(NULLIF(h.property_size, ''), seed.property_size),
    h.languages = COALESCE(NULLIF(h.languages, ''), seed.languages),
    h.last_updated_section = COALESCE(NULLIF(h.last_updated_section, ''), 'inventory');

UPDATE hotels
SET policies_json = JSON_ARRAY(
    JSON_OBJECT('id', 'check-in-out', 'title', 'Check-in & Check-out', 'category', 'CHECK_IN_OUT', 'summary', 'Arrival and departure information.', 'details', 'Check-in is from 2:00 PM. Check-out is by 12:00 PM. Early arrival and late departure are subject to availability.', 'status', 'ACTIVE'),
    JSON_OBJECT('id', 'cancellation', 'title', 'Cancellation Policy', 'category', 'CANCELLATION', 'summary', 'Flexible stays may be cancelled up to 24 hours before arrival.', 'details', 'Cancellation terms are confirmed with the selected rate plan. Non-refundable rates remain non-refundable after booking.', 'status', 'ACTIVE'),
    JSON_OBJECT('id', 'house-rules', 'title', 'House Rules', 'category', 'HOUSE_RULES', 'summary', 'A quiet, smoke-free stay for every guest.', 'details', 'Valid identification is required at check-in. Smoking is permitted only in designated outdoor areas. Please respect quiet hours after 10:00 PM.', 'status', 'ACTIVE')
)
WHERE id IN (101, 102, 201, 301, 302, 401, 501, 601)
  AND (policies_json IS NULL OR TRIM(policies_json) = '');

INSERT IGNORE INTO hotel_facilities (hotel_id, facility_name) VALUES
    (101, 'Wi-Fi'), (101, 'Air Conditioning'), (101, 'Restaurant'), (101, 'Parking'), (101, 'Fitness Centre'), (101, '24-Hour Front Desk'),
    (102, 'Wi-Fi'), (102, 'Air Conditioning'), (102, 'Swimming Pool'), (102, 'Restaurant'), (102, 'Sea View'), (102, 'Parking'),
    (201, 'Wi-Fi'), (201, 'Air Conditioning'), (201, 'Swimming Pool'), (201, 'Restaurant'), (201, 'Lagoon View'), (201, 'Parking'),
    (301, 'Wi-Fi'), (301, 'Air Conditioning'), (301, 'Courtyard'), (301, 'Restaurant'), (301, 'Heritage Lounge'), (301, '24-Hour Front Desk'),
    (302, 'Wi-Fi'), (302, 'Air Conditioning'), (302, 'Swimming Pool'), (302, 'Restaurant'), (302, 'Sea View'), (302, 'Private Beach Access'),
    (401, 'Wi-Fi'), (401, 'Air Conditioning'), (401, 'Swimming Pool'), (401, 'Restaurant'), (401, 'Garden'), (401, 'Parking'),
    (501, 'Wi-Fi'), (501, 'Hot Water'), (501, 'Restaurant'), (501, 'Tea Lounge'), (501, 'Garden'), (501, 'Parking'),
    (601, 'Wi-Fi'), (601, 'Air Conditioning'), (601, 'Restaurant'), (601, 'Safari Desk'), (601, 'Swimming Pool'), (601, 'Parking');

INSERT INTO rooms (hotel_id, name, slug, room_category, description, max_occupancy, max_adults, max_children, size_sqm, bed_type, inventory_count, base_price, status, amenities_json, created_at, updated_at)
SELECT seed.hotel_id, seed.name, seed.slug, seed.room_category, seed.description, seed.max_occupancy, seed.max_adults, seed.max_children, seed.size_sqm, seed.bed_type, seed.inventory_count, seed.base_price, 'ACTIVE', seed.amenities_json, NOW(6), NOW(6)
FROM (
    SELECT 101 AS hotel_id, 'City Standard Queen' AS name, 'city-standard-queen' AS slug, 'STANDARD' AS room_category, 'A practical city room with a queen bed, work desk and modern bathroom.' AS description, 2 AS max_occupancy, 2 AS max_adults, 0 AS max_children, 28.0 AS size_sqm, '1 Queen Bed' AS bed_type, 8 AS inventory_count, 26000.0 AS base_price, '["Wi-Fi","Air Conditioning","Smart TV","Hot Water","Private Bathroom","Tea/Coffee"]' AS amenities_json
    UNION ALL SELECT 101, 'Executive King Room', 'executive-king-room', 'DELUXE', 'A spacious upper-floor room with a king bed, work area and city outlook.', 3, 2, 1, 36.0, '1 King Bed + Rollaway on request', 6, 34000.0, '["Wi-Fi","Air Conditioning","Smart TV","Mini Fridge","Work Desk","Tea/Coffee"]'
    UNION ALL SELECT 101, 'Family Connector Room', 'family-connector-room', 'FAMILY', 'Two connected sleeping areas designed for comfortable city breaks with children.', 4, 2, 2, 48.0, '1 Queen Bed + 2 Single Beds', 4, 43000.0, '["Wi-Fi","Air Conditioning","Smart TV","Mini Fridge","Hot Water","Private Bathroom"]'
    UNION ALL SELECT 102, 'Superior Ocean King', 'superior-ocean-king', 'DELUXE', 'A bright Marine Drive room with a king bed and partial Indian Ocean view.', 2, 2, 0, 34.0, '1 King Bed', 8, 30000.0, '["Wi-Fi","Air Conditioning","Smart TV","Sea View","Private Bathroom","Tea/Coffee"]'
    UNION ALL SELECT 102, 'Premier Ocean King', 'premier-ocean-king', 'SUITE', 'A generous ocean-facing king room with a private balcony for sunset viewing.', 3, 2, 1, 44.0, '1 King Bed + Sofa Bed', 6, 39000.0, '["Wi-Fi","Air Conditioning","Balcony","Sea View","Mini Fridge","Tea/Coffee"]'
    UNION ALL SELECT 102, 'Family Sea View Room', 'family-sea-view-room', 'FAMILY', 'A comfortable family room with sea-facing windows and flexible bedding.', 4, 2, 2, 52.0, '1 King Bed + 2 Single Beds', 4, 49000.0, '["Wi-Fi","Air Conditioning","Sea View","Smart TV","Mini Fridge","Private Bathroom"]'
    UNION ALL SELECT 201, 'Lagoon Garden Room', 'lagoon-garden-room', 'STANDARD', 'A ground-floor tropical room opening toward the resort gardens.', 2, 2, 0, 32.0, '1 Queen Bed', 8, 29000.0, '["Wi-Fi","Air Conditioning","Garden View","Private Bathroom","Tea/Coffee","Hot Water"]'
    UNION ALL SELECT 201, 'Lagoon Balcony King', 'lagoon-balcony-king', 'DELUXE', 'An airy king room with a private balcony looking across the lagoon gardens.', 3, 2, 1, 40.0, '1 King Bed + Sofa Bed', 6, 37000.0, '["Wi-Fi","Air Conditioning","Balcony","Lagoon View","Mini Fridge","Tea/Coffee"]'
    UNION ALL SELECT 201, 'Family Lagoon Suite', 'family-lagoon-suite', 'FAMILY', 'A two-zone suite for families, with lagoon views and a relaxed sitting area.', 4, 2, 2, 58.0, '1 King Bed + 2 Single Beds', 4, 50000.0, '["Wi-Fi","Air Conditioning","Lagoon View","Smart TV","Mini Fridge","Private Bathroom"]'
    UNION ALL SELECT 301, 'Heritage Courtyard King', 'heritage-courtyard-king', 'DELUXE', 'A characterful king room overlooking the restored inner courtyard.', 2, 2, 0, 35.0, '1 King Bed', 6, 32000.0, '["Wi-Fi","Air Conditioning","Courtyard View","Smart TV","Hot Water","Tea/Coffee"]'
    UNION ALL SELECT 301, 'Fort Signature Suite', 'fort-signature-suite', 'SUITE', 'A spacious heritage suite with a sitting area and curated Galle Fort details.', 3, 2, 1, 55.0, '1 King Bed + Sofa Bed', 4, 47000.0, '["Wi-Fi","Air Conditioning","Heritage View","Mini Fridge","Smart TV","Tea/Coffee"]'
    UNION ALL SELECT 302, 'Garden Pavilion Room', 'garden-pavilion-room', 'DELUXE', 'A peaceful pavilion room set among tropical gardens near the coast.', 2, 2, 0, 42.0, '1 King Bed', 6, 42000.0, '["Wi-Fi","Air Conditioning","Garden View","Private Bathroom","Tea/Coffee","Mini Fridge"]'
    UNION ALL SELECT 302, 'Ocean Pool Suite', 'ocean-pool-suite', 'SUITE', 'A private suite with an ocean-facing terrace and plunge pool.', 3, 2, 1, 68.0, '1 King Bed + Sofa Bed', 4, 65000.0, '["Wi-Fi","Air Conditioning","Sea View","Private Pool","Mini Fridge","Tea/Coffee"]'
    UNION ALL SELECT 401, 'Rock View Chalet', 'rock-view-chalet', 'CHALET', 'A garden chalet with a private terrace and a distant view toward Sigiriya Rock.', 2, 2, 0, 38.0, '1 King Bed', 8, 38000.0, '["Wi-Fi","Air Conditioning","Rock View","Private Bathroom","Tea/Coffee","Hot Water"]'
    UNION ALL SELECT 401, 'Garden Villa', 'garden-villa', 'VILLA', 'A quiet villa set among native planting, with a lounge corner and terrace.', 3, 2, 1, 54.0, '1 King Bed + Sofa Bed', 6, 55000.0, '["Wi-Fi","Air Conditioning","Garden View","Private Terrace","Mini Fridge","Tea/Coffee"]'
    UNION ALL SELECT 401, 'Family Pool Villa', 'family-pool-villa', 'VILLA', 'A spacious family villa with a small private pool and separate sleeping area.', 4, 2, 2, 76.0, '1 King Bed + 2 Single Beds', 4, 75000.0, '["Wi-Fi","Air Conditioning","Private Pool","Garden View","Smart TV","Mini Fridge"]'
    UNION ALL SELECT 501, 'Tea Garden Double', 'tea-garden-double', 'STANDARD', 'A cosy double room with garden views and warm tea-country finishes.', 2, 2, 0, 28.0, '1 Queen Bed', 8, 24000.0, '["Wi-Fi","Hot Water","Tea/Coffee","Garden View","Private Bathroom","Heater"]'
    UNION ALL SELECT 501, 'Mountain View King', 'mountain-view-king', 'DELUXE', 'A king room with broad mountain views and a comfortable window seat.', 3, 2, 1, 38.0, '1 King Bed + Sofa Bed', 6, 31000.0, '["Wi-Fi","Hot Water","Mountain View","Tea/Coffee","Smart TV","Heater"]'
    UNION ALL SELECT 501, 'Family Loft Suite', 'family-loft-suite', 'FAMILY', 'A split-level family suite with extra space for cool-climate holidays.', 4, 2, 2, 56.0, '1 King Bed + 2 Single Beds', 4, 42000.0, '["Wi-Fi","Hot Water","Tea/Coffee","Mountain View","Mini Fridge","Heater"]'
    UNION ALL SELECT 601, 'Safari Chalet', 'safari-chalet', 'CHALET', 'A comfortable safari chalet with a shaded veranda and nature-inspired interior.', 2, 2, 0, 36.0, '1 King Bed', 8, 36000.0, '["Wi-Fi","Air Conditioning","Private Veranda","Hot Water","Tea/Coffee","Private Bathroom"]'
    UNION ALL SELECT 601, 'Wilderness Suite', 'wilderness-suite', 'SUITE', 'A generous suite with a lounge area for relaxing after a Yala safari.', 3, 2, 1, 52.0, '1 King Bed + Sofa Bed', 6, 52000.0, '["Wi-Fi","Air Conditioning","Private Veranda","Mini Fridge","Smart TV","Tea/Coffee"]'
    UNION ALL SELECT 601, 'Family Safari Villa', 'family-safari-villa', 'VILLA', 'A family villa with two sleeping zones and a private outdoor sitting space.', 4, 2, 2, 72.0, '1 King Bed + 2 Single Beds', 4, 70000.0, '["Wi-Fi","Air Conditioning","Private Veranda","Mini Fridge","Hot Water","Private Bathroom"]'
) seed
JOIN hotels h ON h.id = seed.hotel_id
LEFT JOIN rooms existing ON existing.hotel_id = seed.hotel_id AND existing.slug = seed.slug
WHERE existing.id IS NULL;

INSERT INTO room_rates (hotel_id, room_id, rate_plan_name, rate_plan_code, rate_type, pricing_method, base_nightly_rate, weekend_nightly_rate, minimum_stay, applicable_days, meal_plan, cancellation_policy, deposit_required, deposit_percentage, status, notes, created_at, updated_at)
SELECT r.hotel_id, r.id, 'Flexible Bed & Breakfast', 'FLEX-BB', 'BASE', 'SET_PRICE', r.base_price,
       CASE WHEN r.base_price < 30000 THEN r.base_price + 4000 WHEN r.base_price < 50000 THEN r.base_price + 5000 ELSE r.base_price + 7000 END,
       1, 'MON,TUE,WED,THU,FRI,SAT,SUN', 'BED_AND_BREAKFAST', 'FLEXIBLE_24H', FALSE, 0.00, 'ACTIVE',
       'Breakfast included. Free cancellation until 24 hours before arrival.', NOW(6), NOW(6)
FROM rooms r
LEFT JOIN room_rates existing ON existing.hotel_id = r.hotel_id AND existing.room_id = r.id AND UPPER(existing.rate_plan_code) = 'FLEX-BB'
WHERE r.hotel_id IN (101, 102, 201, 301, 302, 401, 501, 601)
  AND r.status = 'ACTIVE'
  AND existing.id IS NULL;

INSERT INTO physical_rooms (hotel_id, room_type_id, room_number, room_number_key, floor, wing, base_operational_status, room_condition, notes, created_at, updated_at)
SELECT r.hotel_id, r.id,
       CONCAT(r.id, '-', LPAD(n.number, 2, '0')),
       UPPER(CONCAT(r.id, '-', LPAD(n.number, 2, '0'))),
       CASE WHEN n.number <= 4 THEN 'Ground Floor' WHEN n.number <= 8 THEN 'First Floor' ELSE 'Second Floor' END,
       CASE WHEN h.property_type = 'Resort' THEN 'Resort Wing' ELSE 'Main Building' END,
       'AVAILABLE', 'READY', 'Initial operational inventory', NOW(6), NOW(6)
FROM rooms r
JOIN hotels h ON h.id = r.hotel_id
JOIN (SELECT 1 AS number UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12) n
LEFT JOIN physical_rooms existing ON existing.hotel_id = r.hotel_id AND existing.room_number_key = UPPER(CONCAT(r.id, '-', LPAD(n.number, 2, '0')))
WHERE r.hotel_id IN (101, 102, 201, 301, 302, 401, 501, 601)
  AND r.status = 'ACTIVE'
  AND n.number <= r.inventory_count
  AND existing.id IS NULL;

UPDATE hotels h
JOIN (
    SELECT hotel_id, MIN(base_nightly_rate) AS starting_rate
    FROM room_rates
    WHERE status = 'ACTIVE'
    GROUP BY hotel_id
) rates ON rates.hotel_id = h.id
SET h.price = rates.starting_rate
WHERE h.id IN (101, 102, 201, 301, 302, 401, 501, 601);
