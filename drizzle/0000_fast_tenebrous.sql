CREATE TABLE `deep_test_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_code` text NOT NULL,
	`test_stage` text NOT NULL,
	`language` text NOT NULL,
	`overall_rating` integer NOT NULL,
	`interview_interest` text DEFAULT 'no' NOT NULL,
	`response_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
