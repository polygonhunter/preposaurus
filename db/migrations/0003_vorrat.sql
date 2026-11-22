CREATE TABLE "kategorie" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid,
	"ist_system" boolean DEFAULT false NOT NULL,
	"schluessel" text,
	"name" text NOT NULL,
	"piktogramm" text,
	"warengruppe_id" uuid NOT NULL,
	"ausgeblendet" boolean DEFAULT false NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"kcal_durchschnitt_100" numeric(6, 1),
	"uebliche_haltbarkeit_monate" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kategorie_schluessel_unique" UNIQUE("schluessel"),
	CONSTRAINT "kategorie_herkunft_check" CHECK ("kategorie"."ist_system" = ("kategorie"."haushalt_id" is null) and "kategorie"."ist_system" = ("kategorie"."schluessel" is not null)),
	CONSTRAINT "kategorie_kcal_check" CHECK ("kategorie"."kcal_durchschnitt_100" >= 0),
	CONSTRAINT "kategorie_haltbarkeit_check" CHECK ("kategorie"."uebliche_haltbarkeit_monate" > 0)
);
--> statement-breakpoint
CREATE TABLE "behaelter" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schluessel" text NOT NULL,
	"name" text NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "behaelter_schluessel_unique" UNIQUE("schluessel")
);
--> statement-breakpoint
CREATE TABLE "lagerort" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lagerort_eindeutig" UNIQUE("haushalt_id","name")
);
--> statement-breakpoint
CREATE TABLE "produkt" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"kategorie_id" uuid NOT NULL,
	"behaelter_id" uuid,
	"lagerort_id" uuid,
	"bezeichnung" text NOT NULL,
	"inhalt_wert" numeric(9, 2) NOT NULL,
	"inhalt_einheit" text NOT NULL,
	"abtropfgewicht_g" numeric(9, 2),
	"kcal_100" numeric(6, 2),
	"eiweiss_100" numeric(6, 2),
	"kh_100" numeric(6, 2),
	"fett_100" numeric(6, 2),
	"naehrwerte_geschaetzt" boolean DEFAULT false NOT NULL,
	"erfassung_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produkt_erfassung_id_unique" UNIQUE("erfassung_id"),
	CONSTRAINT "produkt_inhalt_einheit_check" CHECK ("produkt"."inhalt_einheit" in ('g', 'ml')),
	CONSTRAINT "produkt_inhalt_check" CHECK ("produkt"."inhalt_wert" > 0)
);
--> statement-breakpoint
CREATE TABLE "einheit" (
	"id" uuid PRIMARY KEY NOT NULL,
	"produkt_id" uuid NOT NULL,
	"mhd" date NOT NULL,
	"mhd_genauigkeit" text DEFAULT 'tag' NOT NULL,
	"mhd_art" text DEFAULT 'mhd' NOT NULL,
	"mhd_geschaetzt" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'vorrat' NOT NULL,
	"entnommen_am" timestamp with time zone,
	"entnommen_von" uuid,
	"geprueft_am" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "einheit_status_check" CHECK ("einheit"."status" in ('vorrat', 'verbraucht', 'entsorgt')),
	CONSTRAINT "einheit_mhd_genauigkeit_check" CHECK ("einheit"."mhd_genauigkeit" in ('tag', 'monat', 'jahr')),
	CONSTRAINT "einheit_mhd_art_check" CHECK ("einheit"."mhd_art" in ('mhd', 'verbrauchen_bis')),
	CONSTRAINT "einheit_entnahme_check" CHECK (("einheit"."status" = 'vorrat') = ("einheit"."entnommen_am" is null))
);
--> statement-breakpoint
ALTER TABLE "kategorie" ADD CONSTRAINT "kategorie_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kategorie" ADD CONSTRAINT "kategorie_warengruppe_id_warengruppe_id_fk" FOREIGN KEY ("warengruppe_id") REFERENCES "public"."warengruppe"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lagerort" ADD CONSTRAINT "lagerort_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_kategorie_id_kategorie_id_fk" FOREIGN KEY ("kategorie_id") REFERENCES "public"."kategorie"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_behaelter_id_behaelter_id_fk" FOREIGN KEY ("behaelter_id") REFERENCES "public"."behaelter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_lagerort_id_lagerort_id_fk" FOREIGN KEY ("lagerort_id") REFERENCES "public"."lagerort"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "einheit" ADD CONSTRAINT "einheit_produkt_id_produkt_id_fk" FOREIGN KEY ("produkt_id") REFERENCES "public"."produkt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "einheit" ADD CONSTRAINT "einheit_entnommen_von_nutzer_id_fk" FOREIGN KEY ("entnommen_von") REFERENCES "public"."nutzer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kategorie_haushalt_id_idx" ON "kategorie" USING btree ("haushalt_id");--> statement-breakpoint
CREATE INDEX "produkt_haushalt_id_idx" ON "produkt" USING btree ("haushalt_id");--> statement-breakpoint
CREATE INDEX "einheit_produkt_status_mhd_idx" ON "einheit" USING btree ("produkt_id","status","mhd");