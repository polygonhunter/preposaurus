ALTER TABLE "lebensmittelart" DROP CONSTRAINT "lebensmittelart_kategorie_id_kategorie_id_fk";--> statement-breakpoint
ALTER TABLE "produkt" DROP CONSTRAINT "produkt_kategorie_id_kategorie_id_fk";--> statement-breakpoint
ALTER TABLE "produkt" DROP CONSTRAINT "produkt_lebensmittelart_kategorie_fk";--> statement-breakpoint
ALTER TABLE "kategorie" ADD CONSTRAINT "kategorie_name_eindeutig" UNIQUE("haushalt_id","name");--> statement-breakpoint
ALTER TABLE "einheit" ADD CONSTRAINT "einheit_id_produkt_eindeutig" UNIQUE("id","produkt_id");--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_einheit_produkt_fk" FOREIGN KEY ("einheit_id","produkt_id") REFERENCES "public"."einheit"("id","produkt_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lebensmittelart" ADD CONSTRAINT "lebensmittelart_kategorie_id_kategorie_id_fk" FOREIGN KEY ("kategorie_id") REFERENCES "public"."kategorie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_kategorie_id_kategorie_id_fk" FOREIGN KEY ("kategorie_id") REFERENCES "public"."kategorie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_lebensmittelart_kategorie_fk" FOREIGN KEY ("lebensmittelart_id","kategorie_id") REFERENCES "public"."lebensmittelart"("id","kategorie_id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "einheit" ADD CONSTRAINT "einheit_entnommen_von_check" CHECK ("einheit"."status" <> 'vorrat' or "einheit"."entnommen_von" is null);
