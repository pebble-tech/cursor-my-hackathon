ALTER TABLE "credit_types" ADD COLUMN "distribution_type" text DEFAULT 'unique' NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_types" ADD COLUMN "universal_code" text;--> statement-breakpoint
ALTER TABLE "credit_types" ADD COLUMN "universal_redeem_url" text;