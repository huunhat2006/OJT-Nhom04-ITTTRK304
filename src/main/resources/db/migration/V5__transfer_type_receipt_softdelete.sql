-- Tác giả: La Thế Phong (Database & Data Lead)
-- ============================================================
-- V5: UC04 TRANSFER type, UC05 receipt image, soft delete
-- Personal Finance Management System (BTON)
-- ============================================================

-- Allow TRANSFER transaction type (UC04)
ALTER TABLE transactions MODIFY COLUMN type VARCHAR(20) NOT NULL;

-- Category is optional for internal wallet transfers (UC04)
ALTER TABLE transactions MODIFY COLUMN category_id BIGINT NULL;

-- Receipt/invoice image URL attached to a transaction (UC05)
ALTER TABLE transactions ADD COLUMN receipt_url VARCHAR(500) NULL AFTER note;

-- Soft delete flag for accounting reconciliation (SRS 2.4)
ALTER TABLE transactions ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER receipt_url;

CREATE INDEX idx_transactions_is_deleted ON transactions (is_deleted);
