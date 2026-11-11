-- Migration: Thêm thời hạn đã xác thực OTP cho tài khoản người dùng
-- Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)

ALTER TABLE users ADD COLUMN otp_verified_until DATETIME NULL;

