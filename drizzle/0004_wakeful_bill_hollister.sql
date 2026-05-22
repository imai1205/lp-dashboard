ALTER TABLE `analytics_daily` ADD `sessions` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `analytics_sources_daily` ADD `sessions` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sites` ADD `ga4_property_id` text;