ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "participant_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "codes" ALTER COLUMN "status" SET DEFAULT 'unassigned';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "welcome_email_sent_at" timestamp;