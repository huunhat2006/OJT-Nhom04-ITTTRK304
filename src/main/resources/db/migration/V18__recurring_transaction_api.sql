-- ============================================================
-- V18 - Recurring transaction API + scheduler support
-- ============================================================

-- 1. recurring_transactions.status (ACTIVE / PAUSED / ENDED)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'status');
SET @sql = IF(@col = 0,
    'ALTER TABLE recurring_transactions ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''ACTIVE''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE recurring_transactions
SET status = IF(is_active = 1, 'ACTIVE', 'PAUSED');

-- 2. recurring_transactions.template_transaction_id
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'template_transaction_id');
SET @sql = IF(@col = 0,
    'ALTER TABLE recurring_transactions ADD COLUMN template_transaction_id BIGINT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions'
             AND CONSTRAINT_NAME = 'fk_recurring_template_transaction');
SET @sql = IF(@fk = 0,
    'ALTER TABLE recurring_transactions ADD CONSTRAINT fk_recurring_template_transaction FOREIGN KEY (template_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. users.timezone - used to execute/display recurring schedules per user
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'timezone');
SET @sql = IF(@col = 0,
    'ALTER TABLE users ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT ''Asia/Ho_Chi_Minh''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. transactions.recurring_transaction_id - trace generated transactions
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'recurring_transaction_id');
SET @sql = IF(@col = 0,
    'ALTER TABLE transactions ADD COLUMN recurring_transaction_id BIGINT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions'
             AND CONSTRAINT_NAME = 'fk_transactions_recurring');
SET @sql = IF(@fk = 0,
    'ALTER TABLE transactions ADD CONSTRAINT fk_transactions_recurring FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND INDEX_NAME = 'idx_transactions_recurring');
SET @sql = IF(@idx = 0,
    'ALTER TABLE transactions ADD INDEX idx_transactions_recurring (recurring_transaction_id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. recurring_transaction_runs - execution history
CREATE TABLE IF NOT EXISTS recurring_transaction_runs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recurring_transaction_id BIGINT NOT NULL,
    transaction_id BIGINT NULL,
    scheduled_date DATE NOT NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id),
    CONSTRAINT fk_run_recurring FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_run_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    INDEX idx_run_recurring (recurring_transaction_id),
    INDEX idx_run_executed (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND INDEX_NAME = 'idx_recurring_status_next_run');
SET @sql = IF(@idx = 0,
    'ALTER TABLE recurring_transactions ADD INDEX idx_recurring_status_next_run (status, next_run_date)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
