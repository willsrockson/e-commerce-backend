CREATE TABLE "search_terms" (
	"term" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
