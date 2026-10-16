CREATE TYPE "public"."izvor_rezervacije" AS ENUM('telefon', 'online');--> statement-breakpoint
CREATE TYPE "public"."status_rezervacije" AS ENUM('potvrdjena', 'odigrana', 'nedolazak', 'otkazana');--> statement-breakpoint
CREATE TYPE "public"."uloga" AS ENUM('vlasnik', 'recepcija');--> statement-breakpoint
CREATE TYPE "public"."vrsta_terena" AS ENUM('zatvoren', 'otvoren');--> statement-breakpoint
CREATE TABLE "igraci" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"klub_id" uuid NOT NULL,
	"ime" text NOT NULL,
	"telefon" text NOT NULL,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "igraci_klub_telefon_unique" UNIQUE("klub_id","telefon"),
	CONSTRAINT "igraci_telefon_format" CHECK ("igraci"."telefon" ~ '^\+[0-9]{8,15}$')
);
--> statement-breakpoint
CREATE TABLE "klubovi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"naziv" text NOT NULL,
	"adresa" text,
	"telefon" text,
	"vremenska_zona" text DEFAULT 'Europe/Belgrade' NOT NULL,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radno_vreme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teren_id" uuid NOT NULL,
	"dan" smallint NOT NULL,
	"otvara" time NOT NULL,
	"zatvara" time NOT NULL,
	CONSTRAINT "radno_vreme_dan_check" CHECK ("radno_vreme"."dan" between 1 and 7),
	CONSTRAINT "radno_vreme_otvara_pre_zatvara" CHECK ("radno_vreme"."otvara" < "radno_vreme"."zatvara")
);
--> statement-breakpoint
CREATE TABLE "rezervacije" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teren_id" uuid NOT NULL,
	"igrac_id" uuid NOT NULL,
	"pocetak" timestamp with time zone NOT NULL,
	"kraj" timestamp with time zone NOT NULL,
	"cena_rsd" integer,
	"status" "status_rezervacije" DEFAULT 'potvrdjena' NOT NULL,
	"izvor" "izvor_rezervacije" NOT NULL,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rezervacije_pocetak_pre_kraja" CHECK ("rezervacije"."pocetak" < "rezervacije"."kraj"),
	CONSTRAINT "rezervacije_cena_pozitivna" CHECK ("rezervacije"."cena_rsd" is null or "rezervacije"."cena_rsd" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tereni" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"klub_id" uuid NOT NULL,
	"naziv" text NOT NULL,
	"vrsta" "vrsta_terena" NOT NULL,
	"aktivan" boolean DEFAULT true NOT NULL,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tereni_klub_naziv_unique" UNIQUE("klub_id","naziv")
);
--> statement-breakpoint
CREATE TABLE "vlasnici" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"klub_id" uuid NOT NULL,
	"ime" text NOT NULL,
	"email" text NOT NULL,
	"uloga" "uloga" DEFAULT 'recepcija' NOT NULL,
	"kreirano" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vlasnici_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "igraci" ADD CONSTRAINT "igraci_klub_id_klubovi_id_fk" FOREIGN KEY ("klub_id") REFERENCES "public"."klubovi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radno_vreme" ADD CONSTRAINT "radno_vreme_teren_id_tereni_id_fk" FOREIGN KEY ("teren_id") REFERENCES "public"."tereni"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rezervacije" ADD CONSTRAINT "rezervacije_teren_id_tereni_id_fk" FOREIGN KEY ("teren_id") REFERENCES "public"."tereni"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rezervacije" ADD CONSTRAINT "rezervacije_igrac_id_igraci_id_fk" FOREIGN KEY ("igrac_id") REFERENCES "public"."igraci"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tereni" ADD CONSTRAINT "tereni_klub_id_klubovi_id_fk" FOREIGN KEY ("klub_id") REFERENCES "public"."klubovi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vlasnici" ADD CONSTRAINT "vlasnici_klub_id_klubovi_id_fk" FOREIGN KEY ("klub_id") REFERENCES "public"."klubovi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "radno_vreme_teren_dan_idx" ON "radno_vreme" USING btree ("teren_id","dan");--> statement-breakpoint
CREATE INDEX "rezervacije_igrac_idx" ON "rezervacije" USING btree ("igrac_id");