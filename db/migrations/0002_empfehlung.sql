CREATE TABLE "ziel" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"tage" integer NOT NULL,
	"zieldatum" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ziel_haushalt_id_unique" UNIQUE("haushalt_id"),
	CONSTRAINT "ziel_tage_check" CHECK ("ziel"."tage" > 0)
);
--> statement-breakpoint
CREATE TABLE "warengruppe" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schluessel" text NOT NULL,
	"name" text NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warengruppe_schluessel_unique" UNIQUE("schluessel")
);
--> statement-breakpoint
CREATE TABLE "quelle_bedarf" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quelle_version_id" uuid NOT NULL,
	"personengruppe" text NOT NULL,
	"kcal_tag" numeric(7, 1) NOT NULL,
	"wasser_l_tag" numeric(4, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quelle_bedarf_eindeutig" UNIQUE("quelle_version_id","personengruppe"),
	CONSTRAINT "quelle_bedarf_werte_check" CHECK ("quelle_bedarf"."kcal_tag" >= 0 and "quelle_bedarf"."wasser_l_tag" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quelle_wert" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quelle_version_id" uuid NOT NULL,
	"warengruppe_id" uuid NOT NULL,
	"ernaehrungsform" text DEFAULT 'alles' NOT NULL,
	"menge_pro_person_tag" numeric(9, 2) NOT NULL,
	"mass_einheit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quelle_wert_eindeutig" UNIQUE("quelle_version_id","warengruppe_id","ernaehrungsform"),
	CONSTRAINT "quelle_wert_ernaehrungsform_check" CHECK ("quelle_wert"."ernaehrungsform" in ('alles', 'vegetarisch', 'vegan')),
	CONSTRAINT "quelle_wert_mass_einheit_check" CHECK ("quelle_wert"."mass_einheit" in ('g', 'ml')),
	CONSTRAINT "quelle_wert_menge_check" CHECK ("quelle_wert"."menge_pro_person_tag" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quelle_version" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quelle_id" uuid NOT NULL,
	"stand" text NOT NULL,
	"link" text NOT NULL,
	"standard_tage" integer NOT NULL,
	"geprueft" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quelle_version_eindeutig" UNIQUE("quelle_id","stand"),
	CONSTRAINT "quelle_version_standard_tage_check" CHECK ("quelle_version"."standard_tage" > 0)
);
--> statement-breakpoint
CREATE TABLE "quelle" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schluessel" text NOT NULL,
	"name" text NOT NULL,
	"land" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quelle_schluessel_unique" UNIQUE("schluessel")
);
--> statement-breakpoint
ALTER TABLE "ziel" ADD CONSTRAINT "ziel_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quelle_bedarf" ADD CONSTRAINT "quelle_bedarf_quelle_version_id_quelle_version_id_fk" FOREIGN KEY ("quelle_version_id") REFERENCES "public"."quelle_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quelle_wert" ADD CONSTRAINT "quelle_wert_quelle_version_id_quelle_version_id_fk" FOREIGN KEY ("quelle_version_id") REFERENCES "public"."quelle_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quelle_wert" ADD CONSTRAINT "quelle_wert_warengruppe_id_warengruppe_id_fk" FOREIGN KEY ("warengruppe_id") REFERENCES "public"."warengruppe"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quelle_version" ADD CONSTRAINT "quelle_version_quelle_id_quelle_id_fk" FOREIGN KEY ("quelle_id") REFERENCES "public"."quelle"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "haushalt" ADD CONSTRAINT "haushalt_aktive_quelle_id_quelle_id_fk" FOREIGN KEY ("aktive_quelle_id") REFERENCES "public"."quelle"("id") ON DELETE set null ON UPDATE no action;