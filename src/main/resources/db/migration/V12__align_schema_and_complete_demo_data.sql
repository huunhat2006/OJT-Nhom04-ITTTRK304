
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

SET @has_column = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'wallets'
      AND COLUMN_NAME = 'version'
);
SET @ddl = IF(@has_column > 0,
    'ALTER TABLE wallets DROP COLUMN version',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE transactions MODIFY COLUMN type VARCHAR(20) NOT NULL;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions'
      AND INDEX_NAME = 'idx_transactions_space_deleted_date'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE transactions ADD INDEX idx_transactions_space_deleted_date (space_id, is_deleted, transaction_date)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions'
      AND INDEX_NAME = 'idx_transactions_space_wallet'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE transactions ADD INDEX idx_transactions_space_wallet (space_id, wallet_id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets'
      AND INDEX_NAME = 'idx_budgets_space_period'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE budgets ADD INDEX idx_budgets_space_period (space_id, budget_year, budget_month)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'family_members'
      AND INDEX_NAME = 'idx_family_members_user_active'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE family_members ADD INDEX idx_family_members_user_active (user_id, is_active)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
      AND INDEX_NAME = 'idx_notifications_user_read_created'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE notifications ADD INDEX idx_notifications_user_read_created (user_id, is_read, created_at)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_tokens'
      AND INDEX_NAME = 'idx_refresh_tokens_expiry'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE refresh_tokens ADD INDEX idx_refresh_tokens_expiry (expiry_date)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financial_spaces'
      AND INDEX_NAME = 'uk_spaces_invite_code'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE financial_spaces ADD UNIQUE KEY uk_spaces_invite_code (invite_code)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_tokens'
      AND INDEX_NAME = 'uk_refresh_tokens_token'
);
SET @ddl = IF(@has_index = 0,
    'ALTER TABLE refresh_tokens ADD UNIQUE KEY uk_refresh_tokens_token (token)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_tokens'
      AND INDEX_NAME = 'idx_refresh_tokens_token'
);
SET @ddl = IF(@has_index > 0,
    'ALTER TABLE refresh_tokens DROP INDEX idx_refresh_tokens_token',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DELETE FROM users WHERE username IN ('nguyen.van.a', 'tran.thi.b', 'le.van.c');

-- Password for every team account: Password123!
SET @pw_user = '$2a$10$wqEaogl8Gt.wKEc7raIlKuRhluuHTOabgi.hDxQwMIH4DuNvmayJ6';

INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active) VALUES
('huunhat',   'huunhat@finance.app',   @pw_user, 'Trần Hữu Nhật',     '0912345678', 'USER', TRUE),
('hoangphuc', 'hoangphuc@finance.app', @pw_user, 'Nguyễn Hoàng Phúc', '0923456789', 'USER', TRUE),
('thephong',  'thephong@finance.app',  @pw_user, 'La Thế Phong',      '0934567890', 'USER', TRUE),
('manhthang', 'manhthang@finance.app', @pw_user, 'Nguyễn Mạnh Thắng', '0945678901', 'USER', TRUE)
ON DUPLICATE KEY UPDATE
    email     = VALUES(email),
    full_name = VALUES(full_name),
    phone     = VALUES(phone),
    role      = VALUES(role),
    is_active = TRUE;

SET @admin_id    = (SELECT id FROM users WHERE username = 'admin'     LIMIT 1);
SET @huunhat_id  = (SELECT id FROM users WHERE username = 'huunhat'   LIMIT 1);
SET @hoangphuc_id= (SELECT id FROM users WHERE username = 'hoangphuc' LIMIT 1);
SET @thephong_id = (SELECT id FROM users WHERE username = 'thephong'  LIMIT 1);
SET @manhthang_id= (SELECT id FROM users WHERE username = 'manhthang' LIMIT 1);

-- ============================================================
-- 3. PERSONAL + FAMILY SPACES
-- ============================================================

INSERT INTO financial_spaces (name, description, type, currency, owner_id, is_active)
SELECT CONCAT('Tài chính cá nhân - ', u.full_name),
       CONCAT('Không gian tài chính cá nhân của ', u.full_name),
       'PERSONAL', 'VND', u.id, TRUE
FROM users u
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND NOT EXISTS (
      SELECT 1 FROM financial_spaces fs
      WHERE fs.owner_id = u.id AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
  );

UPDATE financial_spaces fs
JOIN users u ON u.id = fs.owner_id
SET fs.name = CONCAT('Tài chính cá nhân - ', u.full_name),
    fs.description = CONCAT('Không gian tài chính cá nhân của ', u.full_name)
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND fs.type = 'PERSONAL' AND fs.is_active = TRUE;

INSERT INTO financial_spaces (name, description, type, currency, owner_id, invite_code, is_active)
SELECT 'Gia đình Hữu Nhật', 'Quỹ tài chính và thu chi chung của gia đình',
       'FAMILY', 'VND', @huunhat_id, 'FAM-8924-XN', TRUE
FROM DUAL
WHERE @huunhat_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM financial_spaces
      WHERE owner_id = @huunhat_id AND type = 'FAMILY' AND is_active = TRUE
  );

