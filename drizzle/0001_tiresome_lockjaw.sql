CREATE TABLE `deep_user_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`feedback_type` text NOT NULL,
	`task_outcome` text NOT NULL,
	`impact` text NOT NULL,
	`analysis_related` text NOT NULL,
	`nps` integer NOT NULL,
	`technical_info_consent` integer DEFAULT 0 NOT NULL,
	`response_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
