
-- Users table
CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Financial spaces table (personal or family)
CREATE TABLE financial_spaces (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    type ENUM('PERSONAL', 'FAMILY') NOT NULL DEFAULT 'PERSONAL',
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    owner_id BIGINT NOT NULL,
    invite_code VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_spaces_owner (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_spaces_owner (owner_id),
    INDEX idx_spaces_type (type),
    INDEX idx_spaces_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Family members table (for FAMILY type spaces)
CREATE TABLE family_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    space_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    FOREIGN KEY fk_members_space (space_id) REFERENCES financial_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY fk_members_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_members_invited_by (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_members_space_user (space_id, user_id),
    INDEX idx_members_space (space_id),
    INDEX idx_members_user (user_id),
    INDEX idx_members_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table (system + user-defined)
CREATE TABLE categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    type ENUM('INCOME', 'EXPENSE', 'BOTH') NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(20),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    user_id BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_categories_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_categories_type (type),
    INDEX idx_categories_system (is_system),
    INDEX idx_categories_user (user_id),
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions table
CREATE TABLE transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    space_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    type ENUM('INCOME', 'EXPENSE') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(500),
    transaction_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_transactions_space (space_id) REFERENCES financial_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY fk_transactions_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_transactions_category (category_id) REFERENCES categories(id),
    INDEX idx_transactions_space (space_id),
    INDEX idx_transactions_user (user_id),
    INDEX idx_transactions_category (category_id),
    INDEX idx_transactions_type (type),
    INDEX idx_transactions_date (transaction_date),
    INDEX idx_transactions_date_space (space_id, transaction_date),
    INDEX idx_transactions_type_space (space_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budgets table (monthly per category)
CREATE TABLE budgets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    space_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    warning_threshold DECIMAL(5, 2) NOT NULL DEFAULT 80.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_budgets_space (space_id) REFERENCES financial_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY fk_budgets_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_budgets_category (category_id) REFERENCES categories(id),
    UNIQUE KEY uk_budget_space_category_month (space_id, category_id, month, year),
    INDEX idx_budgets_space (space_id),
    INDEX idx_budgets_user (user_id),
    INDEX idx_budgets_month_year (month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Savings goals table
CREATE TABLE savings_goals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    space_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    deadline DATE,
    status ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    icon VARCHAR(100),
    color VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_goals_space (space_id) REFERENCES financial_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY fk_goals_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_goals_space (space_id),
    INDEX idx_goals_user (user_id),
    INDEX idx_goals_status (status),
    INDEX idx_goals_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('BUDGET_WARNING', 'BUDGET_EXCEEDED', 'GOAL_ACHIEVED', 'GOAL_DEADLINE', 'FAMILY_INVITE', 'SYSTEM') NOT NULL,
    related_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_notifications_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wallets table (money sources: cash, bank, e-wallet)
CREATE TABLE wallets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    space_id BIGINT,
    name VARCHAR(100) NOT NULL,
    wallet_type ENUM('CASH', 'BANK', 'E_WALLET') NOT NULL DEFAULT 'CASH',
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_wallets_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_wallets_space (space_id) REFERENCES financial_spaces(id) ON DELETE SET NULL,
    INDEX idx_wallets_user (user_id),
    INDEX idx_wallets_space (space_id),
    INDEX idx_wallets_type (wallet_type),
    INDEX idx_wallets_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table (JWT refresh token storage)
CREATE TABLE refresh_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_refresh_tokens_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_token (token(255)),
    INDEX idx_refresh_tokens_revoked (is_revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transaction receipts table (attached invoice images)
CREATE TABLE transaction_receipts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_receipts_transaction (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_receipts_transaction (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budget categories junction table (many categories per budget)
CREATE TABLE budget_categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    budget_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY fk_budget_categories_budget (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
    FOREIGN KEY fk_budget_categories_category (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY uk_budget_category (budget_id, category_id),
    INDEX idx_budget_categories_budget (budget_id),
    INDEX idx_budget_categories_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add wallet_id column to transactions table
ALTER TABLE transactions
    ADD COLUMN wallet_id BIGINT,
    ADD FOREIGN KEY fk_transactions_wallet (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    ADD INDEX idx_transactions_wallet (wallet_id);

-- Audit logs table (admin actions)
CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    admin_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id BIGINT,
    description TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_audit_admin (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_admin (admin_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_target (target_type, target_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
