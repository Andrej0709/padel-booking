CREATE TABLE "blokade" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"klub_id" uuid NOT NULL,
	"korisnik_id" text NOT NULL,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blokade_klub_korisnik_unique" UNIQUE("klub_id","korisnik_id")
);
--> statement-breakpoint
CREATE TABLE "korisnici" (
	"id" text PRIMARY KEY NOT NULL,
	"ime" text NOT NULL,
	"email" text NOT NULL,
	"email_potvrdjen" boolean DEFAULT false NOT NULL,
	"slika" text,
	"telefon" text,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	"azurirano" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "korisnici_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "nacini_prijave" (
	"id" text PRIMARY KEY NOT NULL,
	"nalog_id" text NOT NULL,
	"nacin" text NOT NULL,
	"korisnik_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_istice" timestamp with time zone,
	"refresh_token_istice" timestamp with time zone,
	"scope" text,
	"lozinka" text,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	"azurirano" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesije" (
	"id" text PRIMARY KEY NOT NULL,
	"istice" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_adresa" text,
	"uredjaj" text,
	"korisnik_id" text NOT NULL,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	"azurirano" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sesije_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifikacije" (
	"id" text PRIMARY KEY NOT NULL,
	"oznaka" text NOT NULL,
	"vrednost" text NOT NULL,
	"istice" timestamp with time zone NOT NULL,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	"azurirano" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Existing clubs get a slug made from their name before the column becomes required.
ALTER TABLE "klubovi" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "klubovi" SET "slug" = trim(both '-' from regexp_replace(lower(split_part("naziv", '(', 1)), '[^a-z0-9]+', '-', 'g')) || '-' || left("id"::text, 4);--> statement-breakpoint
ALTER TABLE "klubovi" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "klubovi" ADD COLUMN "cena_po_satu_rsd" integer;--> statement-breakpoint
ALTER TABLE "rezervacije" ADD COLUMN "korisnik_id" text;--> statement-breakpoint
ALTER TABLE "blokade" ADD CONSTRAINT "blokade_klub_id_klubovi_id_fk" FOREIGN KEY ("klub_id") REFERENCES "public"."klubovi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blokade" ADD CONSTRAINT "blokade_korisnik_id_korisnici_id_fk" FOREIGN KEY ("korisnik_id") REFERENCES "public"."korisnici"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nacini_prijave" ADD CONSTRAINT "nacini_prijave_korisnik_id_korisnici_id_fk" FOREIGN KEY ("korisnik_id") REFERENCES "public"."korisnici"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesije" ADD CONSTRAINT "sesije_korisnik_id_korisnici_id_fk" FOREIGN KEY ("korisnik_id") REFERENCES "public"."korisnici"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nacini_prijave_korisnik_idx" ON "nacini_prijave" USING btree ("korisnik_id");--> statement-breakpoint
CREATE INDEX "sesije_korisnik_idx" ON "sesije" USING btree ("korisnik_id");--> statement-breakpoint
CREATE INDEX "verifikacije_oznaka_idx" ON "verifikacije" USING btree ("oznaka");--> statement-breakpoint
ALTER TABLE "rezervacije" ADD CONSTRAINT "rezervacije_korisnik_id_korisnici_id_fk" FOREIGN KEY ("korisnik_id") REFERENCES "public"."korisnici"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rezervacije_korisnik_idx" ON "rezervacije" USING btree ("korisnik_id");--> statement-breakpoint
ALTER TABLE "klubovi" ADD CONSTRAINT "klubovi_slug_unique" UNIQUE("slug");