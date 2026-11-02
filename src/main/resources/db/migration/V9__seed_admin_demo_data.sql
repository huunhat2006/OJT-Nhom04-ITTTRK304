
SET @admin_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);

INSERT INTO financial_spaces (name, description, type, currency, owner_id, is_active)
SELECT 'Tài chính cá nhân - Admin',
       'Không gian tài chính cá nhân của quản trị viên',
       'PERSONAL', 'VND', @admin_id, TRUE
FROM DUAL
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM financial_spaces
      WHERE owner_id = @admin_id AND type = 'PERSONAL' AND is_active = TRUE
  );

SET @admin_personal = (
    SELECT id FROM financial_spaces
    WHERE owner_id = @admin_id AND type = 'PERSONAL' AND is_active = TRUE
    ORDER BY id LIMIT 1
);

INSERT INTO financial_spaces (name, description, type, currency, owner_id, invite_code, is_active)
SELECT 'Gia đình Admin',
       'Không gian tài chính gia đình của quản trị viên',
       'FAMILY', 'VND', @admin_id, 'FAM-ADMIN-01', TRUE
FROM DUAL
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM financial_spaces
      WHERE owner_id = @admin_id AND type = 'FAMILY' AND is_active = TRUE
  );

SET @admin_family = (
    SELECT id FROM financial_spaces
    WHERE owner_id = @admin_id AND type = 'FAMILY' AND is_active = TRUE
    ORDER BY id LIMIT 1
);

INSERT INTO family_members (space_id, user_id, role, is_active)
SELECT @admin_family, @admin_id, 'OWNER', TRUE
FROM DUAL
WHERE @admin_family IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM family_members
      WHERE space_id = @admin_family AND user_id = @admin_id
  );

INSERT INTO wallets (user_id, space_id, name, wallet_type, currency, balance, is_shared, is_active)
SELECT @admin_id, @admin_personal, 'Ví tiền mặt - Admin', 'CASH', 'VND', 5000000.00, FALSE, TRUE
FROM DUAL
WHERE @admin_personal IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM wallets WHERE space_id = @admin_personal AND name = 'Ví tiền mặt - Admin'
  );

INSERT INTO wallets (user_id, space_id, name, wallet_type, currency, balance, is_shared, is_active)
SELECT @admin_id, @admin_personal, 'Thẻ ngân hàng - Admin', 'BANK', 'VND', 25000000.00, FALSE, TRUE
FROM DUAL
WHERE @admin_personal IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM wallets WHERE space_id = @admin_personal AND name = 'Thẻ ngân hàng - Admin'
  );

INSERT INTO wallets (user_id, space_id, name, wallet_type, currency, balance, is_shared, is_active)
SELECT @admin_id, @admin_family, 'Quỹ sinh hoạt gia đình - Admin', 'BANK', 'VND', 15000000.00, TRUE, TRUE
FROM DUAL
WHERE @admin_family IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM wallets WHERE space_id = @admin_family AND name = 'Quỹ sinh hoạt gia đình - Admin'
  );

SET @wallet_cash = (
    SELECT id FROM wallets WHERE space_id = @admin_personal AND name = 'Ví tiền mặt - Admin' LIMIT 1
);
SET @wallet_bank = (
    SELECT id FROM wallets WHERE space_id = @admin_personal AND name = 'Thẻ ngân hàng - Admin' LIMIT 1
);
SET @wallet_family = (
    SELECT id FROM wallets WHERE space_id = @admin_family AND name = 'Quỹ sinh hoạt gia đình - Admin' LIMIT 1
);

-- ── 5. Transactions (only when the space has none yet) ──────
INSERT INTO transactions (space_id, user_id, category_id, wallet_id, type, amount, description, transaction_date)
SELECT * FROM (
    SELECT @admin_personal AS space_id, @admin_id AS user_id, 1  AS category_id,
           @wallet_bank   AS wallet_id, 'INCOME'  AS type, 25000000.00 AS amount,
           'Lương tháng hiện tại' AS description,
           DATE_FORMAT(CURDATE(), '%Y-%m-01') AS transaction_date
    UNION ALL
    SELECT @admin_personal, @admin_id, 3, @wallet_bank, 'INCOME', 3000000.00,
           'Thu nhập đầu tư', DATE_FORMAT(CURDATE(), '%Y-%m-10')
    UNION ALL
    SELECT @admin_personal, @admin_id, 7, @wallet_cash, 'EXPENSE', 2500000.00,
           'Tiền ăn uống', DATE_FORMAT(CURDATE(), '%Y-%m-05')
    UNION ALL
    SELECT @admin_personal, @admin_id, 8, @wallet_cash, 'EXPENSE', 800000.00,
           'Xăng xe', DATE_FORMAT(CURDATE(), '%Y-%m-06')
    UNION ALL
    SELECT @admin_personal, @admin_id, 9, @wallet_bank, 'EXPENSE', 1200000.00,
           'Mua sắm', DATE_FORMAT(CURDATE(), '%Y-%m-12')
    UNION ALL
    SELECT @admin_personal, @admin_id, 10, @wallet_cash, 'EXPENSE', 500000.00,
           'Khám bệnh', DATE_FORMAT(CURDATE(), '%Y-%m-08')
    UNION ALL
    SELECT @admin_personal, @admin_id, 14, @wallet_bank, 'EXPENSE', 400000.00,
           'Hóa đơn điện nước', DATE_FORMAT(CURDATE(), '%Y-%m-15')
    UNION ALL
    SELECT @admin_personal, @admin_id, 15, @wallet_cash, 'EXPENSE', 150000.00,
           'Phí điện thoại', DATE_FORMAT(CURDATE(), '%Y-%m-05')
    UNION ALL
    SELECT @admin_personal, @admin_id, 1, @wallet_bank, 'INCOME', 24000000.00,
           'Lương tháng trước', DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-01')
    UNION ALL
    SELECT @admin_personal, @admin_id, 7, @wallet_cash, 'EXPENSE', 2200000.00,
           'Tiền ăn uống tháng trước', DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-05')
) t
WHERE @admin_personal IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM transactions WHERE space_id = @admin_personal);

