-- ====================================================================
-- V9__customer_profile_audit.sql
-- Expand security_audit event_type column to support customer profile events
-- ====================================================================

ALTER TABLE security_audit MODIFY COLUMN event_type VARCHAR(50) NOT NULL;
