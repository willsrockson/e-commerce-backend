ALTER TABLE "users" RENAME COLUMN "store_slug" TO "store_name_slug";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_store_slug_unique";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_store_name_slug_unique" UNIQUE("store_name_slug");