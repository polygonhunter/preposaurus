ALTER TABLE "haushalt_einstellung" ADD COLUMN "noch_gut_zaehlt_mit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD COLUMN "wochenuebersicht_aktiv" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD COLUMN "wochenuebersicht_wochentag" smallint DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD COLUMN "wochenuebersicht_uhrzeit" time DEFAULT '10:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD COLUMN "dringend_aktiv" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD COLUMN "einrichtung_abgeschlossen_am" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD CONSTRAINT "haushalt_einstellung_wochentag_check" CHECK ("haushalt_einstellung"."wochenuebersicht_wochentag" between 1 and 7);