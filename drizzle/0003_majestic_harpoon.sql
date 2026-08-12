CREATE TABLE `feedback_resolution_status` (
	`feedback_id` text PRIMARY KEY NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`resolved_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`feedback_id`) REFERENCES `deep_user_feedback`(`id`) ON UPDATE no action ON DELETE cascade
);
