ALTER TABLE `users` ADD `is_online` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `users` ADD `last_seen` timestamp;
--> statement-breakpoint
ALTER TABLE `likes` ADD `reaction_type` enum('like','love','celebrate','support','funny') NOT NULL DEFAULT 'like';
--> statement-breakpoint

CREATE TABLE `friend_requests` (
	`id` varchar(191) NOT NULL,
	`requester_id` varchar(191) NOT NULL,
	`recipient_id` varchar(191) NOT NULL,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `friend_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `friend_requests_requester_id_recipient_id_unique` UNIQUE(`requester_id`,`recipient_id`)
);
--> statement-breakpoint

CREATE TABLE `shares` (
	`id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`post_id` varchar(191) NOT NULL,
	`destination` enum('external','pulse') NOT NULL DEFAULT 'external',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `reposts` (
	`id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`post_id` varchar(191) NOT NULL,
	`quote` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reposts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `conversations` (
	`id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `conversation_participants` (
	`id` varchar(191) NOT NULL,
	`conversation_id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`last_read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_participants_conversation_id_user_id_unique` UNIQUE(`conversation_id`,`user_id`)
);
--> statement-breakpoint

CREATE TABLE `messages` (
	`id` varchar(191) NOT NULL,
	`conversation_id` varchar(191) NOT NULL,
	`sender_id` varchar(191) NOT NULL,
	`content` text NOT NULL,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `badges` (
	`id` varchar(191) NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`threshold` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint

CREATE TABLE `user_badges` (
	`id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`badge_id` varchar(191) NOT NULL,
	`awarded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_badges_user_id_badge_id_unique` UNIQUE(`user_id`,`badge_id`)
);
--> statement-breakpoint

ALTER TABLE `friend_requests` ADD CONSTRAINT `friend_requests_requester_id_users_id_fk` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `friend_requests` ADD CONSTRAINT `friend_requests_recipient_id_users_id_fk` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `shares` ADD CONSTRAINT `shares_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `shares` ADD CONSTRAINT `shares_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `reposts` ADD CONSTRAINT `reposts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `reposts` ADD CONSTRAINT `reposts_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_badge_id_badges_id_fk` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE cascade ON UPDATE no action;
