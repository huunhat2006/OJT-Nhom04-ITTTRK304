
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
