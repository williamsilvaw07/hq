-- Goals feature: tables for financial goals, general goals, milestones, notes, contributions, and settings.
-- Run: mysql -u user -p database < prisma/migrations/add_goals.sql

-- Goals table: supports both financial and general goal types
CREATE TABLE IF NOT EXISTS `goals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `created_by_user_id` INT NULL,
  `type` VARCHAR(20) NOT NULL DEFAULT 'financial',       -- 'financial' or 'general'
  `name` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(20) NULL,
  `color` VARCHAR(20) NULL,                               -- accent color for the goal card
  `target_amount` DECIMAL(18, 4) NULL,                    -- financial goals only
  `current_amount` DECIMAL(18, 4) NOT NULL DEFAULT 0,     -- financial goals only
  `currency` CHAR(3) NOT NULL DEFAULT 'BRL',
  `deadline` DATE NULL,
  `contribution_frequency` VARCHAR(20) NULL,              -- 'weekly', 'bi-weekly', 'monthly', 'custom'
  `contribution_amount` DECIMAL(18, 4) NULL,              -- suggested contribution per period
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',         -- 'active', 'completed', 'paused', 'cancelled'
  `progress` TINYINT UNSIGNED NOT NULL DEFAULT 0,         -- 0-100 for general goals
  `completed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `goals_workspace_id_idx` (`workspace_id`),
  INDEX `goals_created_by_user_id_idx` (`created_by_user_id`),
  INDEX `goals_status_idx` (`status`),
  CONSTRAINT `goals_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `goals_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Goal milestones: checklist items for general goals, or financial milestones
CREATE TABLE IF NOT EXISTS `goal_milestones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `goal_id` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `target_amount` DECIMAL(18, 4) NULL,                    -- optional: financial milestone amount
  `target_date` DATE NULL,
  `is_completed` BOOLEAN NOT NULL DEFAULT false,
  `completed_at` DATETIME(3) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `goal_milestones_goal_id_idx` (`goal_id`),
  CONSTRAINT `goal_milestones_goal_id_fkey` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Goal notes: user-added notes on goals
CREATE TABLE IF NOT EXISTS `goal_notes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `goal_id` INT NOT NULL,
  `user_id` INT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `goal_notes_goal_id_idx` (`goal_id`),
  CONSTRAINT `goal_notes_goal_id_fkey` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `goal_notes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Goal contributions: track money added to financial goals over time
CREATE TABLE IF NOT EXISTS `goal_contributions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `goal_id` INT NOT NULL,
  `user_id` INT NULL,
  `amount` DECIMAL(18, 4) NOT NULL,
  `note` VARCHAR(191) NULL,
  `date` DATE NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `goal_contributions_goal_id_idx` (`goal_id`),
  CONSTRAINT `goal_contributions_goal_id_fkey` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `goal_contributions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Goal settings: per-workspace preferences for the goals feature
CREATE TABLE IF NOT EXISTS `goal_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `default_goal_type` VARCHAR(20) NOT NULL DEFAULT 'financial',  -- 'financial' or 'general'
  `ai_suggestions` BOOLEAN NOT NULL DEFAULT true,
  `reminders_enabled` BOOLEAN NOT NULL DEFAULT false,
  `reminder_frequency` VARCHAR(20) NOT NULL DEFAULT 'weekly',    -- 'daily', 'weekly', 'monthly'
  `show_completed` BOOLEAN NOT NULL DEFAULT true,
  `allow_notes` BOOLEAN NOT NULL DEFAULT true,
  `allow_milestones` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `goal_settings_workspace_id_key` (`workspace_id`),
  CONSTRAINT `goal_settings_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
