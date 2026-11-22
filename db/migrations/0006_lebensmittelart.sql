CREATE TABLE "lebensmittelart" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid,
	"ist_system" boolean DEFAULT false NOT NULL,
	"schluessel" text,
	"name" text NOT NULL,
	"kategorie_id" uuid NOT NULL,
	"ausgeblendet" boolean DEFAULT false NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"kcal_100" numeric(6, 1),
	"uebliche_haltbarkeit_monate" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lebensmittelart_schluessel_unique" UNIQUE("schluessel"),
	CONSTRAINT "lebensmittelart_id_kategorie_eindeutig" UNIQUE("id","kategorie_id"),
	CONSTRAINT "lebensmittelart_name_eindeutig" UNIQUE("haushalt_id","name"),
	CONSTRAINT "lebensmittelart_herkunft_check" CHECK ("lebensmittelart"."ist_system" = ("lebensmittelart"."haushalt_id" is null) and "lebensmittelart"."ist_system" = ("lebensmittelart"."schluessel" is not null)),
	CONSTRAINT "lebensmittelart_kcal_check" CHECK ("lebensmittelart"."kcal_100" >= 0),
	CONSTRAINT "lebensmittelart_haltbarkeit_check" CHECK ("lebensmittelart"."uebliche_haltbarkeit_monate" > 0)
);
--> statement-breakpoint
ALTER TABLE "produkt" ADD COLUMN "lebensmittelart_id" uuid;--> statement-breakpoint
ALTER TABLE "lebensmittelart" ADD CONSTRAINT "lebensmittelart_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lebensmittelart" ADD CONSTRAINT "lebensmittelart_kategorie_id_kategorie_id_fk" FOREIGN KEY ("kategorie_id") REFERENCES "public"."kategorie"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lebensmittelart_kategorie_id_idx" ON "lebensmittelart" USING btree ("kategorie_id");--> statement-breakpoint
CREATE INDEX "lebensmittelart_haushalt_id_idx" ON "lebensmittelart" USING btree ("haushalt_id");--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_lebensmittelart_kategorie_fk" FOREIGN KEY ("lebensmittelart_id","kategorie_id") REFERENCES "public"."lebensmittelart"("id","kategorie_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "produkt_lebensmittelart_id_idx" ON "produkt" USING btree ("lebensmittelart_id");