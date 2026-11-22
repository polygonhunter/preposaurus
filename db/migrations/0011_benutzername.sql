ALTER TABLE "nutzer" ADD COLUMN "benutzername" text NOT NULL;--> statement-breakpoint
ALTER TABLE "nutzer" ADD COLUMN "passwort_vorlaeufig" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nutzer" ADD COLUMN "passwort_geaendert_am" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nutzer" ADD COLUMN "passwort_geaendert_von" uuid;--> statement-breakpoint
ALTER TABLE "nutzer" ADD COLUMN "letzte_anmeldung_am" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nutzer" ADD COLUMN "ki_hinweis_bestaetigt_am" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nutzer" ADD CONSTRAINT "nutzer_passwort_geaendert_von_nutzer_id_fk" FOREIGN KEY ("passwort_geaendert_von") REFERENCES "public"."nutzer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nutzer_benutzername_eindeutig" ON "nutzer" USING btree (lower("benutzername"));--> statement-breakpoint
ALTER TABLE "nutzer" ADD CONSTRAINT "nutzer_benutzername_check" CHECK ("nutzer"."benutzername" ~ '^[a-z0-9._]{3,30}$');