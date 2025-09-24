CREATE TYPE "public"."email_verification_status" AS ENUM('Not Verified', 'Verified');--> statement-breakpoint
CREATE TYPE "public"."id_verification_status" AS ENUM('Not Verified', 'Processing', 'Verified');--> statement-breakpoint
CREATE TABLE "main_category" (
	"main_category_id" serial PRIMARY KEY NOT NULL,
	"main_name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "main_category_main_name_unique" UNIQUE("main_name")
);
--> statement-breakpoint
CREATE TABLE "sub_category" (
	"sub_category_id" serial PRIMARY KEY NOT NULL,
	"sub_name" text NOT NULL,
	"main_category_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sub_category_sub_name_unique" UNIQUE("sub_name")
);
--> statement-breakpoint
CREATE TABLE "mobile_phones" (
	"mobile_id" serial PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"storage" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"ram" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"colors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"battery_size" text NOT NULL,
	"screen_size" text NOT NULL,
	"conditions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"negotiation" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"exchange_possible" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"accessories" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"sub_category_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mobile_phones_model_unique" UNIQUE("model")
);
--> statement-breakpoint
CREATE TABLE "location" (
	"location_id" serial PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"region" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "town" (
	"town_id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avatars" (
	"avatar_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text,
	"user_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" text NOT NULL,
	"store_name" varchar(50),
	"full_name" text NOT NULL,
	"phone_primary" varchar(10) NOT NULL,
	"phone_secondary" varchar(10),
	"store_address" text,
	"token_version" integer DEFAULT 0,
	"email_verification_status" "email_verification_status" DEFAULT 'Not Verified' NOT NULL,
	"id_verification_status" "id_verification_status" DEFAULT 'Not Verified' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_primary_unique" UNIQUE("phone_primary"),
	CONSTRAINT "users_phone_secondary_unique" UNIQUE("phone_secondary")
);
--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "sub_category_main_category_id_main_category_main_category_id_fk" FOREIGN KEY ("main_category_id") REFERENCES "public"."main_category"("main_category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_phones" ADD CONSTRAINT "mobile_phones_sub_category_id_sub_category_sub_category_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_category"("sub_category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "town" ADD CONSTRAINT "town_location_id_location_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_town_per_region" ON "town" USING btree ("location_id","name");