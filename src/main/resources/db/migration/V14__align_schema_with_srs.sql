-- ============================================================
-- V14 - Align schema with SRS
--
-- Additive only:
--   * no column mapped by a JPA entity is renamed, retyped or dropped
--   * derived SRS fields are implemented as generated columns
--   * cross-table fields (family_id, role_id, spent_amount) are kept in
--     sync by single-statement triggers (no DELIMITER required)
--   * financial_spaces stays the physical table; `families` is a view
-- ============================================================

-- ------------------------------------------------------------
-- 1. ROLES (SRS: role table instead of users.role ENUM)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (code, name, description) VALUES
('ROLE_USER',  'Người dùng',     'Người dùng thông thường'),
('ROLE_ADMIN', 'Quản trị viên',  'Quản trị viên hệ thống')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- ------------------------------------------------------------
-- 2. USERS: name / avatar / status / role_id
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'name'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE users
        ADD COLUMN name VARCHAR(100) GENERATED ALWAYS AS (full_name) STORED,
        ADD COLUMN avatar VARCHAR(500) GENERATED ALWAYS AS (avatar_url) STORED,
        ADD COLUMN status VARCHAR(20) GENERATED ALWAYS AS (CASE WHEN is_active THEN ''ACTIVE'' ELSE ''INACTIVE'' END) STORED,
        ADD COLUMN role_id BIGINT NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role_id'
      AND REFERENCED_TABLE_NAME = 'roles'
);
SET @ddl = IF(@has_fk = 0,
    'ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND INDEX_NAME = 'idx_users_role_id'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE users ADD INDEX idx_users_role_id (role_id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users u
JOIN roles r ON r.code = CONCAT('ROLE_', u.role)
SET u.role_id = r.id
WHERE u.role_id IS NULL;

DROP TRIGGER IF EXISTS trg_users_role_bi;
CREATE TRIGGER trg_users_role_bi BEFORE INSERT ON users FOR EACH ROW
SET NEW.role_id = COALESCE(NEW.role_id, (SELECT r.id FROM roles r WHERE r.code = CONCAT('ROLE_', NEW.role)));

DROP TRIGGER IF EXISTS trg_users_role_bu;
CREATE TRIGGER trg_users_role_bu BEFORE UPDATE ON users FOR EACH ROW
SET NEW.role_id = COALESCE(NEW.role_id, (SELECT r.id FROM roles r WHERE r.code = CONCAT('ROLE_', NEW.role)));

-- ------------------------------------------------------------
-- 3. FAMILIES view over financial_spaces (SRS keeps a families table)
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW families AS
SELECT id,
       name,
       description,
       owner_id,
       currency,
       invite_code,
       is_active,
       created_at,
       updated_at
FROM financial_spaces
WHERE type = 'FAMILY';

-- ------------------------------------------------------------
-- 4. FAMILY_MEMBERS: family_id / role_in_family
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'family_members'
      AND COLUMN_NAME = 'family_id'
);
-- family_id mirrors space_id, but MySQL rejects a generated column based on a
-- foreign key column (ERROR 1215), so it is maintained by triggers instead.
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE family_members
        ADD COLUMN family_id BIGINT NULL,
        ADD COLUMN role_in_family VARCHAR(20) GENERATED ALWAYS AS (CAST(role AS CHAR)) STORED',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE family_members
SET family_id = space_id
WHERE family_id IS NULL;

DROP TRIGGER IF EXISTS trg_family_members_family_bi;
CREATE TRIGGER trg_family_members_family_bi BEFORE INSERT ON family_members FOR EACH ROW
SET NEW.family_id = NEW.space_id;

DROP TRIGGER IF EXISTS trg_family_members_family_bu;
CREATE TRIGGER trg_family_members_family_bu BEFORE UPDATE ON family_members FOR EACH ROW
SET NEW.family_id = NEW.space_id;

