-- Tác giả: La Thế Phong (Database & Data Lead)
-- ============================================================
-- V6: Add transactions.destination_wallet_id (UC04 - transfer between wallets)
-- Idempotent: some local databases already got this column from
-- Hibernate ddl-auto=update before this migration existed, so we only
-- create the column / FK / index when they are actually missing.
-- ============================================================

-- 1. Column
SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND COLUMN_NAME = 'destination_wallet_id'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE transactions ADD COLUMN destination_wallet_id BIGINT NULL AFTER wallet_id',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Foreign key
SET @has_fk = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND COLUMN_NAME = 'destination_wallet_id'
      AND REFERENCED_TABLE_NAME = 'wallets'
);
SET @ddl = IF(@has_fk = 0,
    'ALTER TABLE transactions ADD CONSTRAINT fk_transactions_destination_wallet FOREIGN KEY (destination_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Index (the FK above normally creates one; this covers DBs where the
--    column existed but no FK/index did)
SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND COLUMN_NAME = 'destination_wallet_id'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE transactions ADD INDEX idx_transactions_destination_wallet (destination_wallet_id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
