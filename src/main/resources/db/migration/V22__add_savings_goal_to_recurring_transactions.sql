-- ============================================================
-- V22 - Add savings_goal_id to recurring_transactions
-- ============================================================

-- 1. Add savings_goal_id column if not exists
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'savings_goal_id');
SET @sql = IF(@col = 0,
    'ALTER TABLE recurring_transactions ADD COLUMN savings_goal_id BIGINT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Add foreign key constraint to savings_goals(id) ON DELETE SET NULL
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions'
             AND CONSTRAINT_NAME = 'fk_recurring_savings_goal');
SET @sql = IF(@fk = 0,
    'ALTER TABLE recurring_transactions ADD CONSTRAINT fk_recurring_savings_goal FOREIGN KEY (savings_goal_id) REFERENCES savings_goals(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Add index for savings_goal_id
SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions'
              AND INDEX_NAME = 'idx_recurring_savings_goal');
SET @sql = IF(@idx = 0,
    'ALTER TABLE recurring_transactions ADD INDEX idx_recurring_savings_goal (savings_goal_id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

