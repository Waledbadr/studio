CREATE TABLE `accommodation_history` (
	`id` text PRIMARY KEY NOT NULL,
	`worker_id` text NOT NULL,
	`worker_name` text,
	`worker_nationality` text,
	`action_type` text NOT NULL,
	`action_date` text NOT NULL,
	`action_by` text,
	`action_by_name` text,
	`residence_id` text,
	`residence_name` text,
	`building_id` text,
	`building_name` text,
	`floor_id` text,
	`floor_name` text,
	`room_id` text,
	`room_name` text,
	`from_residence_id` text,
	`from_residence_name` text,
	`from_room_id` text,
	`from_room_name` text,
	`to_residence_id` text,
	`to_residence_name` text,
	`to_room_id` text,
	`to_room_name` text,
	`swapped_with_worker_id` text,
	`swapped_with_worker_name` text,
	`reason` text,
	`notes` text,
	`is_emergency` integer DEFAULT false,
	`duration` integer,
	`related_transfer_request_id` text,
	`checkout_type` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_ar` text,
	`name_en` text,
	`contact_email` text,
	`contact_phone` text,
	`address` text,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`residence_id` text,
	`residence_ids` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`rate_per_person_per_month` real NOT NULL,
	`expected_workers` integer,
	`status` text DEFAULT 'Active',
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	`created_by` text
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`contract_id` text NOT NULL,
	`company_id` text NOT NULL,
	`residence_id` text NOT NULL,
	`month` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`number_of_workers` integer NOT NULL,
	`number_of_days` integer NOT NULL,
	`rate_per_person` real NOT NULL,
	`total_amount` real NOT NULL,
	`status` text DEFAULT 'Draft',
	`generated_at` text NOT NULL,
	`paid_at` text,
	`pdf_url` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`created_at` text NOT NULL,
	`read` integer DEFAULT false,
	`user_id` text
);
--> statement-breakpoint
CREATE TABLE `occupants` (
	`id` text PRIMARY KEY NOT NULL,
	`worker_id` text NOT NULL,
	`residence_id` text NOT NULL,
	`building_id` text,
	`floor_id` text,
	`room_id` text NOT NULL,
	`since` text NOT NULL,
	`until` text,
	`check_in_by` text,
	`check_out_by` text,
	`checkout_type` text,
	`transfer_city` text,
	`notes` text,
	`is_emergency` integer DEFAULT false,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `residences` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`address` text,
	`location` text,
	`manager_id` text,
	`is_emergency_mode` integer DEFAULT false,
	`buildings` text,
	`facilities` text,
	`disabled` integer DEFAULT false,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `transfer_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`from` text,
	`to` text NOT NULL,
	`worker_ids` text NOT NULL,
	`requested_by` text NOT NULL,
	`requested_at` text NOT NULL,
	`status` text DEFAULT 'Pending',
	`reviewed_by` text,
	`reviewed_at` text,
	`reason` text
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`employee_id` text,
	`id_number` text,
	`nationaliy` text,
	`company` text,
	`role` text DEFAULT 'Worker',
	`status` text DEFAULT 'Active',
	`transfer_destination` text,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
