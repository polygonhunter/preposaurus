ALTER TABLE "lebensmittelart" DROP CONSTRAINT "lebensmittelart_schluessel_unique";--> statement-breakpoint
ALTER TABLE "lebensmittelart" DROP CONSTRAINT "lebensmittelart_herkunft_check";--> statement-breakpoint
ALTER TABLE "lebensmittelart" ALTER COLUMN "schluessel" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "lebensmittelart_schluessel_system_eindeutig" ON "lebensmittelart" USING btree ("schluessel") WHERE "lebensmittelart"."haushalt_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "lebensmittelart_schluessel_eigen_eindeutig" ON "lebensmittelart" USING btree ("haushalt_id","schluessel") WHERE "lebensmittelart"."haushalt_id" is not null;--> statement-breakpoint
ALTER TABLE "lebensmittelart" ADD CONSTRAINT "lebensmittelart_schluessel_check" CHECK ("lebensmittelart"."schluessel" ~ '^[a-z0-9_]{2,60}$');--> statement-breakpoint
ALTER TABLE "lebensmittelart" ADD CONSTRAINT "lebensmittelart_herkunft_check" CHECK ("lebensmittelart"."ist_system" = ("lebensmittelart"."haushalt_id" is null) and "lebensmittelart"."ist_system" = ("lebensmittelart"."schluessel" !~ '^eigen_'));