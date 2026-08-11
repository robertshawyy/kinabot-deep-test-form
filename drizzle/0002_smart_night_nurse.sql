CREATE TABLE `feedback_insights` (
	`feedback_id` text PRIMARY KEY NOT NULL,
	`priority_level` text NOT NULL,
	`priority_score` integer NOT NULL,
	`headline` text NOT NULL,
	`essence` text NOT NULL,
	`recommended_action` text NOT NULL,
	`themes_json` text NOT NULL,
	`risk_flags_json` text NOT NULL,
	`insight_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
