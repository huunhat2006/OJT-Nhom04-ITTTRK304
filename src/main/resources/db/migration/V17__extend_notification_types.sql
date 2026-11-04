-- ============================================================
-- V17: Extend notification type column to VARCHAR(50)
-- Allows WEEKLY_SUMMARY, GOAL_COMPLETED, and any dynamic types
-- ============================================================

ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL;

