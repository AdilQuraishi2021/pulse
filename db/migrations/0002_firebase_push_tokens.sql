CREATE TABLE `notification_push_tokens` (
	`id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`token` varchar(512) NOT NULL,
	`platform` enum('web') NOT NULL DEFAULT 'web',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_push_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_push_tokens_user_id_token_unique` UNIQUE(`user_id`, `token`)
);
--> statement-breakpoint
ALTER TABLE `notification_push_tokens` ADD CONSTRAINT `notification_push_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
