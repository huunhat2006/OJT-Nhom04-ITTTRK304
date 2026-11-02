
-- Admin password: Admin@1234  |  User password: User@1234
-- ============================================================

-- ── 1. Users ─────────────────────────────────────────────────
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@bton.app',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lheO',
 'System Administrator', 'ADMIN', TRUE);

INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active) VALUES
('nguyen.van.a', 'nguyenvana@example.com',
 '$2a$10$FCA.9j3jnxQJQNh.vISuB.qJQ2/3LGx0w5DEr0.Zo0hv3C0nOigeG',
 'Nguyễn Văn A', '0901234567', 'USER', TRUE),
('tran.thi.b', 'tranthib@example.com',
 '$2a$10$FCA.9j3jnxQJQNh.vISuB.qJQ2/3LGx0w5DEr0.Zo0hv3C0nOigeG',
 'Trần Thị B', '0912345678', 'USER', TRUE),
('le.van.c', 'levanc@example.com',
 '$2a$10$FCA.9j3jnxQJQNh.vISuB.qJQ2/3LGx0w5DEr0.Zo0hv3C0nOigeG',
 'Lê Văn C', '0923456789', 'USER', TRUE);

-- Capture user IDs by username
SET @uid_a  = (SELECT id FROM users WHERE username = 'nguyen.van.a');
SET @uid_b  = (SELECT id FROM users WHERE username = 'tran.thi.b');

-- ── 2. Financial Spaces ───────────────────────────────────────
INSERT INTO financial_spaces (name, description, type, currency, owner_id) VALUES
('Tài chính cá nhân',  'Không gian tài chính cá nhân của Nguyễn Văn A', 'PERSONAL', 'VND', @uid_a),
('Tài chính cá nhân',  'Không gian tài chính cá nhân của Trần Thị B',   'PERSONAL', 'VND', @uid_b),
('Tài chính gia đình', 'Không gian tài chính gia đình',                  'FAMILY',   'VND', @uid_a);

-- Capture space IDs
SET @space_a      = (SELECT id FROM financial_spaces WHERE owner_id = @uid_a AND type = 'PERSONAL');
SET @space_family = (SELECT id FROM financial_spaces WHERE type = 'FAMILY');

-- ── 3. Family Members ─────────────────────────────────────────
INSERT INTO family_members (space_id, user_id, role, invited_by) VALUES
(@space_family, @uid_a, 'OWNER',  NULL),
(@space_family, @uid_b, 'MEMBER', @uid_a);

-- ── 4. Category ID helpers ───────────────────────────────────
SET @cat_salary        = (SELECT id FROM categories WHERE name = 'Salary'         AND is_system = TRUE LIMIT 1);
SET @cat_freelance     = (SELECT id FROM categories WHERE name = 'Freelance'       AND is_system = TRUE LIMIT 1);
SET @cat_investment_in = (SELECT id FROM categories WHERE name = 'Investment'      AND is_system = TRUE AND type = 'INCOME'  LIMIT 1);
SET @cat_gift          = (SELECT id FROM categories WHERE name = 'Gift'            AND is_system = TRUE LIMIT 1);
SET @cat_food          = (SELECT id FROM categories WHERE name = 'Food & Dining'   AND is_system = TRUE LIMIT 1);
SET @cat_transport     = (SELECT id FROM categories WHERE name = 'Transportation'  AND is_system = TRUE LIMIT 1);
SET @cat_housing       = (SELECT id FROM categories WHERE name = 'Housing'         AND is_system = TRUE LIMIT 1);
SET @cat_health        = (SELECT id FROM categories WHERE name = 'Healthcare'      AND is_system = TRUE LIMIT 1);
SET @cat_education     = (SELECT id FROM categories WHERE name = 'Education'       AND is_system = TRUE LIMIT 1);
SET @cat_shopping      = (SELECT id FROM categories WHERE name = 'Shopping'        AND is_system = TRUE LIMIT 1);
SET @cat_entertainment = (SELECT id FROM categories WHERE name = 'Entertainment'   AND is_system = TRUE LIMIT 1);
SET @cat_utilities     = (SELECT id FROM categories WHERE name = 'Utilities'       AND is_system = TRUE LIMIT 1);
SET @cat_comms         = (SELECT id FROM categories WHERE name = 'Communication'   AND is_system = TRUE LIMIT 1);
SET @cat_savings       = (SELECT id FROM categories WHERE name = 'Savings'         AND is_system = TRUE LIMIT 1);

-- ── 5. Transactions ───────────────────────────────────────────
-- October 2026
INSERT INTO transactions (space_id, user_id, category_id, type, amount, description, transaction_date) VALUES
(@space_a, @uid_a, @cat_salary,        'INCOME',  15000000.00, 'Lương tháng 10',                '2026-10-01'),
(@space_a, @uid_a, @cat_freelance,     'INCOME',   3000000.00, 'Thu nhập freelance thiết kế web','2026-10-10'),
(@space_a, @uid_a, @cat_food,          'EXPENSE',  2500000.00, 'Tiền ăn uống tháng 10',         '2026-10-05'),
(@space_a, @uid_a, @cat_transport,     'EXPENSE',   800000.00, 'Xăng xe tháng 10',              '2026-10-06'),
(@space_a, @uid_a, @cat_housing,       'EXPENSE',  3000000.00, 'Tiền thuê nhà',                 '2026-10-01'),
(@space_a, @uid_a, @cat_health,        'EXPENSE',   500000.00, 'Khám bệnh',                     '2026-10-08'),
(@space_a, @uid_a, @cat_shopping,      'EXPENSE',  1200000.00, 'Mua quần áo',                   '2026-10-12'),
(@space_a, @uid_a, @cat_utilities,     'EXPENSE',   400000.00, 'Hóa đơn điện nước',             '2026-10-15'),
(@space_a, @uid_a, @cat_comms,         'EXPENSE',   150000.00, 'Phí điện thoại',                '2026-10-05');

