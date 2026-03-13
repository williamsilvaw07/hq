-- WhatsApp integration support
-- Run: mysql -u user -p database < prisma/migrations/add_whatsapp_support.sql

-- Add phone number + default workspace to User
ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `phone_number` VARCHAR(20) NULL AFTER `avatar_url`,
  ADD COLUMN IF NOT EXISTS `default_workspace_id` INT NULL AFTER `phone_number`;

-- Index for fast phone number lookups
CREATE INDEX IF NOT EXISTS `User_phone_number_idx` ON `User` (`phone_number`);

-- Deduplication: track processed WhatsApp message IDs
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `whatsapp_message_id` VARCHAR(100) NOT NULL,
  `processed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `whatsapp_messages_message_id_key` (`whatsapp_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
