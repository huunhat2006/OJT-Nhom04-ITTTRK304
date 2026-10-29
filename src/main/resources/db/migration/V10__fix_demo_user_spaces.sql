
SET @hoangphuc_id = (SELECT id FROM users WHERE username = 'hoangphuc' LIMIT 1);
SET @thephong_id  = (SELECT id FROM users WHERE username = 'thephong'  LIMIT 1);
SET @manhthang_id = (SELECT id FROM users WHERE username = 'manhthang' LIMIT 1);
SET @huunhat_id   = (SELECT id FROM users WHERE username = 'huunhat'   LIMIT 1);

-- ── 1. Rename the mis-named personal space of hoangphuc ─────
UPDATE financial_spaces
SET name = 'Tài chính cá nhân - Hoàng Phúc'
WHERE owner_id = @hoangphuc_id
  AND type = 'PERSONAL'
  AND name IN ('Gia đình Hữu Nhật', 'Tài chính cá nhân');

-- Rename the real family space of huunhat
UPDATE financial_spaces
SET name = 'Gia đình Hữu Nhật'
WHERE owner_id = @huunhat_id
  AND type = 'FAMILY'
  AND name = 'Tài chính gia đình';

SET @family_space = (
    SELECT id FROM financial_spaces
    WHERE owner_id = @huunhat_id AND type = 'FAMILY' AND is_active = TRUE
    ORDER BY id LIMIT 1
);

-- ── 2. Remove memberships that point to PERSONAL spaces ─────
DELETE fm FROM family_members fm
JOIN financial_spaces fs ON fs.id = fm.space_id
WHERE fs.type = 'PERSONAL';

-- ── 3. Move thephong / manhthang into the real family space ─
INSERT INTO family_members (space_id, user_id, role, is_active)
SELECT @family_space, @thephong_id, 'MEMBER', TRUE
FROM DUAL
WHERE @family_space IS NOT NULL
  AND @thephong_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM family_members
      WHERE space_id = @family_space AND user_id = @thephong_id
  );

INSERT INTO family_members (space_id, user_id, role, is_active)
SELECT @family_space, @manhthang_id, 'MEMBER', TRUE
FROM DUAL
WHERE @family_space IS NOT NULL
  AND @manhthang_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM family_members
      WHERE space_id = @family_space AND user_id = @manhthang_id
  );

-- Ensure huunhat is the OWNER member of the family space
INSERT INTO family_members (space_id, user_id, role, is_active)
SELECT @family_space, @huunhat_id, 'OWNER', TRUE
FROM DUAL
WHERE @family_space IS NOT NULL
  AND @huunhat_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM family_members
      WHERE space_id = @family_space AND user_id = @huunhat_id
  );

-- ── 4. Personal space + default wallet for demo users ───────
INSERT INTO financial_spaces (name, description, type, currency, owner_id, is_active)
SELECT CONCAT('Tài chính cá nhân - ', u.full_name),
       CONCAT('Không gian tài chính cá nhân của ', u.full_name),
       'PERSONAL', 'VND', u.id, TRUE
FROM users u
WHERE u.username IN ('hoangphuc', 'thephong', 'manhthang')
  AND NOT EXISTS (
      SELECT 1 FROM financial_spaces fs
      WHERE fs.owner_id = u.id AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
  );

INSERT INTO wallets (user_id, space_id, name, wallet_type, currency, balance, is_shared, is_active)
SELECT fs.owner_id, fs.id, 'Tiền mặt', 'CASH', 'VND', 0.00, FALSE, TRUE
FROM financial_spaces fs
JOIN users u ON u.id = fs.owner_id
WHERE u.username IN ('hoangphuc', 'thephong', 'manhthang')
  AND fs.type = 'PERSONAL'
  AND fs.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM wallets w WHERE w.space_id = fs.id AND w.name = 'Tiền mặt'
  );

-- ── 5. Small demo dataset for these personal spaces ─────────
INSERT INTO transactions (space_id, user_id, category_id, wallet_id, type, amount, description, transaction_date)
SELECT fs.id, u.id, x.category_id,
       (SELECT w.id FROM wallets w WHERE w.space_id = fs.id ORDER BY w.id LIMIT 1),
       x.type, x.amount, x.description,
       DATE_FORMAT(CURDATE(), x.date_format)
FROM users u
JOIN financial_spaces fs ON fs.owner_id = u.id AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
JOIN (
    SELECT 1 AS category_id, 'INCOME'  AS type, 15000000.00 AS amount, 'Lương tháng hiện tại' AS description, '%Y-%m-01' AS date_format
    UNION ALL
    SELECT 7,  'EXPENSE', 3000000.00, 'Tiền ăn uống',       '%Y-%m-05'
    UNION ALL
    SELECT 8,  'EXPENSE',  800000.00, 'Xăng xe',            '%Y-%m-06'
    UNION ALL
    SELECT 9,  'EXPENSE', 1200000.00, 'Mua sắm',            '%Y-%m-10'
    UNION ALL
    SELECT 14, 'EXPENSE',  400000.00, 'Hóa đơn điện nước',  '%Y-%m-15'
) x
WHERE u.username IN ('hoangphuc', 'thephong', 'manhthang')
  AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.space_id = fs.id);

INSERT INTO budgets (space_id, user_id, category_id, amount, budget_month, budget_year, warning_threshold)
SELECT fs.id, u.id, x.category_id, x.amount, MONTH(CURDATE()), YEAR(CURDATE()), 80.00
FROM users u
JOIN financial_spaces fs ON fs.owner_id = u.id AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
JOIN (
    SELECT 7 AS category_id, 3000000.00 AS amount
    UNION ALL SELECT 8, 1000000.00
    UNION ALL SELECT 9, 1500000.00
    UNION ALL SELECT 14, 500000.00
) x
WHERE u.username IN ('hoangphuc', 'thephong', 'manhthang')
  AND NOT EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.space_id = fs.id
        AND b.budget_month = MONTH(CURDATE())
        AND b.budget_year = YEAR(CURDATE())
  );

INSERT INTO savings_goals (space_id, user_id, name, description, target_amount, current_amount,
                           start_date, deadline, status, icon, color)
SELECT fs.id, u.id, 'Quỹ khẩn cấp', 'Dự phòng 3 tháng lương',
       30000000.00, 5000000.00,
       DATE_FORMAT(CURDATE(), '%Y-01-01'),
       DATE_FORMAT(CURDATE() + INTERVAL 1 YEAR, '%Y-%m-%d'),
       'IN_PROGRESS', 'safety', '#faad14'
FROM users u
JOIN financial_spaces fs ON fs.owner_id = u.id AND fs.type = 'PERSONAL' AND fs.is_active = TRUE
WHERE u.username IN ('hoangphuc', 'thephong', 'manhthang')
  AND NOT EXISTS (SELECT 1 FROM savings_goals g WHERE g.space_id = fs.id);
