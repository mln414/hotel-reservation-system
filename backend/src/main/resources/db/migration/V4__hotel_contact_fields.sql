-- Persist Hotel fields already present in the management create/edit UI.
SET @migration_sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'city'),
    'SELECT 1', 'ALTER TABLE hotels ADD COLUMN city VARCHAR(100) NULL AFTER address'
);
PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @migration_sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'province'),
    'SELECT 1', 'ALTER TABLE hotels ADD COLUMN province VARCHAR(100) NULL AFTER city'
);
PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @migration_sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'postal_code'),
    'SELECT 1', 'ALTER TABLE hotels ADD COLUMN postal_code VARCHAR(20) NULL AFTER province'
);
PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @migration_sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'email'),
    'SELECT 1', 'ALTER TABLE hotels ADD COLUMN email VARCHAR(150) NULL AFTER postal_code'
);
PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @migration_sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'phone'),
    'SELECT 1', 'ALTER TABLE hotels ADD COLUMN phone VARCHAR(40) NULL AFTER email'
);
PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @migration_sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'website'),
    'SELECT 1', 'ALTER TABLE hotels ADD COLUMN website VARCHAR(255) NULL AFTER phone'
);
PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;
