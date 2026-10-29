
UPDATE transactions
SET category_id = 12
WHERE category_id = 9
  AND description = 'Mua sắm';

CREATE TEMPORARY TABLE IF NOT EXISTS v13_budget_moves AS
SELECT b.id
FROM budgets b
WHERE b.category_id = 9
  AND b.amount = 1500000.00
  AND NOT EXISTS (
      SELECT 1 FROM budgets o
      WHERE o.space_id = b.space_id
        AND o.category_id = 12
        AND o.budget_month = b.budget_month
        AND o.budget_year = b.budget_year
  );

UPDATE budgets
SET category_id = 12
WHERE id IN (SELECT id FROM v13_budget_moves);

DROP TEMPORARY TABLE IF EXISTS v13_budget_moves;

SET @has_constraint = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND CONSTRAINT_NAME = 'chk_transactions_amount_positive'
      AND CONSTRAINT_TYPE = 'CHECK'
);
SET @violations = (SELECT COUNT(*) FROM transactions WHERE amount <= 0);
SET @ddl = IF(@has_constraint = 0 AND @violations = 0,
    'ALTER TABLE transactions ADD CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_constraint = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'budgets'
      AND CONSTRAINT_NAME = 'chk_budgets_period_valid'
      AND CONSTRAINT_TYPE = 'CHECK'
);
SET @violations = (
    SELECT COUNT(*) FROM budgets
    WHERE budget_month < 1 OR budget_month > 12
       OR budget_year < 2000 OR budget_year > 2100
);
SET @ddl = IF(@has_constraint = 0 AND @violations = 0,
    'ALTER TABLE budgets ADD CONSTRAINT chk_budgets_period_valid CHECK (budget_month BETWEEN 1 AND 12 AND budget_year BETWEEN 2000 AND 2100)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_constraint = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'budgets'
      AND CONSTRAINT_NAME = 'chk_budgets_warning_threshold'
      AND CONSTRAINT_TYPE = 'CHECK'
);
SET @violations = (
    SELECT COUNT(*) FROM budgets
    WHERE warning_threshold < 0 OR warning_threshold > 100
);
SET @ddl = IF(@has_constraint = 0 AND @violations = 0,
    'ALTER TABLE budgets ADD CONSTRAINT chk_budgets_warning_threshold CHECK (warning_threshold BETWEEN 0 AND 100)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_constraint = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'savings_goals'
      AND CONSTRAINT_NAME = 'chk_savings_goals_amounts'
      AND CONSTRAINT_TYPE = 'CHECK'
);
SET @violations = (
    SELECT COUNT(*) FROM savings_goals
    WHERE target_amount <= 0 OR current_amount < 0
);
SET @ddl = IF(@has_constraint = 0 AND @violations = 0,
    'ALTER TABLE savings_goals ADD CONSTRAINT chk_savings_goals_amounts CHECK (target_amount > 0 AND current_amount >= 0)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallets'
      AND INDEX_NAME = 'idx_wallets_user_active'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE wallets ADD INDEX idx_wallets_user_active (user_id, is_active)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallets'
      AND INDEX_NAME = 'idx_wallets_space_active'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE wallets ADD INDEX idx_wallets_space_active (space_id, is_active)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'savings_goals'
      AND INDEX_NAME = 'idx_goals_space_status'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE savings_goals ADD INDEX idx_goals_space_status (space_id, status)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND INDEX_NAME = 'idx_transactions_user_date'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE transactions ADD INDEX idx_transactions_user_date (user_id, transaction_date)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallets'
      AND COLUMN_NAME = 'opening_balance'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE wallets ADD COLUMN opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER balance',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE transactions MODIFY COLUMN type VARCHAR(20) NOT NULL;