-- ------------------------------------------------------------
-- 5. CATEGORIES: is_default (SRS) mirrors is_system
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'categories'
      AND COLUMN_NAME = 'is_default'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE categories ADD COLUMN is_default BOOLEAN GENERATED ALWAYS AS (is_system) STORED',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 6. WALLETS: family_id / status
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallets'
      AND COLUMN_NAME = 'family_id'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE wallets
        ADD COLUMN family_id BIGINT NULL,
        ADD COLUMN status VARCHAR(20) GENERATED ALWAYS AS (CASE WHEN is_active THEN ''ACTIVE'' ELSE ''INACTIVE'' END) STORED',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallets'
      AND INDEX_NAME = 'idx_wallets_family'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE wallets ADD INDEX idx_wallets_family (family_id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE wallets w
JOIN financial_spaces fs ON fs.id = w.space_id
SET w.family_id = fs.id
WHERE fs.type = 'FAMILY'
  AND w.family_id IS NULL;

DROP TRIGGER IF EXISTS trg_wallets_family_bi;
CREATE TRIGGER trg_wallets_family_bi BEFORE INSERT ON wallets FOR EACH ROW
SET NEW.family_id = (SELECT fs.id FROM financial_spaces fs WHERE fs.id = NEW.space_id AND fs.type = 'FAMILY');

DROP TRIGGER IF EXISTS trg_wallets_family_bu;
CREATE TRIGGER trg_wallets_family_bu BEFORE UPDATE ON wallets FOR EACH ROW
SET NEW.family_id = (SELECT fs.id FROM financial_spaces fs WHERE fs.id = NEW.space_id AND fs.type = 'FAMILY');

-- ------------------------------------------------------------
-- 7. TRANSACTIONS: fee / status
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND COLUMN_NAME = 'fee'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE transactions
        ADD COLUMN fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00 AFTER amount,
        ADD COLUMN status VARCHAR(20) GENERATED ALWAYS AS (CASE WHEN is_deleted THEN ''DELETED'' ELSE ''COMPLETED'' END) STORED',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_constraint = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND CONSTRAINT_NAME = 'chk_transactions_fee'
      AND CONSTRAINT_TYPE = 'CHECK'
);
SET @violations = (SELECT COUNT(*) FROM transactions WHERE fee < 0);
SET @ddl = IF(@has_constraint = 0 AND @violations = 0,
    'ALTER TABLE transactions ADD CONSTRAINT chk_transactions_fee CHECK (fee >= 0)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_constraint = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND CONSTRAINT_NAME = 'chk_transactions_type_valid'
      AND CONSTRAINT_TYPE = 'CHECK'
);
SET @violations = (SELECT COUNT(*) FROM transactions WHERE type NOT IN ('INCOME', 'EXPENSE', 'TRANSFER'));
SET @ddl = IF(@has_constraint = 0 AND @violations = 0,
    'ALTER TABLE transactions ADD CONSTRAINT chk_transactions_type_valid CHECK (type IN (''INCOME'', ''EXPENSE'', ''TRANSFER''))',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 8. TRANSACTION_RECEIPTS: sync with transactions.receipt_url
-- ------------------------------------------------------------

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transaction_receipts'
      AND INDEX_NAME = 'uk_receipts_transaction_url'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE transaction_receipts ADD UNIQUE KEY uk_receipts_transaction_url (transaction_id, file_url)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO transaction_receipts (transaction_id, file_url, file_name)
SELECT t.id, t.receipt_url, SUBSTRING_INDEX(t.receipt_url, '/', -1)
FROM transactions t
WHERE t.receipt_url IS NOT NULL
  AND t.receipt_url <> ''
ON DUPLICATE KEY UPDATE file_name = VALUES(file_name);

DROP TRIGGER IF EXISTS trg_tx_receipt_ai;
CREATE TRIGGER trg_tx_receipt_ai AFTER INSERT ON transactions FOR EACH ROW
INSERT INTO transaction_receipts (transaction_id, file_url, file_name)
SELECT NEW.id, NEW.receipt_url, SUBSTRING_INDEX(NEW.receipt_url, '/', -1)
FROM DUAL
WHERE NEW.receipt_url IS NOT NULL
  AND NEW.receipt_url <> ''
ON DUPLICATE KEY UPDATE file_name = VALUES(file_name);

DROP TRIGGER IF EXISTS trg_tx_receipt_au_ins;
CREATE TRIGGER trg_tx_receipt_au_ins AFTER UPDATE ON transactions FOR EACH ROW
INSERT INTO transaction_receipts (transaction_id, file_url, file_name)
SELECT NEW.id, NEW.receipt_url, SUBSTRING_INDEX(NEW.receipt_url, '/', -1)
FROM DUAL
WHERE NEW.receipt_url IS NOT NULL
  AND NEW.receipt_url <> ''
ON DUPLICATE KEY UPDATE file_name = VALUES(file_name);

DROP TRIGGER IF EXISTS trg_tx_receipt_au_del;
CREATE TRIGGER trg_tx_receipt_au_del AFTER UPDATE ON transactions FOR EACH ROW
DELETE FROM transaction_receipts
WHERE transaction_id = NEW.id
  AND OLD.receipt_url IS NOT NULL
  AND OLD.receipt_url <> ''
  AND (NEW.receipt_url IS NULL OR NEW.receipt_url = '' OR NEW.receipt_url <> OLD.receipt_url)
  AND file_url = OLD.receipt_url;

-- ------------------------------------------------------------
-- 9. BUDGETS: name / start_date / end_date / spent_amount / status / family_id
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'budgets'
      AND COLUMN_NAME = 'spent_amount'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE budgets
        ADD COLUMN name VARCHAR(100) NULL,
        ADD COLUMN spent_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        ADD COLUMN family_id BIGINT NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'budgets'
      AND COLUMN_NAME = 'start_date'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE budgets
        ADD COLUMN start_date DATE GENERATED ALWAYS AS (DATE(DATE_ADD(MAKEDATE(budget_year, 1), INTERVAL (budget_month - 1) MONTH))) STORED,
        ADD COLUMN end_date DATE GENERATED ALWAYS AS (LAST_DAY(DATE_ADD(MAKEDATE(budget_year, 1), INTERVAL (budget_month - 1) MONTH))) STORED',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'budgets'
      AND COLUMN_NAME = 'status'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE budgets
        ADD COLUMN status VARCHAR(20) GENERATED ALWAYS AS (
            CASE
                WHEN spent_amount >= amount THEN ''EXCEEDED''
                WHEN amount > 0 AND spent_amount >= amount * warning_threshold / 100 THEN ''WARNING''
                ELSE ''ACTIVE''
            END
        ) STORED',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'budgets'
      AND INDEX_NAME = 'idx_budgets_family'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE budgets ADD INDEX idx_budgets_family (family_id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE budgets b
JOIN financial_spaces fs ON fs.id = b.space_id
SET b.family_id = fs.id
WHERE fs.type = 'FAMILY'
  AND b.family_id IS NULL;

UPDATE budgets b
JOIN categories c ON c.id = b.category_id
SET b.name = COALESCE(b.name, CONCAT(c.name, ' ', b.budget_month, '/', b.budget_year));

UPDATE budgets b
SET b.spent_amount = (
    SELECT COALESCE(SUM(t.amount), 0)
    FROM transactions t
    WHERE t.space_id = b.space_id
      AND t.type = 'EXPENSE'
      AND t.is_deleted = 0
      AND YEAR(t.transaction_date) = b.budget_year
      AND MONTH(t.transaction_date) = b.budget_month
      AND t.category_id = b.category_id
);

DROP TRIGGER IF EXISTS trg_budgets_srs_bi;
CREATE TRIGGER trg_budgets_srs_bi BEFORE INSERT ON budgets FOR EACH ROW
SET NEW.family_id = (SELECT fs.id FROM financial_spaces fs WHERE fs.id = NEW.space_id AND fs.type = 'FAMILY'),
    NEW.name = COALESCE(NEW.name, (SELECT c.name FROM categories c WHERE c.id = NEW.category_id));

DROP TRIGGER IF EXISTS trg_budgets_srs_bu;
CREATE TRIGGER trg_budgets_srs_bu BEFORE UPDATE ON budgets FOR EACH ROW
SET NEW.family_id = (SELECT fs.id FROM financial_spaces fs WHERE fs.id = NEW.space_id AND fs.type = 'FAMILY'),
    NEW.name = COALESCE(NEW.name, (SELECT c.name FROM categories c WHERE c.id = NEW.category_id));

-- ------------------------------------------------------------
-- 10. BUDGET_CATEGORIES: keep junction in sync with budgets.category_id
-- ------------------------------------------------------------

INSERT INTO budget_categories (budget_id, category_id)
SELECT b.id, b.category_id
FROM budgets b
ON DUPLICATE KEY UPDATE category_id = VALUES(category_id);

DROP TRIGGER IF EXISTS trg_budgets_bc_ai;
CREATE TRIGGER trg_budgets_bc_ai AFTER INSERT ON budgets FOR EACH ROW
INSERT INTO budget_categories (budget_id, category_id) VALUES (NEW.id, NEW.category_id)
ON DUPLICATE KEY UPDATE category_id = VALUES(category_id);

DROP TRIGGER IF EXISTS trg_budgets_bc_au;
CREATE TRIGGER trg_budgets_bc_au AFTER UPDATE ON budgets FOR EACH ROW
UPDATE budget_categories SET category_id = NEW.category_id
WHERE budget_id = NEW.id
  AND category_id <> NEW.category_id;

DROP TRIGGER IF EXISTS trg_budgets_bc_ad;
CREATE TRIGGER trg_budgets_bc_ad AFTER DELETE ON budgets FOR EACH ROW
DELETE FROM budget_categories WHERE budget_id = OLD.id;

-- ------------------------------------------------------------
-- 11. TRANSACTIONS -> budgets.spent_amount
--      Aggregation is per budgets.category_id (the only mode the app uses).
--      budget_categories is intentionally not read here: MySQL raises
--      ERROR 1442 if a trigger reads a table that another trigger in the
--      same chain (trg_budgets_bc_*) writes to.
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_tx_budget_ai;
CREATE TRIGGER trg_tx_budget_ai AFTER INSERT ON transactions FOR EACH ROW
UPDATE budgets b
SET b.spent_amount = (
    SELECT COALESCE(SUM(t.amount), 0)
    FROM transactions t
    WHERE t.space_id = b.space_id
      AND t.type = 'EXPENSE'
      AND t.is_deleted = 0
      AND YEAR(t.transaction_date) = b.budget_year
      AND MONTH(t.transaction_date) = b.budget_month
      AND t.category_id = b.category_id
)
WHERE b.space_id = NEW.space_id
  AND b.budget_year = YEAR(NEW.transaction_date)
  AND b.budget_month = MONTH(NEW.transaction_date)
  AND b.category_id = NEW.category_id;

DROP TRIGGER IF EXISTS trg_tx_budget_au;
CREATE TRIGGER trg_tx_budget_au AFTER UPDATE ON transactions FOR EACH ROW
UPDATE budgets b
SET b.spent_amount = (
    SELECT COALESCE(SUM(t.amount), 0)
    FROM transactions t
    WHERE t.space_id = b.space_id
      AND t.type = 'EXPENSE'
      AND t.is_deleted = 0
      AND YEAR(t.transaction_date) = b.budget_year
      AND MONTH(t.transaction_date) = b.budget_month
      AND t.category_id = b.category_id
)
WHERE (b.space_id = NEW.space_id
       AND b.budget_year = YEAR(NEW.transaction_date)
       AND b.budget_month = MONTH(NEW.transaction_date)
       AND b.category_id = NEW.category_id)
   OR (b.space_id = OLD.space_id
       AND b.budget_year = YEAR(OLD.transaction_date)
       AND b.budget_month = MONTH(OLD.transaction_date)
       AND b.category_id = OLD.category_id);

DROP TRIGGER IF EXISTS trg_tx_budget_ad;
CREATE TRIGGER trg_tx_budget_ad AFTER DELETE ON transactions FOR EACH ROW
UPDATE budgets b
SET b.spent_amount = (
    SELECT COALESCE(SUM(t.amount), 0)
    FROM transactions t
    WHERE t.space_id = b.space_id
      AND t.type = 'EXPENSE'
      AND t.is_deleted = 0
      AND YEAR(t.transaction_date) = b.budget_year
      AND MONTH(t.transaction_date) = b.budget_month
      AND t.category_id = b.category_id
)
WHERE b.space_id = OLD.space_id
  AND b.budget_year = YEAR(OLD.transaction_date)
  AND b.budget_month = MONTH(OLD.transaction_date)
  AND b.category_id = OLD.category_id;

-- ------------------------------------------------------------
-- 12. AUDIT_LOGS: user_id / entity_name / entity_id / timestamp
-- ------------------------------------------------------------

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'audit_logs'
      AND COLUMN_NAME = 'user_id'
);
SET @ddl = IF(@has_column = 0,
    'ALTER TABLE audit_logs
        ADD COLUMN user_id BIGINT NULL,
        ADD COLUMN entity_name VARCHAR(50) NULL,
        ADD COLUMN entity_id BIGINT NULL,
        ADD COLUMN `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'audit_logs'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_NAME = 'users'
);
SET @ddl = IF(@has_fk = 0,
    'ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'audit_logs'
      AND INDEX_NAME = 'idx_audit_user'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE audit_logs ADD INDEX idx_audit_user (user_id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE audit_logs
SET user_id = admin_id,
    entity_name = target_type,
    entity_id = target_id,
    `timestamp` = created_at;

DROP TRIGGER IF EXISTS trg_audit_srs_bi;
CREATE TRIGGER trg_audit_srs_bi BEFORE INSERT ON audit_logs FOR EACH ROW
SET NEW.user_id = COALESCE(NEW.user_id, NEW.admin_id),
    NEW.entity_name = COALESCE(NEW.entity_name, NEW.target_type),
    NEW.entity_id = COALESCE(NEW.entity_id, NEW.target_id),
    NEW.`timestamp` = COALESCE(NEW.`timestamp`, NEW.created_at);

DROP TRIGGER IF EXISTS trg_audit_srs_bu;
CREATE TRIGGER trg_audit_srs_bu BEFORE UPDATE ON audit_logs FOR EACH ROW
SET NEW.user_id = COALESCE(NEW.user_id, NEW.admin_id),
    NEW.entity_name = COALESCE(NEW.entity_name, NEW.target_type),
    NEW.entity_id = COALESCE(NEW.entity_id, NEW.target_id);

-- ------------------------------------------------------------
-- 13. RECURRING_TRANSACTIONS (SRS WBS - giao dịch định kỳ)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recurring_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    space_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    wallet_id BIGINT,
    category_id BIGINT,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(500),
    frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    interval_count INT NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_run_date DATE,
    last_run_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_recurring_space (space_id) REFERENCES financial_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY fk_recurring_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_recurring_wallet (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY fk_recurring_category (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE KEY uk_recurring_signature (space_id, user_id, wallet_id, category_id, type, amount, frequency, start_date),
    INDEX idx_recurring_space (space_id),
    INDEX idx_recurring_user (user_id),
    INDEX idx_recurring_next_run (is_active, next_run_date),
    CONSTRAINT chk_recurring_amount CHECK (amount > 0),
    CONSTRAINT chk_recurring_interval CHECK (interval_count >= 1),
    CONSTRAINT chk_recurring_type CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    CONSTRAINT chk_recurring_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
