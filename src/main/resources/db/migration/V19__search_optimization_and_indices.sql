-- migration: v19__search_optimization_and_indices.sql
-- author: backend & devops
-- purpose: add query optimization indices for budgets and transactions

-- 1. index for budget user and period
set @idx_budget = (select count(*) from information_schema.statistics
                   where table_schema = database() and table_name = 'budgets' and index_name = 'idx_budget_user_month');
set @sql_budget = if(@idx_budget = 0,
    'alter table budgets add index idx_budget_user_month (user_id, budget_month, budget_year)',
    'select 1');
prepare stmt_budget from @sql_budget; execute stmt_budget; deallocate prepare stmt_budget;

-- 2. index for transaction user and date (align with task name idx_transaction_user_date)
set @idx_tx_user_date = (select count(*) from information_schema.statistics
                         where table_schema = database() and table_name = 'transactions' and index_name = 'idx_transaction_user_date');
set @sql_tx_user_date = if(@idx_tx_user_date = 0,
    'alter table transactions add index idx_transaction_user_date (user_id, transaction_date)',
    'select 1');
prepare stmt_tx_user_date from @sql_tx_user_date; execute stmt_tx_user_date; deallocate prepare stmt_tx_user_date;

-- 3. index for transaction category (align with task name idx_transaction_category)
set @idx_tx_cat = (select count(*) from information_schema.statistics
                   where table_schema = database() and table_name = 'transactions' and index_name = 'idx_transaction_category');
set @sql_tx_cat = if(@idx_tx_cat = 0,
    'alter table transactions add index idx_transaction_category (category_id)',
    'select 1');
prepare stmt_tx_cat from @sql_tx_cat; execute stmt_tx_cat; deallocate prepare stmt_tx_cat;
