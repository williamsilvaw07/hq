-- Add owner field to CreditCard
ALTER TABLE `CreditCard` ADD COLUMN `owner` VARCHAR(191) NULL AFTER `name`;

-- Add credit_card_id to budgets for linking a card to a budget
ALTER TABLE `budgets` ADD COLUMN `credit_card_id` INT NULL AFTER `category_id`;
ALTER TABLE `budgets` ADD INDEX `budgets_credit_card_id_idx` (`credit_card_id`);
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_credit_card_id_fkey` FOREIGN KEY (`credit_card_id`) REFERENCES `CreditCard` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
