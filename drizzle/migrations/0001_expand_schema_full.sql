CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`worker_id` text NOT NULL,
	`room_id` text,
	`residence_id` text,
	`building_id` text,
	`floor_id` text,
	`company_id` text,
	`nationality` text,
	`role` text,
	`start_at` integer,
	`end_at` integer,
	`status` text,
	`created_at` integer,
	`updated_at` integer,
	`updated_at_ts` text,
	`created_at_ts` text
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`user_name` text,
	`action` text,
	`entity_type` text,
	`entity_id` text,
	`summary` text,
	`before` text,
	`after` text,
	`meta` text,
	`timestamp` text
);
--> statement-breakpoint
CREATE TABLE `counters` (
	`id` text PRIMARY KEY NOT NULL,
	`last` integer,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`title` text,
	`description` text,
	`category` text,
	`device_info` text,
	`app_info` text,
	`settings` text,
	`category_auto` text,
	`ticket_id` text,
	`priority` text,
	`screenshot_url` text,
	`status` text,
	`created_at` text,
	`resolved_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_ar` text,
	`name_en` text,
	`category` text,
	`unit` text,
	`lifespan_days` integer,
	`keywords_en` text,
	`keywords_ar` text,
	`variants` text,
	`stock_by_residence` text,
	`stock` integer
);
--> statement-breakpoint
CREATE TABLE `inventory_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`names` text
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`item_name_en` text,
	`item_name_ar` text,
	`residence_id` text,
	`date` text,
	`type` text,
	`quantity` real,
	`reference_doc_id` text,
	`location_id` text,
	`location_name` text,
	`override_reason` text
);
--> statement-breakpoint
CREATE TABLE `mivs` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text,
	`residence_id` text,
	`item_count` integer,
	`location_name` text
);
--> statement-breakpoint
CREATE TABLE `mrv_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`residence_id` text,
	`items` text,
	`supplier_name` text,
	`invoice_no` text,
	`attachment_url` text,
	`attachment_path` text,
	`notes` text,
	`requested_by_id` text,
	`requested_at` text,
	`mrv_short` text,
	`processing_by_id` text,
	`processing_at` text,
	`mrv_id` text,
	`approved_at` text,
	`approved_by_id` text,
	`status` text
);
--> statement-breakpoint
CREATE TABLE `mrvs` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text,
	`residence_id` text,
	`item_count` integer,
	`supplier_name` text,
	`invoice_no` text,
	`notes` text,
	`attachment_url` text,
	`attachment_path` text,
	`attachment_ref` text,
	`code_short` text,
	`order_id` text
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`residence` text,
	`residence_id` text,
	`items` text,
	`requested_by_id` text,
	`notes` text,
	`requested_by_name` text,
	`requested_by_email` text,
	`date` text,
	`approved_by_name` text,
	`approved_by_id` text,
	`items_received` text,
	`status` text
);
--> statement-breakpoint
CREATE TABLE `reconciliation_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`residence_id` text,
	`adjustments` text,
	`requested_by_id` text,
	`requested_at` text,
	`reserved_id` text,
	`approved_at` text,
	`approved_by_id` text,
	`reference_id` text,
	`status` text
);
--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`code_short` text,
	`date_created` text,
	`residence_id` text,
	`residence_name` text,
	`destination` text,
	`status` text,
	`dispatched_at` text,
	`created_by_id` text,
	`dispatched_by_id` text,
	`items` text
);
--> statement-breakpoint
CREATE TABLE `stock_reconciliations` (
	`id` text PRIMARY KEY NOT NULL,
	`residence_id` text,
	`date` text,
	`item_count` integer,
	`total_increase` integer,
	`total_decrease` integer,
	`performed_by_id` text
);
--> statement-breakpoint
CREATE TABLE `unique_users_emails` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`role` text,
	`theme_settings` text,
	`assigned_residences` text,
	`created_at` text
);
