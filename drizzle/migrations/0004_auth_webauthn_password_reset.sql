-- Add Passkey (WebAuthn) credential storage + password reset tokens

CREATE TABLE IF NOT EXISTS `webauthn_credentials` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `credential_id` text NOT NULL,
  `public_key` text NOT NULL,
  `counter` integer NOT NULL DEFAULT 0,
  `transports` text,
  `device_type` text,
  `backed_up` integer DEFAULT 0,
  `created_at` text,
  `updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `webauthn_credentials_credential_id_uq` ON `webauthn_credentials` (`credential_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `webauthn_credentials_user_id_idx` ON `webauthn_credentials` (`user_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL,
  `used_at` text,
  `requested_ip` text,
  `requested_ua` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `password_reset_tokens_token_hash_uq` ON `password_reset_tokens` (`token_hash`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `password_reset_tokens_user_id_idx` ON `password_reset_tokens` (`user_id`);
