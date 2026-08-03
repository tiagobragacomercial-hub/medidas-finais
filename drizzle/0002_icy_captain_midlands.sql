CREATE TABLE `portal_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`code_hash` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`pdf_object_key` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`expires_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_publications_token_hash_unique` ON `portal_publications` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `portal_publications_code_hash_unique` ON `portal_publications` (`code_hash`);