ALTER TABLE "mobile_phones_general" ADD COLUMN "negotiable" text[] DEFAULT ARRAY[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "mobile_phones_general" DROP COLUMN "negotiation";