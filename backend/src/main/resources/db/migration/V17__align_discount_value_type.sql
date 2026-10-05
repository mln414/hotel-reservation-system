-- Discount.discountValue is a Java Double, so keep the legacy schema type
-- compatible with Hibernate validation while preserving existing values.

ALTER TABLE discounts
    MODIFY COLUMN discount_value DOUBLE NOT NULL;