UPDATE financial_spaces
SET name = 'Gia đình Hữu Nhật',
    invite_code = COALESCE(invite_code, 'FAM-8924-XN')
WHERE owner_id = @huunhat_id AND type = 'FAMILY' AND is_active = TRUE;

SET @family_id = (
    SELECT id FROM financial_spaces
    WHERE owner_id = @huunhat_id AND type = 'FAMILY' AND is_active = TRUE
    ORDER BY id LIMIT 1
);

-- Memberships must never point to a PERSONAL space (legacy init.sql bug).
DELETE fm FROM family_members fm
JOIN financial_spaces fs ON fs.id = fm.space_id
WHERE fs.type = 'PERSONAL';

INSERT INTO family_members (space_id, user_id, role, is_active)
SELECT @family_id, u.id,
       CASE u.username
           WHEN 'huunhat' THEN 'OWNER'
           WHEN 'hoangphuc' THEN 'ADMIN'
           ELSE 'MEMBER'
       END,
       TRUE
FROM users u
WHERE @family_id IS NOT NULL
  AND u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
ON DUPLICATE KEY UPDATE role = VALUES(role), is_active = TRUE;

-- Every family space must have its owner listed as OWNER.
INSERT INTO family_members (space_id, user_id, role, is_active)
SELECT fs.id, fs.owner_id, 'OWNER', TRUE
FROM financial_spaces fs
WHERE fs.type = 'FAMILY' AND fs.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.space_id = fs.id AND fm.user_id = fs.owner_id
  );

-- ============================================================
-- 4. WALLETS
-- ============================================================

INSERT INTO wallets (user_id, space_id, name, wallet_type, currency, balance, opening_balance, is_shared, is_active)
SELECT fs.owner_id, fs.id, 'Ví tiền mặt', 'CASH', 'VND', 5000000.00, 0.00, FALSE, TRUE
FROM financial_spaces fs
JOIN users u ON u.id = fs.owner_id
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.space_id = fs.id AND w.user_id = fs.owner_id
        AND w.wallet_type = 'CASH' AND w.is_active = TRUE
  );

INSERT INTO wallets (user_id, space_id, name, wallet_type, currency, balance, opening_balance, is_shared, is_active)
SELECT fs.owner_id, fs.id, 'Thẻ ngân hàng', 'BANK', 'VND', 10000000.00, 0.00, FALSE, TRUE
FROM financial_spaces fs
JOIN users u ON u.id = fs.owner_id
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.space_id = fs.id AND w.user_id = fs.owner_id
        AND w.wallet_type = 'BANK' AND w.is_active = TRUE
  );

INSERT INTO wallets (user_id, space_id, name, wallet_type, currency, balance, opening_balance, is_shared, is_active)
SELECT @huunhat_id, @family_id, 'Quỹ sinh hoạt gia đình', 'BANK', 'VND', 5000000.00, 0.00, TRUE, TRUE
FROM DUAL
WHERE @family_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.space_id = @family_id AND w.wallet_type = 'BANK'
        AND w.is_shared = TRUE AND w.is_active = TRUE
  );

-- ============================================================
-- 5. DEMO TRANSACTIONS (only for spaces that have none yet)
-- ============================================================

