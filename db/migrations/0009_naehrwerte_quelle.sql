ALTER TABLE "produkt" ADD COLUMN "naehrwerte_quelle" text;--> statement-breakpoint
ALTER TABLE "produkt" ADD COLUMN "naehrwerte_bestaetigt_am" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_naehrwerte_quelle_check" CHECK ("produkt"."naehrwerte_quelle" in ('tabelle', 'ki_schaetzung', 'richtwert', 'manuell'));--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_naehrwerte_bestaetigt_check" CHECK ("produkt"."naehrwerte_bestaetigt_am" is null or "produkt"."naehrwerte_quelle" is not null);