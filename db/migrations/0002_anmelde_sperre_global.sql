-- Anmeldebremse: zusätzlicher Schlüssel global für die Obergrenze über alle Adressen (Review #138).
ALTER TABLE "anmelde_sperre" DROP CONSTRAINT "anmelde_sperre_schluessel_check";--> statement-breakpoint
ALTER TABLE "anmelde_sperre" ADD CONSTRAINT "anmelde_sperre_schluessel_check" CHECK ("anmelde_sperre"."schluessel" ~ '^((name|ip):.+|global)$');
