-- Einzel-Löschen einer Fehlerfassung (#50, #237, Härtung #133): einheit.erfassung_id von CASCADE auf
-- NO ACTION DEFERRABLE INITIALLY DEFERRED. Eine Erfassung, an der noch Packungen hängen, lässt
-- sich nicht mehr einzeln löschen, die Historie verschwindet also nie still. Geprüft wird erst am
-- Ende der Transaktion: Das Löschen eines Haushalts entfernt Erfassungen und (über Produkt →
-- Einheit eine Ebene tiefer) die Packungen weiter gemeinsam per CASCADE.
-- Custom-Migration, weil Drizzle DEFERRABLE nicht abbilden kann. Der Snapshot nennt NO ACTION.
ALTER TABLE "einheit" DROP CONSTRAINT "einheit_erfassung_id_erfassung_id_fk";--> statement-breakpoint
ALTER TABLE "einheit" ADD CONSTRAINT "einheit_erfassung_id_erfassung_id_fk" FOREIGN KEY ("erfassung_id") REFERENCES "public"."erfassung"("id") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;
