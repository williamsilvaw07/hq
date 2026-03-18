-- Chat sessions: track conversation state for Telegram/WhatsApp bots
-- Used to store temporary state like "pending_member_pick" when a workspace has multiple members
-- Run: mysql -u user -p database < prisma/migrations/add_chat_sessions.sql

CREATE TABLE IF NOT EXISTS `chat_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `chat_id` VARCHAR(100) NOT NULL,
  `source` VARCHAR(20) NOT NULL,
  `state` VARCHAR(50) NOT NULL,
  `payload` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `chat_sessions_chat_source_key` (`chat_id`, `source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
