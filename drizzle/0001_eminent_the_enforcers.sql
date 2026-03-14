CREATE TABLE `processing_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`scene_id` int,
	`task_type` enum('analyze_text','generate_image','generate_audio','generate_video','compose_final_video') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`priority` int DEFAULT 0,
	`retry_count` int DEFAULT 0,
	`max_retries` int DEFAULT 3,
	`metadata` json,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processing_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`scene_number` int NOT NULL,
	`title` varchar(255),
	`description` longtext NOT NULL,
	`text_content` longtext NOT NULL,
	`image_prompt` longtext,
	`status` enum('pending','generating_image','generating_audio','generating_video','completed','failed') NOT NULL DEFAULT 'pending',
	`image_url` varchar(500),
	`audio_url` varchar(500),
	`video_url` varchar(500),
	`duration` decimal(5,2),
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext,
	`original_text` longtext NOT NULL,
	`status` enum('draft','processing','completed','failed') NOT NULL DEFAULT 'draft',
	`video_url` varchar(500),
	`video_duration` int,
	`scene_count` int DEFAULT 0,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_projects_id` PRIMARY KEY(`id`)
);
