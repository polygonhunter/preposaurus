CREATE TABLE "ki_verbindung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"anbieter" text NOT NULL,
	"name" text NOT NULL,
	"schluessel_chiffrat" text,
	"schluessel_iv" text,
	"schluessel_tag" text,
	"schluessel_hinweis" text,
	"schluessel_version" integer,
	"basis_url" text,
	"letzter_test_status" text,
	"letzter_test_am" timestamp with time zone,
	"aktiv" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ki_verbindung_name_eindeutig" UNIQUE("haushalt_id","name"),
	CONSTRAINT "ki_verbindung_id_haushalt_eindeutig" UNIQUE("id","haushalt_id"),
	CONSTRAINT "ki_verbindung_anbieter_check" CHECK ("ki_verbindung"."anbieter" in ('anthropic')),
	CONSTRAINT "ki_verbindung_test_status_check" CHECK ("ki_verbindung"."letzter_test_status" in ('ok', 'schluessel_ungueltig', 'kein_guthaben', 'zeitueberschreitung', 'fehler')),
	CONSTRAINT "ki_verbindung_schluessel_check" CHECK (("ki_verbindung"."schluessel_chiffrat" is null) = ("ki_verbindung"."schluessel_iv" is null)
        and ("ki_verbindung"."schluessel_iv" is null) = ("ki_verbindung"."schluessel_tag" is null)
        and ("ki_verbindung"."schluessel_tag" is null) = ("ki_verbindung"."schluessel_hinweis" is null)
        and ("ki_verbindung"."schluessel_hinweis" is null) = ("ki_verbindung"."schluessel_version" is null)),
	CONSTRAINT "ki_verbindung_hinweis_check" CHECK (char_length("ki_verbindung"."schluessel_hinweis") <= 4),
	CONSTRAINT "ki_verbindung_test_check" CHECK (("ki_verbindung"."letzter_test_status" is null) = ("ki_verbindung"."letzter_test_am" is null))
);
--> statement-breakpoint
CREATE TABLE "ki_rollen_zuweisung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"rolle" text NOT NULL,
	"verbindung_id" uuid NOT NULL,
	"modell" text NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ki_rollen_zuweisung_eindeutig" UNIQUE("haushalt_id","rolle"),
	CONSTRAINT "ki_rollen_zuweisung_rolle_check" CHECK ("ki_rollen_zuweisung"."rolle" in ('verpackung', 'naehrwerte', 'naehrwerte_schaetzen', 'mhd', 'mhd_zweitversuch'))
);
--> statement-breakpoint
ALTER TABLE "ki_aufruf" ADD COLUMN "rolle" text;--> statement-breakpoint
ALTER TABLE "ki_aufruf" ADD COLUMN "verbindung_id" uuid;--> statement-breakpoint
ALTER TABLE "ki_verbindung" ADD CONSTRAINT "ki_verbindung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_rollen_zuweisung" ADD CONSTRAINT "ki_rollen_zuweisung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_rollen_zuweisung" ADD CONSTRAINT "ki_rollen_zuweisung_verbindung_fk" FOREIGN KEY ("verbindung_id","haushalt_id") REFERENCES "public"."ki_verbindung"("id","haushalt_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_aufruf" ADD CONSTRAINT "ki_aufruf_verbindung_id_ki_verbindung_id_fk" FOREIGN KEY ("verbindung_id") REFERENCES "public"."ki_verbindung"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_aufruf" ADD CONSTRAINT "ki_aufruf_rolle_check" CHECK ("ki_aufruf"."rolle" in ('verpackung', 'naehrwerte', 'naehrwerte_schaetzen', 'mhd', 'mhd_zweitversuch'));