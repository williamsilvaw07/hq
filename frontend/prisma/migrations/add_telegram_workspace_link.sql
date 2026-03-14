-- Per-workspace Telegram connection support
-- Run: mysql -u user -p database < prisma/migrations/add_telegram_workspace_link.sql

-- Add workspace_id to link codes so the code is tied to a specific workspace
ALTER TABLE `telegram_link_codes`
  ADD COLUMN IF NOT EXISTS `workspace_id` INT NULL AFTER `user_id`;

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS `telegram_link_codes_workspace_id_idx`
  ON `telegram_link_codes` (`workspace_id`);
