CREATE TABLE "ki_einstellung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"anbieter" text DEFAULT 'anthropic' NOT NULL,
	"schluessel_chiffrat" text,
	"schluessel_iv" text,
	"schluessel_tag" text,
	"modell_verpackung" text,
	"modell_naehrwerte" text,
	"modell_mhd" text,
	"letzter_test_status" text,
	"letzter_test_am" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ki_einstellung_haushalt_id_unique" UNIQUE("haushalt_id"),
	CONSTRAINT "ki_einstellung_anbieter_check" CHECK ("ki_einstellung"."anbieter" in ('anthropic')),
	CONSTRAINT "ki_einstellung_test_status_check" CHECK ("ki_einstellung"."letzter_test_status" in ('ok', 'schluessel_ungueltig', 'kein_guthaben', 'zeitueberschreitung', 'fehler')),
	CONSTRAINT "ki_einstellung_schluessel_check" CHECK (("ki_einstellung"."schluessel_chiffrat" is null) = ("ki_einstellung"."schluessel_iv" is null) and ("ki_einstellung"."schluessel_iv" is null) = ("ki_einstellung"."schluessel_tag" is null)),
	CONSTRAINT "ki_einstellung_test_check" CHECK (("ki_einstellung"."letzter_test_status" is null) = ("ki_einstellung"."letzter_test_am" is null))
);
--> statement-breakpoint
ALTER TABLE "ki_einstellung" ADD CONSTRAINT "ki_einstellung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;