INSERT INTO transactions (space_id, user_id, category_id, wallet_id, type, amount, description, transaction_date)
SELECT fs.id, fs.owner_id, x.category_id,
       (SELECT w.id FROM wallets w
        WHERE w.space_id = fs.id AND w.wallet_type = x.wallet_type AND w.is_active = TRUE
        ORDER BY w.id LIMIT 1),
       x.type, x.amount, x.description,
       DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL x.month_offset MONTH), x.date_format)
FROM financial_spaces fs
JOIN users u ON u.id = fs.owner_id
JOIN (
    SELECT 1 AS category_id, 'BANK' AS wallet_type, 'INCOME' AS type,
           15000000.00 AS amount, 'Lương tháng này' AS description,
           0 AS month_offset, '%Y-%m-01' AS date_format
    UNION ALL SELECT 4,  'BANK',  'INCOME',  3000000.00, 'Thu nhập freelance',          0, '%Y-%m-10'
    UNION ALL SELECT 9,  'BANK',  'EXPENSE', 3000000.00, 'Tiền thuê nhà',               0, '%Y-%m-01'
    UNION ALL SELECT 7,  'CASH',  'EXPENSE', 2500000.00, 'Tiền ăn uống',                0, '%Y-%m-05'
    UNION ALL SELECT 8,  'CASH',  'EXPENSE',  800000.00, 'Xăng xe',                     0, '%Y-%m-06'
    UNION ALL SELECT 12, 'BANK',  'EXPENSE', 1200000.00, 'Mua sắm',                     0, '%Y-%m-12'
    UNION ALL SELECT 14, 'BANK',  'EXPENSE',  400000.00, 'Hóa đơn điện nước',           0, '%Y-%m-15'
    UNION ALL SELECT 15, 'CASH',  'EXPENSE',  150000.00, 'Phí điện thoại',              0, '%Y-%m-05'
    UNION ALL SELECT 1,  'BANK',  'INCOME',  15000000.00, 'Lương tháng trước',           1, '%Y-%m-01'
    UNION ALL SELECT 7,  'CASH',  'EXPENSE', 2200000.00, 'Tiền ăn uống tháng trước',    1, '%Y-%m-05'
    UNION ALL SELECT 8,  'CASH',  'EXPENSE',  750000.00, 'Xăng xe tháng trước',         1, '%Y-%m-06'
    UNION ALL SELECT 9,  'BANK',  'EXPENSE', 3000000.00, 'Tiền thuê nhà tháng trước',   1, '%Y-%m-01'
    UNION ALL SELECT 11, 'BANK',  'EXPENSE', 2000000.00, 'Học tiếng Anh',               1, '%Y-%m-10'
    UNION ALL SELECT 13, 'CASH',  'EXPENSE',  600000.00, 'Xem phim, giải trí',          1, '%Y-%m-20'
    UNION ALL SELECT 1,  'BANK',  'INCOME',  15000000.00, 'Lương hai tháng trước',       2, '%Y-%m-01'
    UNION ALL SELECT 3,  'BANK',  'INCOME',   2000000.00, 'Lợi nhuận đầu tư',            2, '%Y-%m-20'
    UNION ALL SELECT 7,  'CASH',  'EXPENSE', 2800000.00, 'Tiền ăn uống hai tháng trước',2, '%Y-%m-05'
    UNION ALL SELECT 8,  'CASH',  'EXPENSE',  900000.00, 'Xăng xe hai tháng trước',     2, '%Y-%m-06'
    UNION ALL SELECT 9,  'BANK',  'EXPENSE', 3000000.00, 'Tiền thuê nhà hai tháng trước',2, '%Y-%m-01'
    UNION ALL SELECT 12, 'CASH',  'EXPENSE',  800000.00, 'Mua sắm linh tinh',           2, '%Y-%m-15'
    UNION ALL SELECT 14, 'BANK',  'EXPENSE',  380000.00, 'Hóa đơn điện nước',           2, '%Y-%m-15'
    UNION ALL SELECT 19, 'BANK',  'EXPENSE', 2000000.00, 'Tiết kiệm hàng tháng',        2, '%Y-%m-25'
) x
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
  AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.space_id = fs.id);

