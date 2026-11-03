-- ============================================================
-- V15 - Align recurring_transactions table with JPA Entity
-- ============================================================

-- 1. Add family_id if not present
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'family_id');
SET @sql = IF(@col = 0, 'ALTER TABLE recurring_transactions ADD COLUMN family_id BIGINT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Add next_trigger_date if not present
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'next_trigger_date');
SET @sql = IF(@col = 0, 'ALTER TABLE recurring_transactions ADD COLUMN next_trigger_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Add last_executed_date if not present
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'last_executed_date');
SET @sql = IF(@col = 0, 'ALTER TABLE recurring_transactions ADD COLUMN last_executed_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Add max_occurrences if not present
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'max_occurrences');
SET @sql = IF(@col = 0, 'ALTER TABLE recurring_transactions ADD COLUMN max_occurrences INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Add times_executed if not present
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'times_executed');
SET @sql = IF(@col = 0, 'ALTER TABLE recurring_transactions ADD COLUMN times_executed INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. Add occurrences_count if not present (SRS alias)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND COLUMN_NAME = 'occurrences_count');
SET @sql = IF(@col = 0, 'ALTER TABLE recurring_transactions ADD COLUMN occurrences_count INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill data
UPDATE recurring_transactions 
SET family_id = space_id 
WHERE family_id IS NULL AND space_id IS NOT NULL;

UPDATE recurring_transactions 
SET next_trigger_date = COALESCE(next_run_date, start_date) 
WHERE next_trigger_date IS NULL;

UPDATE recurring_transactions 
SET last_executed_date = last_run_date 
WHERE last_executed_date IS NULL;

