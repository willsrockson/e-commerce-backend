CREATE TYPE "public"."email_verified" AS ENUM('unverified', 'verified');--> statement-breakpoint
CREATE TYPE "public"."id_verified" AS ENUM('unverified', 'processing', 'verified');--> statement-breakpoint
CREATE TYPE "public"."phone_primary_verified" AS ENUM('unverified', 'verified');--> statement-breakpoint
CREATE TYPE "public"."phone_secondary_verified" AS ENUM('unverified', 'verified');--> statement-breakpoint
CREATE TYPE "public"."provider_name" AS ENUM('google');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'moderator', 'superuser');--> statement-breakpoint
CREATE TABLE "ads" (
	"ads_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" text NOT NULL,
	"town" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"main_category" text NOT NULL,
	"main_slug" text NOT NULL,
	"sub_category" text NOT NULL,
	"sub_slug" text NOT NULL,
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"deactivated" boolean DEFAULT false NOT NULL,
	"metadata" jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ads_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saved_ads" (
	"saved_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_category" text NOT NULL,
	"sub_category" text NOT NULL,
	"ads_id" uuid,
	"slug" text NOT NULL,
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
CREATE TABLE "main_category" (
	"main_category_id" serial PRIMARY KEY NOT NULL,
	"main_name" text NOT NULL,
	"main_slug" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "main_category_main_name_unique" UNIQUE("main_name"),
	CONSTRAINT "main_category_main_slug_unique" UNIQUE("main_slug")
);
--> statement-breakpoint
CREATE TABLE "sub_category" (
	"sub_category_id" serial PRIMARY KEY NOT NULL,
	"sub_name" text NOT NULL,
	"sub_slug" text NOT NULL,
	"main_category_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sub_category_sub_slug_unique" UNIQUE("sub_slug"),
	CONSTRAINT "sub_category_sub_name_main_category_id_unique" UNIQUE("sub_name","main_category_id")
);
--> statement-breakpoint
CREATE TABLE "mobile_phones_general" (
	"mobile_general_id" serial PRIMARY KEY NOT NULL,
	"conditions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"negotiable" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"exchange_possible" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"accessories" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"verification_status" text[] DEFAULT ARRAY['verified', 'unverified']::text[] NOT NULL,
	"sub_category_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobile_phones" (
	"mobile_id" serial PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"storage" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"ram" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"colors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"battery_size" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"screen_size" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"sub_category_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mobile_phones_model_unique" UNIQUE("model")
);
--> statement-breakpoint
CREATE TABLE "region" (
	"region_id" serial PRIMARY KEY NOT NULL,
	"country" text DEFAULT 'Ghana' NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "region_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "town" (
	"town_id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "avatars_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" text,
	"store_name" varchar(50),
	"full_name" text NOT NULL,
	"phone_primary" varchar(10),
	"phone_secondary" varchar(10),
	"provider_id" text,
	"provider_name" "provider_name",
	"role" "role" DEFAULT 'user' NOT NULL,
	"store_address" text,
	"token_version" integer DEFAULT 0 NOT NULL,
	"email_verified" "email_verified" DEFAULT 'unverified' NOT NULL,
	"phone_primary_verified" "phone_primary_verified" DEFAULT 'unverified' NOT NULL,
	"phone_secondary_verified" "phone_secondary_verified" DEFAULT 'unverified' NOT NULL,
	"id_verified" "id_verified" DEFAULT 'unverified' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_primary_unique" UNIQUE("phone_primary"),
	CONSTRAINT "users_phone_secondary_unique" UNIQUE("phone_secondary"),
	CONSTRAINT "users_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_ads_id_ads_ads_id_fk" FOREIGN KEY ("ads_id") REFERENCES "public"."ads"("ads_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_owner_user_id_users_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "sub_category_main_category_id_main_category_main_category_id_fk" FOREIGN KEY ("main_category_id") REFERENCES "public"."main_category"("main_category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_phones_general" ADD CONSTRAINT "mobile_phones_general_sub_category_id_sub_category_sub_category_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_category"("sub_category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_phones" ADD CONSTRAINT "mobile_phones_sub_category_id_sub_category_sub_category_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_category"("sub_category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "town" ADD CONSTRAINT "town_region_id_region_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("region_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_saved_ads_user" ON "saved_ads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_ads_owner" ON "saved_ads" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_town_per_region" ON "town" USING btree ("region_id","name");