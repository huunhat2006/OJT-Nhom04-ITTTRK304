
ALTER TABLE budgets
    RENAME COLUMN month TO budget_month,
    RENAME COLUMN year  TO budget_year;

-- Update unique constraint to reflect new column names
ALTER TABLE budgets
    DROP INDEX uk_budget_space_category_month,
    ADD UNIQUE KEY uk_budget_space_category_period (space_id, category_id, budget_month, budget_year);

-- Update index
ALTER TABLE budgets
    DROP INDEX idx_budgets_month_year,
    ADD INDEX idx_budgets_month_year (budget_month, budget_year);
