-- Create first user and workspace. Run this in phpMyAdmin (or MySQL) after your tables exist.
-- Login: admin@example.com / changeme123  (change password after first login)

-- 1. User (password is bcrypt hash for "changeme123")
INSERT INTO `User` (`name`, `email`, `password`, `created_at`, `updated_at`)
VALUES (
  'Admin',
  'admin@example.com',
  '$2a$10$WZaYTo4svlmrme8v8u0AG./ENzKGwdvZQj7juipiaJVMZnU9bYw/S',
  NOW(3),
  NOW(3)
);

-- 2. Workspace (use last insert id; adjust @uid and @wid if you run separately)
SET @uid = LAST_INSERT_ID();
INSERT INTO `Workspace` (`name`, `slug`, `created_at`, `updated_at`)
VALUES ('Admin''s Workspace', 'admin-workspace', NOW(3), NOW(3));
SET @wid = LAST_INSERT_ID();

-- 3. Link user to workspace as owner
INSERT INTO `workspace_users` (`workspace_id`, `user_id`, `role`, `created_at`, `updated_at`)
VALUES (@wid, @uid, 'owner', NOW(3), NOW(3));

-- 4. Default categories
INSERT INTO `Category` (`workspace_id`, `name`, `type`, `created_at`, `updated_at`) VALUES
(@wid, 'Food & dining', 'expense', NOW(3), NOW(3)),
(@wid, 'Transport', 'expense', NOW(3), NOW(3)),
(@wid, 'Shopping', 'expense', NOW(3), NOW(3)),
(@wid, 'Bills & utilities', 'expense', NOW(3), NOW(3)),
(@wid, 'Other', 'expense', NOW(3), NOW(3)),
(@wid, 'Salary', 'income', NOW(3), NOW(3)),
(@wid, 'Freelance', 'income', NOW(3), NOW(3)),
(@wid, 'Other income', 'income', NOW(3), NOW(3));

-- 5. Default Cash account
INSERT INTO `Account` (`workspace_id`, `name`, `type`, `currency`, `balance`, `include_in_net_balance`, `created_at`, `updated_at`)
VALUES (@wid, 'Cash', 'cash', 'BRL', 0, 1, NOW(3), NOW(3));
