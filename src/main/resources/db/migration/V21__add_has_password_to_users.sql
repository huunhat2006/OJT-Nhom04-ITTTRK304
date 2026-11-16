-- Migration: Thêm has_password và auth_provider cho bảng users
-- Hỗ trợ phân biệt tài khoản đăng nhập qua Google chưa có mật khẩu
ALTER TABLE users ADD COLUMN has_password BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';

-- Đánh dấu các tài khoản đăng nhập bằng Google nhưng chưa từng thiết lập mật khẩu
UPDATE users 
SET has_password = FALSE, auth_provider = 'GOOGLE' 
WHERE avatar_url LIKE '%googleusercontent.com%';

