

-- Income categories (system-defined)
INSERT INTO categories (name, name_vi, type, icon, color, is_system, user_id, display_order) VALUES
('Salary', 'Lương', 'INCOME', 'wallet', '#52c41a', TRUE, NULL, 1),
('Business', 'Kinh doanh', 'INCOME', 'shop', '#1890ff', TRUE, NULL, 2),
('Investment', 'Đầu tư', 'INCOME', 'rise', '#722ed1', TRUE, NULL, 3),
('Freelance', 'Làm thêm', 'INCOME', 'laptop', '#13c2c2', TRUE, NULL, 4),
('Gift', 'Quà tặng', 'INCOME', 'gift', '#eb2f96', TRUE, NULL, 5),
('Other Income', 'Thu nhập khác', 'INCOME', 'dollar', '#faad14', TRUE, NULL, 6);

-- Expense categories (system-defined)
INSERT INTO categories (name, name_vi, type, icon, color, is_system, user_id, display_order) VALUES
('Food & Dining', 'Ăn uống', 'EXPENSE', 'coffee', '#fa8c16', TRUE, NULL, 10),
('Transportation', 'Di chuyển', 'EXPENSE', 'car', '#1890ff', TRUE, NULL, 11),
('Housing', 'Nhà ở', 'EXPENSE', 'home', '#52c41a', TRUE, NULL, 12),
('Healthcare', 'Y tế', 'EXPENSE', 'heart', '#ff4d4f', TRUE, NULL, 13),
('Education', 'Giáo dục', 'EXPENSE', 'book', '#722ed1', TRUE, NULL, 14),
('Shopping', 'Mua sắm', 'EXPENSE', 'shopping', '#eb2f96', TRUE, NULL, 15),
('Entertainment', 'Giải trí', 'EXPENSE', 'smile', '#faad14', TRUE, NULL, 16),
('Utilities', 'Tiện ích', 'EXPENSE', 'thunder', '#13c2c2', TRUE, NULL, 17),
('Communication', 'Liên lạc', 'EXPENSE', 'phone', '#2f54eb', TRUE, NULL, 18),
('Personal Care', 'Chăm sóc cá nhân', 'EXPENSE', 'user', '#ff7a45', TRUE, NULL, 19),
('Insurance', 'Bảo hiểm', 'EXPENSE', 'safety', '#36cfc9', TRUE, NULL, 20),
('Investment', 'Đầu tư', 'EXPENSE', 'fund', '#9254de', TRUE, NULL, 21),
('Savings', 'Tiết kiệm', 'EXPENSE', 'bank', '#40a9ff', TRUE, NULL, 22),
('Other Expense', 'Chi phí khác', 'EXPENSE', 'ellipsis', '#8c8c8c', TRUE, NULL, 23);