-- Family space transactions
INSERT INTO transactions (space_id, user_id, category_id, wallet_id, type, amount, description, transaction_date)
SELECT * FROM (
    SELECT @admin_family AS space_id, @admin_id AS user_id, 1 AS category_id,
           @wallet_family AS wallet_id, 'INCOME' AS type, 20000000.00 AS amount,
           'Thu nhập gia đình' AS description,
           DATE_FORMAT(CURDATE(), '%Y-%m-01') AS transaction_date
    UNION ALL
    SELECT @admin_family, @admin_id, 7, @wallet_family, 'EXPENSE', 3500000.00,
           'Chi tiêu sinh hoạt gia đình', DATE_FORMAT(CURDATE(), '%Y-%m-07')
    UNION ALL
    SELECT @admin_family, @admin_id, 14, @wallet_family, 'EXPENSE', 900000.00,
           'Điện nước gia đình', DATE_FORMAT(CURDATE(), '%Y-%m-10')
) t
WHERE @admin_family IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM transactions WHERE space_id = @admin_family);

-- ── 6. Budgets (current month) ──────────────────────────────
INSERT INTO budgets (space_id, user_id, category_id, amount, budget_month, budget_year, warning_threshold)
SELECT * FROM (
    SELECT @admin_personal AS space_id, @admin_id AS user_id, 7  AS category_id,
           3000000.00 AS amount, MONTH(CURDATE()) AS budget_month, YEAR(CURDATE()) AS budget_year, 80.00 AS warning_threshold
    UNION ALL
    SELECT @admin_personal, @admin_id, 8, 1000000.00, MONTH(CURDATE()), YEAR(CURDATE()), 80.00
    UNION ALL
    SELECT @admin_personal, @admin_id, 9, 1500000.00, MONTH(CURDATE()), YEAR(CURDATE()), 80.00
    UNION ALL
    SELECT @admin_personal, @admin_id, 14, 500000.00, MONTH(CURDATE()), YEAR(CURDATE()), 80.00
) b
WHERE @admin_personal IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM budgets
      WHERE space_id = @admin_personal
        AND budget_month = MONTH(CURDATE())
        AND budget_year = YEAR(CURDATE())
  );

INSERT INTO budgets (space_id, user_id, category_id, amount, budget_month, budget_year, warning_threshold)
SELECT @admin_family, @admin_id, 7, 5000000.00, MONTH(CURDATE()), YEAR(CURDATE()), 80.00
FROM DUAL
WHERE @admin_family IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM budgets
      WHERE space_id = @admin_family
        AND budget_month = MONTH(CURDATE())
        AND budget_year = YEAR(CURDATE())
  );

-- ── 7. Savings goals ────────────────────────────────────────
INSERT INTO savings_goals (space_id, user_id, name, description, target_amount, current_amount,
                           start_date, deadline, status, icon, color)
SELECT * FROM (
    SELECT @admin_personal AS space_id, @admin_id AS user_id,
           'Mua laptop mới' AS name, 'Tiết kiệm mua MacBook Pro M3' AS description,
           35000000.00 AS target_amount, 12000000.00 AS current_amount,
           DATE_FORMAT(CURDATE(), '%Y-01-01') AS start_date,
           DATE_FORMAT(CURDATE() + INTERVAL 6 MONTH, '%Y-12-31') AS deadline,
           'IN_PROGRESS' AS status, 'laptop' AS icon, '#1890ff' AS color
    UNION ALL
    SELECT @admin_personal, @admin_id,
           'Quỹ du lịch', 'Du lịch Đà Nẵng - Hội An',
           10000000.00, 6500000.00,
           DATE_FORMAT(CURDATE(), '%Y-01-01'),
           DATE_FORMAT(CURDATE() + INTERVAL 3 MONTH, '%Y-%m-%d'),
           'IN_PROGRESS', 'car', '#52c41a'
    UNION ALL
    SELECT @admin_personal, @admin_id,
           'Quỹ khẩn cấp', 'Dự phòng 3 tháng lương',
           45000000.00, 15000000.00,
           DATE_FORMAT(CURDATE(), '%Y-01-01'),
           DATE_FORMAT(CURDATE() + INTERVAL 1 YEAR, '%Y-%m-%d'),
           'IN_PROGRESS', 'safety', '#faad14'
) g
WHERE @admin_personal IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM savings_goals WHERE space_id = @admin_personal);

-- ── 8. Notifications ────────────────────────────────────────
INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT @admin_id, 'Chào mừng Admin!', 'Dữ liệu demo đã được khởi tạo cho tài khoản quản trị.', 'SYSTEM', FALSE
FROM DUAL
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM notifications WHERE user_id = @admin_id AND title = 'Chào mừng Admin!'
  );
