-- Nachkaufen: Lücken abhaken oder ausblenden (#201, DATENKATALOG §2.10). quelle bekommt „ziel“,
-- erledigt (boolean) wird status (offen · erledigt · ausgeblendet), dazu erledigt_am. Von drizzle-kit
-- erzeugt; von Hand ergänzt ist nur das UPDATE: Abgehakte Einträge behalten ihren Zustand, als
-- Zeitpunkt gilt ihre letzte Änderung (bisher die Sortierung von „Erledigt“).
ALTER TABLE "nachkauf_eintrag" DROP CONSTRAINT "nachkauf_eintrag_quelle_check";--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD COLUMN "status" text DEFAULT 'offen' NOT NULL;--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD COLUMN "erledigt_am" timestamp with time zone;--> statement-breakpoint
UPDATE "nachkauf_eintrag" SET "status" = 'erledigt', "erledigt_am" = "updated_at" WHERE "erledigt";--> statement-breakpoint
CREATE UNIQUE INDEX "nachkauf_eintrag_ziel_eindeutig" ON "nachkauf_eintrag" USING btree ("haushalt_id","warengruppe_id","status") WHERE "nachkauf_eintrag"."quelle" = 'ziel';--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" DROP COLUMN "erledigt";--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_status_check" CHECK ("nachkauf_eintrag"."status" in ('offen', 'erledigt', 'ausgeblendet'));--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_ziel_status_check" CHECK (("nachkauf_eintrag"."quelle" = 'ziel' and "nachkauf_eintrag"."status" <> 'offen') or ("nachkauf_eintrag"."quelle" <> 'ziel' and "nachkauf_eintrag"."status" <> 'ausgeblendet'));--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_erledigt_am_check" CHECK (("nachkauf_eintrag"."status" = 'offen') = ("nachkauf_eintrag"."erledigt_am" is null));--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_quelle_check" CHECK ("nachkauf_eintrag"."quelle" in ('ziel', 'nachkauf', 'manuell'));