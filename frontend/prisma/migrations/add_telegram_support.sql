-- Telegram integration support
-- Run: mysql -u user -p database < prisma/migrations/add_telegram_support.sql

-- Add telegram_chat_id + default_workspace_id to User
ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `telegram_chat_id` BIGINT NULL AFTER `avatar_url`,
  ADD COLUMN IF NOT EXISTS `default_workspace_id` INT NULL AFTER `telegram_chat_id`;

-- Index for fast telegram_chat_id lookups
CREATE INDEX IF NOT EXISTS `User_telegram_chat_id_idx` ON `User` (`telegram_chat_id`);

-- Linking codes: short-lived codes for connecting Telegram to an account
CREATE TABLE IF NOT EXISTS `telegram_link_codes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `code` VARCHAR(8) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `telegram_link_codes_code_key` (`code`),
  INDEX `telegram_link_codes_user_id_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deduplication: track processed Telegram message IDs
CREATE TABLE IF NOT EXISTS `telegram_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `telegram_message_id` VARCHAR(100) NOT NULL,
  `processed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `telegram_messages_message_id_key` (`telegram_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
