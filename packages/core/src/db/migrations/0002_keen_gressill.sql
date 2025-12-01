CREATE TABLE "codes" (
	"id" text PRIMARY KEY NOT NULL,
	"credit_type_id" text NOT NULL,
	"code_value" text NOT NULL,
	"redeem_url" text,
	"assigned_to" text,
	"assigned_at" timestamp,
	"redeemed_at" timestamp,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "codes_credit_type_code_value_unq" UNIQUE("credit_type_id","code_value")
);
--> statement-breakpoint
CREATE TABLE "credit_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"email_instructions" text,
	"web_instructions" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"icon_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "food_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"meal_type" text NOT NULL,
	"checked_in_by" text NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_checkins_participant_meal_unq" UNIQUE("participant_id","meal_type")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'participant';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "luma_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "participant_type" text DEFAULT 'regular';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'registered';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "checked_in_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "checked_in_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "qr_code_value" text;--> statement-breakpoint
ALTER TABLE "codes" ADD CONSTRAINT "codes_credit_type_id_credit_types_id_fk" FOREIGN KEY ("credit_type_id") REFERENCES "public"."credit_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codes" ADD CONSTRAINT "codes_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_checkins" ADD CONSTRAINT "food_checkins_participant_id_users_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_checkins" ADD CONSTRAINT "food_checkins_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "codes_credit_type_status_idx" ON "codes" USING btree ("credit_type_id","status");--> statement-breakpoint
CREATE INDEX "codes_assigned_to_idx" ON "codes" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "credit_types_display_order_idx" ON "credit_types" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "credit_types_is_active_idx" ON "credit_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "food_checkins_meal_type_idx" ON "food_checkins" USING btree ("meal_type");--> statement-breakpoint
CREATE INDEX "food_checkins_checked_in_at_idx" ON "food_checkins" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX "users_luma_id_idx" ON "users" USING btree ("luma_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_participant_type_idx" ON "users" USING btree ("participant_type");