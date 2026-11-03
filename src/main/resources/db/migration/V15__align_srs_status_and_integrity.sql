-- ============================================================
-- V15 - Align SRS statuses, add missing integrity constraints
--
-- Additive / in-place changes only. The application still writes
-- full_name, is_active, financial_spaces, ... ; SRS aliases stay
-- generated columns so JPA entities and the SRS remain compatible.
--
-- Contents:
--   1. users.status       -> ACTIVE / BLOCKED   (SRS UC15)
--   2. transactions.status-> ACTIVE / DELETED   (SRS 2.4)
--   3. wallets.currency   -> VARCHAR(10)        (same as spaces)
--   4. audit_logs.admin_id -> nullable          (allow user-level logs)
--   5. FK for family_id columns (wallets/budgets/family_members)
--   6. Unique category name per user + type (active rows only)
--   7. Reporting index on transactions
-- ============================================================

-- ------------------------------------------------------------
-- 1. USERS.STATUS: ACTIVE / BLOCKED
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'status'
);
SET @ddl = IF(@has_column > 0,
    'ALTER TABLE users DROP COLUMN status',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE users
    ADD COLUMN status VARCHAR(20)
        GENERATED ALWAYS AS (CASE WHEN is_active THEN 'ACTIVE' ELSE 'BLOCKED' END) STORED;

-- ------------------------------------------------------------
-- 2. TRANSACTIONS.STATUS: ACTIVE / DELETED
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND COLUMN_NAME = 'status'
);
SET @ddl = IF(@has_column > 0,
    'ALTER TABLE transactions DROP COLUMN status',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE transactions
    ADD COLUMN status VARCHAR(20)
        GENERATED ALWAYS AS (CASE WHEN is_deleted THEN 'DELETED' ELSE 'ACTIVE' END) STORED;

-- ------------------------------------------------------------
-- 3. WALLETS.CURRENCY: align length with financial_spaces
-- ------------------------------------------------------------

ALTER TABLE wallets
    MODIFY COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'VND';

-- ------------------------------------------------------------
-- 4. AUDIT_LOGS.ADMIN_ID: allow user-level actions (UC02, UC05)
-- ------------------------------------------------------------

ALTER TABLE audit_logs
    MODIFY COLUMN admin_id BIGINT NULL;

-- ------------------------------------------------------------
-- 5. FAMILY_ID FOREIGN KEYS
--    Clean orphans first, then add the constraint if missing.
-- ------------------------------------------------------------

UPDATE wallets w
LEFT JOIN financial_spaces fs ON fs.id = w.family_id
SET w.family_id = NULL
WHERE w.family_id IS NOT NULL
  AND fs.id IS NULL;

SET @has_fk = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallets'
      AND COLUMN_NAME = 'family_id'
      AND REFERENCED_TABLE_NAME = 'financial_spaces'
);
SET @ddl = IF(@has_fk = 0,
    'ALTER TABLE wallets ADD CONSTRAINT fk_wallets_family FOREIGN KEY (family_id) REFERENCES financial_spaces(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE budgets b
LEFT JOIN financial_spaces fs ON fs.id = b.family_id
SET b.family_id = NULL
WHERE b.family_id IS NOT NULL
  AND fs.id IS NULL;

SET @has_fk = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'budgets'
      AND COLUMN_NAME = 'family_id'
      AND REFERENCED_TABLE_NAME = 'financial_spaces'
);
SET @ddl = IF(@has_fk = 0,
    'ALTER TABLE budgets ADD CONSTRAINT fk_budgets_family FOREIGN KEY (family_id) REFERENCES financial_spaces(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE family_members fm
LEFT JOIN financial_spaces fs ON fs.id = fm.family_id
SET fm.family_id = NULL
WHERE fm.family_id IS NOT NULL
  AND fs.id IS NULL;

SET @has_fk = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'family_members'
      AND COLUMN_NAME = 'family_id'
      AND REFERENCED_TABLE_NAME = 'financial_spaces'
);
SET @ddl = IF(@has_fk = 0,
    'ALTER TABLE family_members ADD CONSTRAINT fk_family_members_family FOREIGN KEY (family_id) REFERENCES financial_spaces(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 6. CATEGORY NAME UNIQUENESS (user + type + name, active rows)
--    A generated key is used instead of a partial index so that
--    archived categories do not block re-creating the same name.
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'categories'
      AND COLUMN_NAME = 'active_name_key'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE categories ADD COLUMN active_name_key VARCHAR(100) GENERATED ALWAYS AS (CASE WHEN is_active THEN name END) STORED',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @dup = (
    SELECT COUNT(*) FROM (
        SELECT user_id, type, active_name_key, COUNT(*) AS c
        FROM categories
        WHERE user_id IS NOT NULL
          AND active_name_key IS NOT NULL
        GROUP BY user_id, type, active_name_key
        HAVING c > 1
    ) AS d
);

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'categories'
      AND INDEX_NAME = 'uk_categories_user_type_name'
);
SET @ddl = IF(@has_index = 0 AND @dup = 0,
    'ALTER TABLE categories ADD UNIQUE KEY uk_categories_user_type_name (user_id, type, active_name_key)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 7. REPORTING INDEX
--    Covers monthly reports and the budget spent_amount lookups.
-- ------------------------------------------------------------

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND INDEX_NAME = 'idx_transactions_report'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE transactions ADD INDEX idx_transactions_report (space_id, type, is_deleted, transaction_date)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
