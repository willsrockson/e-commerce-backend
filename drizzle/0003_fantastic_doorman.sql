CREATE TABLE "ads" (
	"ads_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" text NOT NULL,
	"town" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"main_category" text NOT NULL,
	"sub_category" text NOT NULL,
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"deactivated" boolean DEFAULT false NOT NULL,
	"metadata" jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;