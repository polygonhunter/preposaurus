-- Orange-Schwelle mindestens 7 Tage und höchstens die Gelb-Schwelle (E-21, #135).
-- Bestehende Einstellungen unter 7 Tagen werden vorher auf 7 angehoben, Gelb bei Bedarf mit.
ALTER TABLE "haushalt_einstellung" DROP CONSTRAINT "haushalt_einstellung_ampel_check";--> statement-breakpoint
UPDATE "haushalt_einstellung" SET "ampel_orange_tage" = 7, "ampel_gelb_tage" = greatest("ampel_gelb_tage", 7) WHERE "ampel_orange_tage" < 7;--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD CONSTRAINT "haushalt_einstellung_ampel_check" CHECK ("haushalt_einstellung"."ampel_orange_tage" >= 7 and "haushalt_einstellung"."ampel_orange_tage" <= "haushalt_einstellung"."ampel_gelb_tage");
