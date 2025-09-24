CREATE TABLE "mobile_phones_general" (
	"mobile_general_id" serial PRIMARY KEY NOT NULL,
	"conditions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"negotiation" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"exchange_possible" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"accessories" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"sub_category_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mobile_phones_general" ADD CONSTRAINT "mobile_phones_general_sub_category_id_sub_category_sub_category_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_category"("sub_category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_phones" DROP COLUMN "conditions";--> statement-breakpoint
ALTER TABLE "mobile_phones" DROP COLUMN "negotiation";--> statement-breakpoint
ALTER TABLE "mobile_phones" DROP COLUMN "exchange_possible";--> statement-breakpoint
ALTER TABLE "mobile_phones" DROP COLUMN "accessories";