CREATE TABLE `analytics_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`date` text NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`visitors` integer DEFAULT 0 NOT NULL,
	`conversions` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_daily_site_date_uniq` ON `analytics_daily` (`site_id`,`date`);--> statement-breakpoint
CREATE TABLE `analytics_sources_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`date` text NOT NULL,
	`source` text NOT NULL,
	`visitors` integer DEFAULT 0 NOT NULL,
	`conversions` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_sources_daily_site_date_source_uniq` ON `analytics_sources_daily` (`site_id`,`date`,`source`);--> statement-breakpoint
CREATE INDEX `analytics_sources_daily_site_date_idx` ON `analytics_sources_daily` (`site_id`,`date`);--> statement-breakpoint
CREATE TABLE `event_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`is_conversion` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_definitions_site_key_uniq` ON `event_definitions` (`site_id`,`key`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`event_definition_id` text,
	`type` text NOT NULL,
	`session_id` text,
	`visitor_id` text,
	`source` text,
	`medium` text,
	`campaign` text,
	`referrer` text,
	`page_path` text,
	`user_agent` text,
	`ip_hash` text,
	`metadata` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_definition_id`) REFERENCES `event_definitions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `events_site_occurred_idx` ON `events` (`site_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `events_definition_idx` ON `events` (`event_definition_id`);--> statement-breakpoint
CREATE INDEX `events_session_idx` ON `events` (`session_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_members_org_user_uniq` ON `organization_members` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `organization_members_user_idx` ON `organization_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`domain` text,
	`tracking_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sites_tracking_id_unique` ON `sites` (`tracking_id`);--> statement-breakpoint
CREATE INDEX `sites_org_idx` ON `sites` (`organization_id`);--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`event_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`company` text,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`handler_user_id` text,
	`received_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`handler_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `inquiries_site_received_idx` ON `inquiries` (`site_id`,`received_at`);--> statement-breakpoint
CREATE INDEX `inquiries_status_idx` ON `inquiries` (`status`);