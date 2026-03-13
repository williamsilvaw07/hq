-- Add icon and name columns to budgets table
-- Run: mysql -u user -p database < prisma/migrations/add_budget_icon_name.sql
ALTER TABLE `budgets`
  ADD COLUMN IF NOT EXISTS `name` VARCHAR(255) NULL AFTER `category_id`,
  ADD COLUMN IF NOT EXISTS `icon` VARCHAR(20) NULL AFTER `name`;
