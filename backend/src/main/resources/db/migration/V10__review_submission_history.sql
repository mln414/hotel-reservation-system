-- Preserve the one-review-per-reservation rule after a review is permanently deleted.
ALTER TABLE reservations
    ADD COLUMN review_submitted_at TIMESTAMP(6) NULL;

UPDATE reservations r
JOIN reviews rv ON rv.reservation_id = r.id
SET r.review_submitted_at = COALESCE(rv.created_at, CURRENT_TIMESTAMP(6))
WHERE r.review_submitted_at IS NULL;
