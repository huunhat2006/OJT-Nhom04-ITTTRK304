-- Tác giả: La Thế Phong (Database & Data Lead)
-- ============================================================
-- database/init.sql  [LEGACY - KHONG DUNG CHO BAN CAI MOI]
-- Schema + seed data are managed by Flyway:
--   src/main/resources/db/migration/V1..V10
-- docker-compose does NOT mount this file anymore. Keep it only as a
-- historical reference; running it together with Flyway causes
-- duplicated/conflicting demo data.
-- ============================================================
-- database/init.sql
-- Hệ thống Quản lý Thu chi Cá nhân và Gia đình
-- Lưu ý: Toàn bộ từ khóa MySQL đều được viết thường (lowercase)
-- ============================================================

create database if not exists bton_db character set utf8mb4 collate utf8mb4_unicode_ci;
use bton_db;

-- 1. bảng users (người dùng hệ thống)
create table if not exists users (
    id bigint not null auto_increment,
    username varchar(50) not null,
    email varchar(100) not null,
    password_hash varchar(255) not null,
    full_name varchar(100) not null,
    phone varchar(20),
    avatar_url varchar(500),
    role enum('USER', 'ADMIN') not null default 'USER',
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    primary key (id),
    unique key uk_users_username (username),
    unique key uk_users_email (email),
    index idx_users_role (role),
    index idx_users_is_active (is_active)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 2. bảng financial_spaces / families (không gian tài chính cá nhân & gia đình)
create table if not exists financial_spaces (
    id bigint not null auto_increment,
    name varchar(100) not null,
    description varchar(500),
    type enum('PERSONAL', 'FAMILY') not null default 'PERSONAL',
    currency varchar(10) not null default 'VND',
    owner_id bigint not null,
    invite_code varchar(50),
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    primary key (id),
    foreign key fk_spaces_owner (owner_id) references users(id) on delete cascade,
    unique key uk_spaces_invite_code (invite_code),
    index idx_spaces_owner (owner_id),
    index idx_spaces_type (type),
    index idx_spaces_is_active (is_active)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 3. bảng family_members (thành viên gia đình)
create table if not exists family_members (
    id bigint not null auto_increment,
    space_id bigint not null,
    user_id bigint not null,
    role enum('OWNER', 'ADMIN', 'MEMBER', 'VIEWER') not null default 'MEMBER',
    joined_at timestamp not null default current_timestamp,
    invited_by bigint,
    is_active boolean not null default true,
    primary key (id),
    foreign key fk_members_space (space_id) references financial_spaces(id) on delete cascade,
    foreign key fk_members_user (user_id) references users(id) on delete cascade,
    foreign key fk_members_invited_by (invited_by) references users(id) on delete set null,
    unique key uk_members_space_user (space_id, user_id),
    index idx_members_space (space_id),
    index idx_members_user (user_id),
    index idx_members_role (role)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 4. bảng categories (danh mục thu chi)
create table if not exists categories (
    id bigint not null auto_increment,
    name varchar(100) not null,
    name_vi varchar(100),
    type enum('INCOME', 'EXPENSE', 'BOTH') not null,
    icon varchar(100),
    color varchar(20),
    is_system boolean not null default false,
    user_id bigint,
    is_active boolean not null default true,
    display_order int not null default 0,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    primary key (id),
    foreign key fk_categories_user (user_id) references users(id) on delete cascade,
    index idx_categories_type (type),
    index idx_categories_system (is_system),
    index idx_categories_user (user_id),
    index idx_categories_active (is_active)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 5. bảng wallets (ví tiền và nguồn tiền)
create table if not exists wallets (
    id bigint not null auto_increment,
    user_id bigint not null,
    space_id bigint,
    name varchar(100) not null,
    wallet_type enum('CASH', 'BANK', 'E_WALLET') not null default 'CASH',
    balance decimal(15, 2) not null default 0.00,
    currency varchar(3) not null default 'VND',
    is_shared boolean not null default false,
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    primary key (id),
    foreign key fk_wallets_user (user_id) references users(id) on delete cascade,
    foreign key fk_wallets_space (space_id) references financial_spaces(id) on delete set null,
    index idx_wallets_user (user_id),
    index idx_wallets_space (space_id)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 6. bảng transactions (giao dịch thu, chi, chuyển ví)
create table if not exists transactions (
    id bigint not null auto_increment,
    space_id bigint not null,
    user_id bigint not null,
    category_id bigint,
    wallet_id bigint,
    destination_wallet_id bigint,
    type enum('INCOME', 'EXPENSE', 'TRANSFER') not null,
    amount decimal(15, 2) not null,
    description varchar(500),
    transaction_date date not null,
    note text,
    receipt_url varchar(500),
    is_deleted boolean not null default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    primary key (id),
    foreign key fk_transactions_space (space_id) references financial_spaces(id) on delete cascade,
    foreign key fk_transactions_user (user_id) references users(id) on delete cascade,
    foreign key fk_transactions_category (category_id) references categories(id),
    foreign key fk_transactions_wallet (wallet_id) references wallets(id) on delete set null,
    foreign key fk_transactions_dest_wallet (destination_wallet_id) references wallets(id) on delete set null,
    index idx_transactions_space (space_id),
    index idx_transactions_user (user_id),
    index idx_transactions_category (category_id),
    index idx_transactions_type (type),
    index idx_transactions_date (transaction_date),
    index idx_transactions_is_deleted (is_deleted)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 7. bảng transaction_receipts (ảnh hóa đơn đính kèm giao dịch)
create table if not exists transaction_receipts (
    id bigint not null auto_increment,
    transaction_id bigint not null,
    file_url varchar(500) not null,
    file_name varchar(255) not null,
    created_at timestamp not null default current_timestamp,
    primary key (id),
    foreign key fk_receipts_tx (transaction_id) references transactions(id) on delete cascade,
    index idx_receipts_tx (transaction_id)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 8. bảng budgets (ngân sách chi tiêu theo chu kỳ)
create table if not exists budgets (
    id bigint not null auto_increment,
    space_id bigint not null,
    user_id bigint not null,
    category_id bigint not null,
    amount decimal(15, 2) not null,
    budget_month int not null,
    budget_year int not null,
    warning_threshold decimal(5, 2) not null default 80.00,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    primary key (id),
    foreign key fk_budgets_space (space_id) references financial_spaces(id) on delete cascade,
    foreign key fk_budgets_user (user_id) references users(id) on delete cascade,
    foreign key fk_budgets_category (category_id) references categories(id),
    unique key uk_budget_space_category_period (space_id, category_id, budget_month, budget_year),
    index idx_budgets_space (space_id),
    index idx_budgets_user (user_id),
    index idx_budgets_month_year (budget_month, budget_year)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 9. bảng savings_goals (mục tiêu tiết kiệm)
create table if not exists savings_goals (
    id bigint not null auto_increment,
    space_id bigint not null,
    user_id bigint not null,
    name varchar(200) not null,
    description varchar(500),
    target_amount decimal(15, 2) not null,
    current_amount decimal(15, 2) not null default 0.00,
    start_date date not null,
    deadline date,
    status enum('IN_PROGRESS', 'COMPLETED', 'CANCELLED') not null default 'IN_PROGRESS',
    icon varchar(100),
    color varchar(20),
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    primary key (id),
    foreign key fk_goals_space (space_id) references financial_spaces(id) on delete cascade,
    foreign key fk_goals_user (user_id) references users(id) on delete cascade,
    index idx_goals_space (space_id),
    index idx_goals_user (user_id),
    index idx_goals_status (status)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 10. bảng notifications (thông báo & cảnh báo FIN-NB01 đến FIN-NB12)
create table if not exists notifications (
    id bigint not null auto_increment,
    user_id bigint not null,
    title varchar(200) not null,
    message text not null,
    type enum('BUDGET_WARNING', 'BUDGET_EXCEEDED', 'GOAL_ACHIEVED', 'GOAL_DEADLINE', 'FAMILY_INVITE', 'SYSTEM') not null,
    related_id bigint,
    is_read boolean not null default false,
    created_at timestamp not null default current_timestamp,
    primary key (id),
    foreign key fk_notifications_user (user_id) references users(id) on delete cascade,
    index idx_notifications_user (user_id),
    index idx_notifications_read (is_read),
    index idx_notifications_type (type)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 11. bảng audit_logs (lịch sử tác động quản trị)
create table if not exists audit_logs (
    id bigint not null auto_increment,
    admin_id bigint not null,
    action varchar(100) not null,
    target_type varchar(50),
    target_id bigint,
    description text,
    ip_address varchar(50),
    created_at timestamp not null default current_timestamp,
    primary key (id),
    foreign key fk_audit_admin (admin_id) references users(id) on delete cascade,
    index idx_audit_admin (admin_id),
    index idx_audit_action (action)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- 12. bảng refresh_tokens (token duy trì phiên xác thực Stateless JWT)
create table if not exists refresh_tokens (
    id bigint not null auto_increment,
    user_id bigint not null,
    token varchar(500) not null,
    expiry_date timestamp not null,
    is_revoked boolean not null default false,
    created_at timestamp not null default current_timestamp,
    primary key (id),
    foreign key fk_tokens_user (user_id) references users(id) on delete cascade,
    unique key uk_refresh_tokens_token (token(255)),
    index idx_tokens_user (user_id),
    index idx_tokens_revoked (is_revoked)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- ============================================================
-- DỮ LIỆU SEEDING KHỞI TẠO (Data Seeding)
-- Mật khẩu mặc định: Admin@1234 (admin) / Password123! (thành viên)
-- ============================================================

-- Người dùng mẫu: Quản trị viên Admin & Thành viên nhóm
insert into users (id, username, email, password_hash, full_name, phone, role, is_active) values
(1, 'admin', 'admin@finance.app', '$2a$10$JizcpfkO7BoN5tAcZJQHB.6mnaSYOgEveja8KLEYbOuj9Lx7uKtvG', 'Hệ Thống Quản Trị', '0901234567', 'ADMIN', true),
(2, 'huunhat', 'huunhat@finance.app', '$2a$10$wqEaogl8Gt.wKEc7raIlKuRhluuHTOabgi.hDxQwMIH4DuNvmayJ6', 'Trần Hữu Nhật', '0912345678', 'USER', true),
(3, 'hoangphuc', 'hoangphuc@finance.app', '$2a$10$wqEaogl8Gt.wKEc7raIlKuRhluuHTOabgi.hDxQwMIH4DuNvmayJ6', 'Nguyễn Hoàng Phúc', '0923456789', 'USER', true),
(4, 'thephong', 'thephong@finance.app', '$2a$10$wqEaogl8Gt.wKEc7raIlKuRhluuHTOabgi.hDxQwMIH4DuNvmayJ6', 'La Thế Phong', '0934567890', 'USER', true),
(5, 'manhthang', 'manhthang@finance.app', '$2a$10$wqEaogl8Gt.wKEc7raIlKuRhluuHTOabgi.hDxQwMIH4DuNvmayJ6', 'Nguyễn Mạnh Thắng', '0945678901', 'USER', true)
on duplicate key update username = values(username);

-- Danh mục chuẩn hệ thống (System Categories)
insert into categories (id, name, name_vi, type, icon, color, is_system, user_id, is_active, display_order) values
(1, 'Salary', 'Tiền lương', 'INCOME', 'briefcase', '#10B981', true, null, true, 1),
(2, 'Bonus', 'Tiền thưởng', 'INCOME', 'gift', '#059669', true, null, true, 2),
(3, 'Investment', 'Đầu tư & Cổ tức', 'INCOME', 'trending-up', '#3B82F6', true, null, true, 3),
(4, 'Other Income', 'Thu nhập khác', 'INCOME', 'plus-circle', '#6366F1', true, null, true, 4),
(5, 'Food & Dining', 'Ăn uống', 'EXPENSE', 'coffee', '#EF4444', true, null, true, 1),
(6, 'Housing', 'Tiền nhà & Chung cư', 'EXPENSE', 'home', '#F97316', true, null, true, 2),
(7, 'Utilities', 'Điện, Nước, Internet', 'EXPENSE', 'zap', '#EAB308', true, null, true, 3),
(8, 'Transportation', 'Đi lại & Xăng xe', 'EXPENSE', 'truck', '#8B5CF6', true, null, true, 4),
(9, 'Shopping', 'Mua sắm gia đình', 'EXPENSE', 'shopping-cart', '#EC4899', true, null, true, 5),
(10, 'Health', 'Y tế & Sức khỏe', 'EXPENSE', 'activity', '#14B8A6', true, null, true, 6),
(11, 'Education', 'Giáo dục & Học phí', 'EXPENSE', 'book', '#06B6D4', true, null, true, 7),
(12, 'Entertainment', 'Giải trí & Du lịch', 'EXPENSE', 'film', '#F43F5E', true, null, true, 8)
on duplicate key update name = values(name);

-- Không gian tài chính: Cá nhân của Hữu Nhật và Không gian gia đình
insert into financial_spaces (id, name, description, type, currency, owner_id, invite_code, is_active) values
(1, 'Không gian Cá nhân - Hữu Nhật', 'Sổ quản lý chi tiêu cá nhân hằng ngày', 'PERSONAL', 'VND', 2, null, true),
(2, 'Gia đình Hữu Nhật', 'Quỹ tài chính và thu chi chung tổ ấm', 'FAMILY', 'VND', 2, 'FAM-8924-XN', true)
on duplicate key update name = values(name);

-- Thành viên gia đình Hữu Nhật
insert into family_members (id, space_id, user_id, role, is_active) values
(1, 2, 2, 'OWNER', true),
(2, 2, 3, 'ADMIN', true),
(3, 2, 4, 'MEMBER', true),
(4, 2, 5, 'MEMBER', true)
on duplicate key update role = values(role);

-- Ví tiền mẫu (Wallets)
insert into wallets (id, user_id, space_id, name, wallet_type, balance, currency, is_shared, is_active) values
(1, 2, 1, 'Ví tiền mặt', 'CASH', 2500000.00, 'VND', false, true),
(2, 2, 1, 'Thẻ Vietcombank', 'BANK', 18500000.00, 'VND', false, true),
(3, 2, 2, 'Quỹ sinh hoạt gia đình', 'BANK', 12000000.00, 'VND', true, true),
(4, 2, 2, 'Quỹ tiết kiệm du lịch', 'BANK', 25000000.00, 'VND', true, true)
on duplicate key update name = values(name);

-- Hạn mức ngân sách tháng mẫu (Tháng 11/2026)
insert into budgets (id, space_id, user_id, category_id, amount, budget_month, budget_year, warning_threshold) values
(1, 1, 2, 5, 4000000.00, 11, 2026, 80.00),
(2, 1, 2, 8, 1000000.00, 11, 2026, 80.00),
(3, 2, 2, 5, 8000000.00, 11, 2026, 80.00),
(4, 2, 2, 7, 2500000.00, 11, 2026, 80.00)
on duplicate key update amount = values(amount);

-- Giao dịch mẫu (Transactions)
insert into transactions (id, space_id, user_id, category_id, wallet_id, type, amount, description, transaction_date, note) values
(1, 1, 2, 1, 2, 'INCOME', 25000000.00, 'Nhận lương tháng 11', '2026-11-05', 'Chuyển khoản lương công ty'),
(2, 1, 2, 5, 1, 'EXPENSE', 85000.00, 'Ăn trưa cơm văn phòng', '2026-11-06', 'Phần cơm sườn trứng'),
(3, 1, 2, 8, 1, 'EXPENSE', 100000.00, 'Đổ xăng xe máy', '2026-11-06', 'Xăng RON 95'),
(4, 2, 2, 5, 3, 'EXPENSE', 1250000.00, 'Đi siêu thị thực phẩm tuần', '2026-11-07', 'Thịt, rau củ và sữa tươi'),
(5, 2, 3, 7, 3, 'EXPENSE', 1450000.00, 'Thanh toán tiền điện sinh hoạt', '2026-11-08', 'Hóa đơn EVN tháng 10')
on duplicate key update amount = values(amount);
