CREATE TABLE "saved_ads" (
	"saved_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_category" text NOT NULL,
	"sub_category" text NOT NULL,
	"ads_id" uuid,
	"owner_user_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"phone_primary" text NOT NULL,
	"condition" text,
	"image_url" text NOT NULL,
	"price" integer,
	"location" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_ads_user_id_ads_id_unique" UNIQUE("user_id","ads_id")
);
--> statement-breakpoint
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_ads_id_ads_ads_id_fk" FOREIGN KEY ("ads_id") REFERENCES "public"."ads"("ads_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_owner_user_id_users_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_saved_ads_user" ON "saved_ads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_ads_owner" ON "saved_ads" USING btree ("owner_user_id");