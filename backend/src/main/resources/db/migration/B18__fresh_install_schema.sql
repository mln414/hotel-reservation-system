-- Cumulative schema-only baseline for an EMPTY MySQL database at version 18.
-- Captured from the verified active V18 schema; no user data or credentials.
-- Existing databases with applied migrations ignore this B migration.
-- V19 remains separate and adds customer session_version.
-- Do not edit already-applied V1–V18 migrations or manually baseline an empty schema.


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attractions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `display_order` int NOT NULL,
  `estimated_travel_time` varchar(50) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `short_description` text,
  `source` varchar(50) DEFAULT NULL,
  `source_id` varchar(100) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL,
  `type` varchar(50) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `destination_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_attractions_dest_id` (`destination_id`),
  KEY `idx_attractions_dest_status_order` (`destination_id`,`status`,`display_order`),
  CONSTRAINT `FK8ftru0x7ao5mding49cf84w9o` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_users` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(254) NOT NULL,
  `failed_login_attempts` int NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_login_at` datetime(6) DEFAULT NULL,
  `last_name` varchar(80) NOT NULL,
  `locked_until` datetime(6) DEFAULT NULL,
  `password_hash` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role` varchar(30) NOT NULL,
  `status` varchar(20) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK1hvnsegn6oau1wh8qnufurrq` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `destination_highlights` (
  `destination_id` bigint NOT NULL,
  `highlight` varchar(255) DEFAULT NULL,
  `display_order` int NOT NULL,
  PRIMARY KEY (`destination_id`,`display_order`),
  CONSTRAINT `FK7nukm13askydaa8ky7a5l9x91` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`),
  CONSTRAINT `destination_highlights_chk_1` CHECK ((`display_order` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `destination_themes` (
  `destination_id` bigint NOT NULL,
  `theme_key` varchar(50) DEFAULT NULL,
  UNIQUE KEY `UK9ph2oq13ixc03scrd8ns48edl` (`destination_id`,`theme_key`),
  CONSTRAINT `FKl674tn2b9n5pexeb49cfy80fq` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `destinations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `card_image_position` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `district` varchar(100) NOT NULL,
  `full_description` text,
  `hero_fit_mode` varchar(50) DEFAULT NULL,
  `hero_image_position` varchar(50) DEFAULT NULL,
  `last_completed_step` int DEFAULT NULL,
  `last_saved_step` int DEFAULT NULL,
  `last_updated_section` varchar(100) DEFAULT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `main_image` varchar(500) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `region` varchar(100) NOT NULL,
  `short_description` varchar(255) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `status` enum('ACTIVE','DRAFT','INACTIVE','READY_FOR_REVIEW') NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_destinations_slug` (`slug`),
  KEY `idx_destinations_status` (`status`),
  KEY `idx_destinations_region_district` (`region`,`district`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `destinations_highlights` (
  `destination_id` bigint NOT NULL,
  `highlight` varchar(255) NOT NULL,
  KEY `idx_destination_highlights_destination` (`destination_id`),
  CONSTRAINT `fk_destination_highlights_destination` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `destinations_theme_keys` (
  `destination_id` bigint NOT NULL,
  `theme_key` varchar(50) NOT NULL,
  KEY `idx_destination_theme_keys_destination` (`destination_id`),
  CONSTRAINT `fk_destination_theme_keys_destination` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `hotel_id` bigint DEFAULT NULL,
  `code` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `discount_type` varchar(30) NOT NULL DEFAULT 'PERCENTAGE',
  `discount_value` double NOT NULL,
  `minimum_nights` int DEFAULT '1',
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_discounts_code` (`code`),
  KEY `idx_discounts_hotel_status` (`hotel_id`,`status`),
  KEY `idx_discounts_valid_dates` (`valid_from`,`valid_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_collections` (
  `hotel_id` bigint NOT NULL,
  `collection_id` varchar(255) DEFAULT NULL,
  KEY `FKb14j8ah4e1kukbtrnbyubx99h` (`hotel_id`),
  CONSTRAINT `FKb14j8ah4e1kukbtrnbyubx99h` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_facilities` (
  `hotel_id` bigint NOT NULL,
  `facility_name` varchar(255) DEFAULT NULL,
  KEY `FKp1tokc3jyf0c1fqw9o59paq6f` (`hotel_id`),
  CONSTRAINT `FKp1tokc3jyf0c1fqw9o59paq6f` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_gallery` (
  `hotel_id` bigint NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  KEY `FK8o2sns4kk62t1tpj6opb026tg` (`hotel_id`),
  CONSTRAINT `FK8o2sns4kk62t1tpj6opb026tg` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotels` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `badge` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `check_in_time` varchar(20) DEFAULT NULL,
  `check_out_time` varchar(20) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `destination_id` bigint NOT NULL,
  `detail_description` text,
  `featured` bit(1) NOT NULL,
  `languages` varchar(255) DEFAULT NULL,
  `last_updated_section` varchar(50) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `main_image` varchar(500) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `property_size` varchar(50) DEFAULT NULL,
  `property_type` varchar(50) NOT NULL,
  `publication_status` varchar(30) NOT NULL,
  `rating` double NOT NULL,
  `review_count` int NOT NULL,
  `setup_status` varchar(30) NOT NULL,
  `short_description` text,
  `slug` varchar(180) NOT NULL,
  `status` varchar(20) NOT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `policies_json` text,
  `year_opened` int DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcw1rvvwj7be3nrownpmvrqgyv` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_hotels` (
  `offer_id` bigint NOT NULL,
  `hotel_id` bigint NOT NULL,
  PRIMARY KEY (`offer_id`,`hotel_id`),
  UNIQUE KEY `UK6lhuuc5ri1yonq8rhy99toyqc` (`offer_id`,`hotel_id`),
  KEY `idx_offer_hotels_hotel` (`hotel_id`),
  CONSTRAINT `fk_offer_hotels_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offer_hotels_offer` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_rooms` (
  `offer_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  PRIMARY KEY (`offer_id`,`room_id`),
  UNIQUE KEY `UKmmw7q4uawjst9pgcq0ff33b76` (`offer_id`,`room_id`),
  KEY `idx_offer_rooms_room` (`room_id`),
  CONSTRAINT `fk_offer_rooms_offer` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offer_rooms_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `slug` varchar(150) NOT NULL,
  `title` varchar(200) NOT NULL,
  `short_description` varchar(500) NOT NULL,
  `full_description` text NOT NULL,
  `discount_type` varchar(30) NOT NULL,
  `discount_value` decimal(14,2) NOT NULL,
  `fixed_discount_scope` varchar(30) DEFAULT 'PER_STAY',
  `stay_start_date` date NOT NULL,
  `stay_end_date` date NOT NULL,
  `booking_start_date` date DEFAULT NULL,
  `booking_end_date` date DEFAULT NULL,
  `minimum_stay` int NOT NULL DEFAULT '1',
  `maximum_stay` int DEFAULT NULL,
  `applicable_days` varchar(100) NOT NULL DEFAULT 'MON,TUE,WED,THU,FRI,SAT,SUN',
  `status` varchar(20) NOT NULL DEFAULT 'DRAFT',
  `featured` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `image` varchar(500) DEFAULT NULL,
  `terms_json` text,
  `target_room_category_keys` varchar(255) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_offers_slug` (`slug`),
  KEY `idx_offers_status` (`status`),
  KEY `idx_offers_stay_dates` (`stay_start_date`,`stay_end_date`),
  KEY `idx_offers_booking_dates` (`booking_start_date`,`booking_end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `customer_user_id` binary(16) DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `staff_user_id` binary(16) DEFAULT NULL,
  `token_hash` varchar(64) NOT NULL,
  `used_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `physical_room_blocks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `physical_room_id` bigint NOT NULL,
  `block_type` varchar(20) NOT NULL,
  `reason` varchar(500) NOT NULL,
  `from_date` date NOT NULL,
  `through_date` date NOT NULL,
  `return_state` varchar(20) NOT NULL DEFAULT 'AVAILABLE',
  `created_at` timestamp(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_physical_room_blocks_room_dates` (`physical_room_id`,`from_date`,`through_date`),
  CONSTRAINT `fk_physical_room_blocks_room` FOREIGN KEY (`physical_room_id`) REFERENCES `physical_rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `physical_rooms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `hotel_id` bigint NOT NULL,
  `room_type_id` bigint NOT NULL,
  `room_number` varchar(50) NOT NULL,
  `room_number_key` varchar(50) NOT NULL,
  `floor` varchar(50) DEFAULT NULL,
  `wing` varchar(100) DEFAULT NULL,
  `base_operational_status` varchar(20) NOT NULL DEFAULT 'AVAILABLE',
  `room_condition` varchar(30) NOT NULL DEFAULT 'READY',
  `notes` varchar(1000) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL,
  `updated_at` timestamp(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_physical_rooms_hotel_number` (`hotel_id`,`room_number_key`),
  KEY `idx_physical_rooms_type` (`room_type_id`),
  CONSTRAINT `fk_physical_rooms_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_physical_rooms_type` FOREIGN KEY (`room_type_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nightly_rate` decimal(14,2) NOT NULL,
  `quantity` int NOT NULL,
  `reservation_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `room_rate_id` bigint NOT NULL,
  `total_price` decimal(14,2) NOT NULL,
  `room_name_snapshot` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reservation_items_room_reservation` (`room_id`,`reservation_id`),
  KEY `fk_reservation_items_reservation` (`reservation_id`),
  KEY `fk_reservation_items_rate` (`room_rate_id`),
  CONSTRAINT `fk_reservation_items_rate` FOREIGN KEY (`room_rate_id`) REFERENCES `room_rates` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reservation_items_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservation_items_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_physical_rooms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reservation_id` bigint NOT NULL,
  `physical_room_id` bigint NOT NULL,
  `created_at` timestamp(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reservation_physical_room` (`reservation_id`,`physical_room_id`),
  KEY `idx_reservation_physical_rooms_room` (`physical_room_id`),
  CONSTRAINT `fk_reservation_physical_rooms_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservation_physical_rooms_room` FOREIGN KEY (`physical_room_id`) REFERENCES `physical_rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `adults` int NOT NULL,
  `assigned_room_number` varchar(50) DEFAULT NULL,
  `assignment_state` enum('ASSIGNED','PARTIALLY_ASSIGNED','UNASSIGNED') NOT NULL,
  `check_in` date NOT NULL,
  `check_out` date NOT NULL,
  `children` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `customer_id` binary(16) DEFAULT NULL,
  `estimated_arrival_time` varchar(20) DEFAULT NULL,
  `guest_email` varchar(254) NOT NULL,
  `guest_name` varchar(150) NOT NULL,
  `guest_phone` varchar(30) DEFAULT NULL,
  `hotel_id` bigint NOT NULL,
  `net_amount` decimal(14,2) NOT NULL,
  `number_of_nights` int NOT NULL,
  `payment_status` enum('PAID','PARTIALLY_PAID','PENDING') NOT NULL,
  `reservation_code` varchar(32) NOT NULL,
  `reservation_status` enum('CANCELLED','COMPLETED','CONFIRMED') NOT NULL,
  `special_requests` text,
  `tax_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(14,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `cancelled_at` timestamp(6) NULL DEFAULT NULL,
  `cancellation_reason` varchar(300) DEFAULT NULL,
  `cancellation_note` varchar(500) DEFAULT NULL,
  `cancelled_by_type` varchar(30) DEFAULT NULL,
  `subtotal_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `applied_offer_id` bigint DEFAULT NULL,
  `offer_title_snapshot` varchar(200) DEFAULT NULL,
  `discount_type_snapshot` varchar(30) DEFAULT NULL,
  `discount_value_snapshot` decimal(14,2) DEFAULT NULL,
  `review_submitted_at` timestamp(6) NULL DEFAULT NULL,
  `assigned_physical_room_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6g1uj544xgjuyhj6kjh6pka6l` (`reservation_code`),
  KEY `idx_reservations_customer_created` (`customer_id`,`created_at`),
  KEY `idx_reservations_hotel_dates_status` (`hotel_id`,`check_in`,`check_out`,`reservation_status`),
  KEY `fk_reservations_offer` (`applied_offer_id`),
  KEY `idx_reservations_assigned_physical_room` (`assigned_physical_room_id`),
  CONSTRAINT `fk_reservations_assigned_physical_room` FOREIGN KEY (`assigned_physical_room_id`) REFERENCES `physical_rooms` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reservations_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reservations_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reservations_offer` FOREIGN KEY (`applied_offer_id`) REFERENCES `offers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_photos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `review_id` bigint NOT NULL,
  `photo_url` varchar(500) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_review_photos_review` (`review_id`),
  CONSTRAINT `fk_review_photos_review` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` binary(16) NOT NULL,
  `hotel_id` bigint NOT NULL,
  `reservation_id` bigint NOT NULL,
  `overall_rating` int NOT NULL,
  `cleanliness_rating` int DEFAULT NULL,
  `comfort_rating` int DEFAULT NULL,
  `staff_service_rating` int DEFAULT NULL,
  `facilities_rating` int DEFAULT NULL,
  `location_rating` int DEFAULT NULL,
  `value_for_money_rating` int DEFAULT NULL,
  `title` varchar(120) NOT NULL,
  `comment` text NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'ACTIVE',
  `customer_updated_at` timestamp(6) NULL DEFAULT NULL,
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `moderation_reason` varchar(100) DEFAULT NULL,
  `moderation_note` text,
  `hidden_at` timestamp(6) NULL DEFAULT NULL,
  `hidden_by_staff_id` binary(16) DEFAULT NULL,
  `management_response` text,
  `response_created_at` timestamp(6) NULL DEFAULT NULL,
  `response_updated_at` timestamp(6) NULL DEFAULT NULL,
  `response_by_staff_id` binary(16) DEFAULT NULL,
  `response_role` varchar(50) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reviews_reservation` (`reservation_id`),
  KEY `idx_reviews_hotel_status_created` (`hotel_id`,`status`,`created_at`),
  KEY `idx_reviews_customer_created` (`customer_id`,`created_at`),
  KEY `idx_reviews_status` (`status`),
  CONSTRAINT `fk_reviews_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reviews_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reviews_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_gallery` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `room_id` bigint NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_cover` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_room_gallery_room_order` (`room_id`,`display_order`),
  CONSTRAINT `fk_room_gallery_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_rates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `base_nightly_rate` decimal(14,2) NOT NULL,
  `cancellation_policy` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deposit_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `deposit_required` bit(1) NOT NULL,
  `hotel_id` bigint NOT NULL,
  `meal_plan` varchar(50) NOT NULL,
  `rate_plan_code` varchar(50) NOT NULL,
  `rate_plan_name` varchar(150) NOT NULL,
  `room_id` bigint NOT NULL,
  `status` varchar(20) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `weekend_nightly_rate` decimal(14,2) DEFAULT NULL,
  `rate_type` varchar(50) NOT NULL DEFAULT 'BASE',
  `pricing_method` varchar(50) NOT NULL DEFAULT 'SET_PRICE',
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `minimum_stay` int NOT NULL DEFAULT '1',
  `applicable_days` varchar(100) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_room_rates_room_status` (`room_id`,`status`),
  KEY `idx_room_rates_hotel` (`hotel_id`),
  KEY `idx_room_rates_validity` (`room_id`,`status`,`valid_from`,`valid_to`),
  KEY `idx_room_rates_plan_code` (`hotel_id`,`room_id`,`rate_plan_code`),
  CONSTRAINT `fk_room_rates_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_room_rates_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amenities_json` text,
  `base_price` double NOT NULL,
  `bed_type` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text,
  `hotel_id` bigint NOT NULL,
  `inventory_count` int NOT NULL,
  `main_image` varchar(255) DEFAULT NULL,
  `max_adults` int NOT NULL,
  `max_children` int NOT NULL,
  `max_occupancy` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `room_category` varchar(50) NOT NULL,
  `size_sqm` double DEFAULT NULL,
  `slug` varchar(150) NOT NULL,
  `status` varchar(20) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rooms_hotel_status` (`hotel_id`,`status`),
  KEY `idx_rooms_hotel_slug` (`hotel_id`,`slug`),
  CONSTRAINT `fk_rooms_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_user_id` binary(16) DEFAULT NULL,
  `event_type` enum('ACCOUNT_DISABLED','ACCOUNT_ENABLED','ACCOUNT_LOCKED','CUSTOMER_PASSWORD_CHANGED','CUSTOMER_PROFILE_UPDATED','CUSTOMER_REGISTERED','HOTEL_ACTIVATED','HOTEL_CREATED','HOTEL_DEACTIVATED','HOTEL_DELETED','HOTEL_UPDATED','INITIAL_PASSWORD_CHANGED','LOGIN_FAILURE','LOGIN_SUCCESS','LOGOUT','OFFER_ACTIVATED','OFFER_CREATED','OFFER_DEACTIVATED','OFFER_DELETED','OFFER_UPDATED','PASSWORD_CHANGED','PASSWORD_RESET_BY_ADMIN','PASSWORD_RESET_COMPLETED','PASSWORD_RESET_FAILED','PASSWORD_RESET_REQUESTED','RATE_ACTIVATED','RATE_CREATED','RATE_DEACTIVATED','RATE_DELETED','RATE_UPDATED','RESERVATION_CANCELLED','RESERVATION_COMPLETED','RESERVATION_CREATED','RESERVATION_DELETED','RESERVATION_ROOM_ASSIGNED','REVIEW_CREATED','REVIEW_DELETED_BY_CUSTOMER','REVIEW_HIDDEN','REVIEW_RESPONSE_CREATED','REVIEW_RESPONSE_REMOVED','REVIEW_RESPONSE_UPDATED','REVIEW_RESTORED','REVIEW_UPDATED','ROLE_CHANGED','ROOM_ACTIVATED','ROOM_CREATED','ROOM_DEACTIVATED','ROOM_DELETED','ROOM_UPDATED','STAFF_CREATED') NOT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `occurred_at` datetime(6) NOT NULL,
  `result` varchar(20) NOT NULL,
  `target_user_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_security_audit_occurred` (`occurred_at`),
  KEY `idx_security_audit_target` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_users` (
  `id` binary(16) NOT NULL,
  `assigned_hotel_id` bigint DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` binary(16) DEFAULT NULL,
  `email` varchar(254) NOT NULL,
  `failed_login_attempts` int NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_login_at` datetime(6) DEFAULT NULL,
  `last_name` varchar(80) NOT NULL,
  `locked_until` datetime(6) DEFAULT NULL,
  `must_change_password` bit(1) NOT NULL,
  `password_hash` varchar(100) NOT NULL,
  `role` enum('HOTEL_STAFF','MANAGER','RECEPTIONIST') NOT NULL,
  `status` enum('ACTIVE','DISABLED','LOCKED') NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `permissions_json` text,
  `phone` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_staff_users_email` (`email`),
  KEY `idx_staff_users_role_status` (`role`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
