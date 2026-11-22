CREATE TABLE "anmelde_sperre" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schluessel" text NOT NULL,
	"fehlversuche" integer DEFAULT 0 NOT NULL,
	"letzter_fehlversuch_am" timestamp with time zone,
	"gesperrt_bis" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anmelde_sperre_schluessel_unique" UNIQUE("schluessel"),
	CONSTRAINT "anmelde_sperre_schluessel_check" CHECK ("anmelde_sperre"."schluessel" ~ '^(name|ip):.+$'),
	CONSTRAINT "anmelde_sperre_fehlversuche_check" CHECK ("anmelde_sperre"."fehlversuche" >= 0)
);
