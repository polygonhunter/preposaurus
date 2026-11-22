CREATE INDEX "produkt_kategorie_id_idx" ON "produkt" USING btree ("kategorie_id");--> statement-breakpoint
CREATE INDEX "produkt_behaelter_id_idx" ON "produkt" USING btree ("behaelter_id");--> statement-breakpoint
CREATE INDEX "produkt_lagerort_id_idx" ON "produkt" USING btree ("lagerort_id");--> statement-breakpoint
CREATE INDEX "einheit_mhd_vorrat_idx" ON "einheit" USING btree ("mhd") WHERE "einheit"."status" = 'vorrat';