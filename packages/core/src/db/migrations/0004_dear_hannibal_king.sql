CREATE TABLE "checkin_records" (
	"id" text PRIMARY KEY NOT NULL,
	"checkin_type_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"checked_in_by" text NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkin_records_type_participant_unq" UNIQUE("checkin_type_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "checkin_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkin_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DROP TABLE "food_checkins" CASCADE;--> statement-breakpoint
ALTER TABLE "checkin_records" ADD CONSTRAINT "checkin_records_checkin_type_id_checkin_types_id_fk" FOREIGN KEY ("checkin_type_id") REFERENCES "public"."checkin_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_records" ADD CONSTRAINT "checkin_records_participant_id_users_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_records" ADD CONSTRAINT "checkin_records_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkin_records_participant_idx" ON "checkin_records" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "checkin_records_checked_in_at_idx" ON "checkin_records" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX "checkin_types_display_order_idx" ON "checkin_types" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "checkin_types_is_active_idx" ON "checkin_types" USING btree ("is_active");