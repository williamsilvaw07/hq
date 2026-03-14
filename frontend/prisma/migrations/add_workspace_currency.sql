-- Add currency to Workspace table
ALTER TABLE `Workspace`
  ADD COLUMN IF NOT EXISTS `currency` VARCHAR(3) NOT NULL DEFAULT 'BRL' AFTER `slug`;