-- September 2026
INSERT INTO transactions (space_id, user_id, category_id, type, amount, description, transaction_date) VALUES
(@space_a, @uid_a, @cat_salary,        'INCOME',  15000000.00, 'Lương tháng 9',           '2026-09-01'),
(@space_a, @uid_a, @cat_gift,          'INCOME',    500000.00, 'Quà sinh nhật',            '2026-09-15'),
(@space_a, @uid_a, @cat_food,          'EXPENSE',  2200000.00, 'Tiền ăn uống tháng 9',    '2026-09-05'),
(@space_a, @uid_a, @cat_transport,     'EXPENSE',   750000.00, 'Xăng xe tháng 9',         '2026-09-06'),
(@space_a, @uid_a, @cat_housing,       'EXPENSE',  3000000.00, 'Tiền thuê nhà',            '2026-09-01'),
(@space_a, @uid_a, @cat_education,     'EXPENSE',  2000000.00, 'Học tiếng Anh',            '2026-09-10'),
(@space_a, @uid_a, @cat_entertainment, 'EXPENSE',   600000.00, 'Xem phim, giải trí',       '2026-09-20');

-- August 2026
INSERT INTO transactions (space_id, user_id, category_id, type, amount, description, transaction_date) VALUES
(@space_a, @uid_a, @cat_salary,        'INCOME',  15000000.00, 'Lương tháng 8',           '2026-08-01'),
(@space_a, @uid_a, @cat_investment_in, 'INCOME',   2000000.00, 'Lợi nhuận đầu tư',        '2026-08-20'),
(@space_a, @uid_a, @cat_food,          'EXPENSE',  2800000.00, 'Tiền ăn uống tháng 8',    '2026-08-05'),
(@space_a, @uid_a, @cat_transport,     'EXPENSE',   900000.00, 'Xăng xe tháng 8',         '2026-08-06'),
(@space_a, @uid_a, @cat_housing,       'EXPENSE',  3000000.00, 'Tiền thuê nhà',            '2026-08-01'),
(@space_a, @uid_a, @cat_shopping,      'EXPENSE',   800000.00, 'Mua sắm linh tinh',        '2026-08-15'),
(@space_a, @uid_a, @cat_utilities,     'EXPENSE',   380000.00, 'Hóa đơn điện nước',        '2026-08-15'),
(@space_a, @uid_a, @cat_savings,       'EXPENSE',  2000000.00, 'Tiết kiệm hàng tháng',     '2026-08-25');

-- ── 6. Budgets (October 2026) ─────────────────────────────────
INSERT INTO budgets (space_id, user_id, category_id, amount, month, year) VALUES
(@space_a, @uid_a, @cat_food,          3000000.00, 10, 2026),
(@space_a, @uid_a, @cat_transport,     1000000.00, 10, 2026),
(@space_a, @uid_a, @cat_housing,       3500000.00, 10, 2026),
(@space_a, @uid_a, @cat_shopping,      1500000.00, 10, 2026),
(@space_a, @uid_a, @cat_entertainment,  800000.00, 10, 2026),
(@space_a, @uid_a, @cat_utilities,      500000.00, 10, 2026);

-- ── 7. Savings Goals ─────────────────────────────────────────
INSERT INTO savings_goals (space_id, user_id, name, description, target_amount, current_amount, start_date, deadline, status, icon, color) VALUES
(@space_a, @uid_a, 'Mua laptop mới',  'Tiết kiệm mua MacBook Pro M3',  35000000.00, 12000000.00, '2026-01-01', '2026-12-31', 'IN_PROGRESS', 'laptop', '#1890ff'),
(@space_a, @uid_a, 'Quỹ du lịch hè',  'Du lịch Đà Nẵng - Hội An',     10000000.00,  6500000.00, '2026-01-01', '2026-07-31', 'COMPLETED',   'car',    '#52c41a'),
(@space_a, @uid_a, 'Quỹ khẩn cấp',    'Dự phòng 3 tháng lương',        45000000.00, 15000000.00, '2026-06-01', '2027-06-01', 'IN_PROGRESS', 'safety', '#faad14');

-- ── 8. Notifications ─────────────────────────────────────────
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(@uid_a, 'Cảnh báo ngân sách',          'Ngân sách Ăn uống tháng 10 đã sử dụng 83%. Hãy kiểm soát chi tiêu!', 'BUDGET_WARNING', FALSE),
(@uid_a, 'Chào mừng bạn đến với BTON!', 'Cảm ơn bạn đã đăng ký. Hãy bắt đầu quản lý tài chính thông minh.',  'SYSTEM',         TRUE),
(@uid_a, 'Mục tiêu đã hoàn thành!',     'Chúc mừng! Bạn đã hoàn thành mục tiêu "Quỹ du lịch hè".',           'GOAL_ACHIEVED',  FALSE);
