CREATE TABLE "haushalt_einstellung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"standard_ernaehrungsform" text DEFAULT 'alles' NOT NULL,
	"ampel_gelb_tage" integer DEFAULT 90 NOT NULL,
	"ampel_orange_tage" integer DEFAULT 28 NOT NULL,
	"ki_aktiv" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "haushalt_einstellung_haushalt_id_unique" UNIQUE("haushalt_id"),
	CONSTRAINT "haushalt_einstellung_ernaehrungsform_check" CHECK ("haushalt_einstellung"."standard_ernaehrungsform" in ('alles', 'vegetarisch', 'vegan')),
	CONSTRAINT "haushalt_einstellung_ampel_check" CHECK ("haushalt_einstellung"."ampel_orange_tage" > 0 and "haushalt_einstellung"."ampel_orange_tage" <= "haushalt_einstellung"."ampel_gelb_tage")
);
--> statement-breakpoint
CREATE TABLE "haushalt" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"aktive_quelle_id" uuid,
	"rechenmodus" text DEFAULT 'offiziell' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "haushalt_rechenmodus_check" CHECK ("haushalt"."rechenmodus" in ('offiziell', 'individuell'))
);
--> statement-breakpoint
CREATE TABLE "mitglied_allergie" (
	"id" uuid PRIMARY KEY NOT NULL,
	"mitglied_id" uuid NOT NULL,
	"bezeichnung" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mitglied_allergie_eindeutig" UNIQUE("mitglied_id","bezeichnung")
);
--> statement-breakpoint
CREATE TABLE "mitglied" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"name" text NOT NULL,
	"piktogramm" text,
	"typ" text NOT NULL,
	"geburtsdatum" date,
	"geschlecht" text,
	"aktivitaet" text,
	"gewicht_kg" numeric(5, 1),
	"zustand" text,
	"ernaehrungsform" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mitglied_typ_check" CHECK ("mitglied"."typ" in ('baby', 'kind', 'jugendlich', 'erwachsen', 'senior')),
	CONSTRAINT "mitglied_geschlecht_check" CHECK ("mitglied"."geschlecht" in ('weiblich', 'maennlich', 'divers')),
	CONSTRAINT "mitglied_aktivitaet_check" CHECK ("mitglied"."aktivitaet" in ('wenig', 'normal', 'viel')),
	CONSTRAINT "mitglied_zustand_check" CHECK ("mitglied"."zustand" in ('schwanger', 'stillend')),
	CONSTRAINT "mitglied_ernaehrungsform_check" CHECK ("mitglied"."ernaehrungsform" in ('alles', 'vegetarisch', 'vegan')),
	CONSTRAINT "mitglied_gewicht_check" CHECK ("mitglied"."gewicht_kg" > 0)
);
--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD CONSTRAINT "haushalt_einstellung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mitglied_allergie" ADD CONSTRAINT "mitglied_allergie_mitglied_id_mitglied_id_fk" FOREIGN KEY ("mitglied_id") REFERENCES "public"."mitglied"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mitglied" ADD CONSTRAINT "mitglied_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mitglied_haushalt_id_idx" ON "mitglied" USING btree ("haushalt_id");--> statement-breakpoint
ALTER TABLE "nutzer" ADD CONSTRAINT "nutzer_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutzer" ADD CONSTRAINT "nutzer_mitglied_id_mitglied_id_fk" FOREIGN KEY ("mitglied_id") REFERENCES "public"."mitglied"("id") ON DELETE set null ON UPDATE no action;