-- Family space transactions
INSERT INTO transactions (space_id, user_id, category_id, wallet_id, type, amount, description, transaction_date)
SELECT @family_id, @huunhat_id, x.category_id,
       (SELECT w.id FROM wallets w
        WHERE w.space_id = @family_id AND w.wallet_type = 'BANK'
          AND w.is_shared = TRUE AND w.is_active = TRUE
        ORDER BY w.id LIMIT 1),
       x.type, x.amount, x.description,
       DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL x.month_offset MONTH), x.date_format)
FROM (
    SELECT 1 AS category_id, 'INCOME' AS type, 20000000.00 AS amount,
           'Thu nhập gia đình' AS description, 0 AS month_offset, '%Y-%m-01' AS date_format
    UNION ALL SELECT 7,  'EXPENSE', 3500000.00, 'Chi tiêu sinh hoạt gia đình', 0, '%Y-%m-07'
    UNION ALL SELECT 14, 'EXPENSE',  900000.00, 'Điện nước gia đình',          0, '%Y-%m-10'
    UNION ALL SELECT 12, 'EXPENSE', 1500000.00, 'Mua sắm gia đình',            0, '%Y-%m-12'
    UNION ALL SELECT 13, 'EXPENSE',  700000.00, 'Giải trí cuối tuần',          0, '%Y-%m-18'
    UNION ALL SELECT 1,  'INCOME',  20000000.00, 'Thu nhập gia đình tháng trước', 1, '%Y-%m-01'
    UNION ALL SELECT 7,  'EXPENSE', 3200000.00, 'Chi tiêu sinh hoạt tháng trước', 1, '%Y-%m-07'
    UNION ALL SELECT 14, 'EXPENSE',  850000.00, 'Điện nước tháng trước',        1, '%Y-%m-10'
) x
WHERE @family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.space_id = @family_id);

-- ============================================================
-- 6. BUDGETS (current month)
-- ============================================================

INSERT INTO budgets (space_id, user_id, category_id, amount, budget_month, budget_year, warning_threshold)
SELECT fs.id, fs.owner_id, x.category_id, x.amount,
       MONTH(CURDATE()), YEAR(CURDATE()), 80.00
FROM financial_spaces fs
JOIN users u ON u.id = fs.owner_id
JOIN (
    SELECT 7 AS category_id, 3000000.00 AS amount
    UNION ALL SELECT 8,  1000000.00
    UNION ALL SELECT 9,  3500000.00
    UNION ALL SELECT 12, 1500000.00
    UNION ALL SELECT 13,  800000.00
    UNION ALL SELECT 14,  500000.00
) x
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.space_id = fs.id
        AND b.budget_month = MONTH(CURDATE())
        AND b.budget_year = YEAR(CURDATE())
  );

INSERT INTO budgets (space_id, user_id, category_id, amount, budget_month, budget_year, warning_threshold)
SELECT @family_id, @huunhat_id, x.category_id, x.amount,
       MONTH(CURDATE()), YEAR(CURDATE()), 80.00
FROM (
    SELECT 7 AS category_id, 5000000.00 AS amount
    UNION ALL SELECT 12, 2000000.00
    UNION ALL SELECT 14, 2000000.00
) x
WHERE @family_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.space_id = @family_id
        AND b.budget_month = MONTH(CURDATE())
        AND b.budget_year = YEAR(CURDATE())
  );

-- ============================================================
-- 7. SAVINGS GOALS
-- ============================================================

INSERT INTO savings_goals (space_id, user_id, name, description, target_amount, current_amount,
                           start_date, deadline, status, icon, color)
SELECT fs.id, fs.owner_id, x.name, x.description, x.target_amount, x.current_amount,
       DATE_FORMAT(CURDATE(), '%Y-01-01'),
       DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL x.months MONTH), '%Y-%m-%d'),
       x.status, x.icon, x.color
