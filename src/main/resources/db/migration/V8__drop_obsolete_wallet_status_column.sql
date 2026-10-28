-- Tác giả: La Thế Phong (Database & Data Lead)
-- ============================================================
-- V8: Drop obsolete wallets.status column
-- The Wallet entity used to map isActive to a column named "status".
-- Hibernate ddl-auto=update therefore created wallets.status even though
-- the real column is wallets.is_active. That stale NOT NULL column has no
-- default and breaks wallet inserts. Remove it where it exists.
-- ============================================================

SET @has_status = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallets'
      AND COLUMN_NAME = 'status'
);
SET @ddl = IF(@has_status > 0,
    'ALTER TABLE wallets DROP COLUMN status',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
