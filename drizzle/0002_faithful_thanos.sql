CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`display_name` varchar(100) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`max_videos_per_month` int,
	`max_video_minutes` int,
	`max_characters_per_story` int,
	`stripe_product_id` varchar(100),
	`stripe_price_id` varchar(100),
	`is_active` int DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`stripe_subscription_id` varchar(100),
	`status` enum('active','canceled','past_due','unpaid','trialing') NOT NULL DEFAULT 'active',
	`current_period_start` timestamp,
	`current_period_end` timestamp,
	`canceled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`videos_generated` int DEFAULT 0,
	`total_characters_used` int DEFAULT 0,
	`total_video_minutes_generated` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_usage_tracking_id` PRIMARY KEY(`id`)
);