FROM financial_spaces fs
JOIN users u ON u.id = fs.owner_id
JOIN (
    SELECT 'Mua laptop mới' AS name, 'Tiết kiệm mua MacBook Pro M3' AS description,
           35000000.00 AS target_amount, 12000000.00 AS current_amount,
           6 AS months, 'IN_PROGRESS' AS status, 'laptop' AS icon, '#1890ff' AS color
    UNION ALL
    SELECT 'Quỹ du lịch hè', 'Du lịch Đà Nẵng - Hội An',
           10000000.00, 10000000.00, 3, 'COMPLETED', 'car', '#52c41a'
    UNION ALL
    SELECT 'Quỹ khẩn cấp', 'Dự phòng 3 tháng lương',
           45000000.00, 15000000.00, 12, 'IN_PROGRESS', 'safety', '#faad14'
) x
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
  AND NOT EXISTS (SELECT 1 FROM savings_goals g WHERE g.space_id = fs.id);

INSERT INTO savings_goals (space_id, user_id, name, description, target_amount, current_amount,
                           start_date, deadline, status, icon, color)
SELECT @family_id, @huunhat_id, 'Quỹ dự phòng gia đình', 'Dự phòng chi tiêu khẩn cấp của gia đình',
       30000000.00, 5000000.00,
       DATE_FORMAT(CURDATE(), '%Y-01-01'),
       DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 12 MONTH), '%Y-%m-%d'),
       'IN_PROGRESS', 'safety', '#faad14'
FROM DUAL
WHERE @family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM savings_goals g WHERE g.space_id = @family_id);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'Chào mừng bạn đến với BTON!',
       'Cảm ơn bạn đã đăng ký. Hãy bắt đầu quản lý tài chính thông minh.',
       'SYSTEM', FALSE
FROM users u
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id);

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'Cảnh báo ngân sách',
       'Bạn đã sử dụng trên 80% hạn mức ngân sách tháng này. Hãy kiểm soát chi tiêu!',
       'BUDGET_WARNING', FALSE
FROM users u
WHERE u.username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.user_id = u.id
        AND b.budget_month = MONTH(CURDATE())
        AND b.budget_year = YEAR(CURDATE())
  )
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = u.id AND n.type = 'BUDGET_WARNING'
  );

-- ============================================================
-- 9. RECONCILE WALLET BALANCES
--    opening_balance + (income - expense + transfers in - transfers out)
--    Existing balances are preserved; new wallets keep their initial balance.
-- ============================================================

UPDATE wallets w
JOIN (
    SELECT w2.id,
           COALESCE(SUM(CASE WHEN t.type = 'INCOME'  AND t.is_deleted = 0 THEN t.amount ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' AND t.is_deleted = 0 THEN t.amount ELSE 0 END), 0)
         + COALESCE(SUM(CASE WHEN t.type = 'TRANSFER'
                              AND t.destination_wallet_id = w2.id
                              AND t.is_deleted = 0 THEN t.amount ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN t.type = 'TRANSFER'
                              AND t.wallet_id = w2.id
                              AND t.is_deleted = 0 THEN t.amount ELSE 0 END), 0) AS net
    FROM wallets w2
    LEFT JOIN transactions t
           ON t.wallet_id = w2.id OR t.destination_wallet_id = w2.id
    GROUP BY w2.id
) n ON n.id = w.id
SET w.opening_balance = GREATEST(0, w.balance - n.net),
    w.balance = GREATEST(0, w.balance - n.net) + n.net;

-- ============================================================
-- 10. AUDIT LOG SEED (only when the table is empty)
-- ============================================================

INSERT INTO audit_logs (admin_id, action, target_type, target_id, description, ip_address)
SELECT @admin_id, 'LOGIN', 'User', @admin_id, 'Đăng nhập hệ thống', '127.0.0.1'
FROM DUAL
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM audit_logs WHERE action = 'LOGIN');

INSERT INTO audit_logs (admin_id, action, target_type, target_id, description, ip_address)
SELECT @admin_id, 'VIEW_DASHBOARD', 'System', NULL, 'Xem bảng điều khiển quản trị', '127.0.0.1'
FROM DUAL
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM audit_logs WHERE action = 'VIEW_DASHBOARD');

INSERT INTO audit_logs (admin_id, action, target_type, target_id, description, ip_address)
SELECT @admin_id, 'VIEW_USERS', 'System', NULL, 'Xem danh sách người dùng', '127.0.0.1'
FROM DUAL
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM audit_logs WHERE action = 'VIEW_USERS');
