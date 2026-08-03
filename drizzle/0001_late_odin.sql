CREATE TABLE `sync_records` (
	`id` text PRIMARY KEY NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`payload_json` text NOT NULL,
	`checksum` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
