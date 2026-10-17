ALTER TABLE "klubovi" ADD COLUMN "opis" text;--> statement-breakpoint
ALTER TABLE "klubovi" ADD COLUMN "pogodnosti" text[] DEFAULT '{}'::text[] NOT NULL;