-- MySQL schema for Fintech Tracker (matches Prisma schema).
-- Create an empty database first, then run this script.

-- Users
CREATE TABLE `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `email_verified_at` DATETIME(3) NULL,
  `password` VARCHAR(191) NOT NULL,
  `avatar_url` VARCHAR(191) NULL,
  `remember_token` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens
CREATE TABLE `PasswordResetToken` (
  `email` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Workspaces
CREATE TABLE `Workspace` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Workspace_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Workspace members (pivot)
CREATE TABLE `workspace_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'member',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `workspace_users_workspace_id_user_id_key` (`workspace_id`, `user_id`),
  INDEX `workspace_users_workspace_id_idx` (`workspace_id`),
  INDEX `workspace_users_user_id_idx` (`user_id`),
  CONSTRAINT `workspace_users_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `workspace_users_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Workspace invitations
CREATE TABLE `workspace_invitations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'member',
  `token` VARCHAR(191) NOT NULL,
  `invited_by` INT NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `accepted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `workspace_invitations_token_key` (`token`),
  UNIQUE INDEX `workspace_invitations_workspace_id_email_key` (`workspace_id`, `email`),
  INDEX `workspace_invitations_workspace_id_idx` (`workspace_id`),
  INDEX `workspace_invitations_invited_by_idx` (`invited_by`),
  CONSTRAINT `workspace_invitations_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `workspace_invitations_invited_by_fkey` FOREIGN KEY (`invited_by`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories
CREATE TABLE `Category` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(191) NULL,
  `color` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Category_workspace_id_idx` (`workspace_id`),
  CONSTRAINT `Category_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Accounts
CREATE TABLE `Account` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'BRL',
  `balance` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `include_in_net_balance` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Account_workspace_id_idx` (`workspace_id`),
  CONSTRAINT `Account_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit cards
CREATE TABLE `CreditCard` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `account_id` INT NULL,
  `name` VARCHAR(191) NOT NULL,
  `credit_limit` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `current_balance` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `billing_cycle_start_day` TINYINT UNSIGNED NOT NULL,
  `payment_due_day` TINYINT UNSIGNED NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'BRL',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `CreditCard_workspace_id_idx` (`workspace_id`),
  INDEX `CreditCard_account_id_idx` (`account_id`),
  CONSTRAINT `CreditCard_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CreditCard_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `Account` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budgets (table name budgets to match Prisma @@map)
CREATE TABLE `budgets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `month` TINYINT UNSIGNED NOT NULL,
  `year` SMALLINT UNSIGNED NOT NULL,
  `period_type` VARCHAR(20) NOT NULL DEFAULT 'month',
  `period_interval` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `start_date` DATE NULL,
  `amount` DECIMAL(18, 4) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'BRL',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `budgets_workspace_id_category_id_month_year_key` (`workspace_id`, `category_id`, `month`, `year`),
  INDEX `budgets_workspace_id_idx` (`workspace_id`),
  INDEX `budgets_category_id_idx` (`category_id`),
  CONSTRAINT `budgets_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `budgets_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions
CREATE TABLE `Transaction` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workspace_id` INT NOT NULL,
  `account_id` INT NULL,
  `category_id` INT NULL,
  `created_by_user_id` INT NULL,
  `type` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(18, 4) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'BRL',
  `exchange_rate` DECIMAL(18, 8) NOT NULL DEFAULT 1,
  `base_amount` DECIMAL(18, 4) NOT NULL,
  `date` DATE NOT NULL,
  `description` VARCHAR(191) NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'web_manual',
  `status` VARCHAR(191) NOT NULL DEFAULT 'confirmed',
  `inbound_message_id` INT NULL,
  `ai_confidence_score` DECIMAL(5, 4) NULL,
  `raw_parsed_payload` JSON NULL,
  `confirmed_at` DATETIME(3) NULL,
  `confirmed_by_user_id` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Transaction_workspace_id_idx` (`workspace_id`),
  INDEX `Transaction_account_id_idx` (`account_id`),
  INDEX `Transaction_category_id_idx` (`category_id`),
  INDEX `Transaction_created_by_user_id_idx` (`created_by_user_id`),
  INDEX `Transaction_confirmed_by_user_id_idx` (`confirmed_by_user_id`),
  CONSTRAINT `Transaction_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Transaction_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `Account` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Transaction_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Transaction_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Transaction_confirmed_by_user_id_fkey` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prisma sets updated_at in the app; no triggers needed.
