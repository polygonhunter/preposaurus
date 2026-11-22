CREATE TABLE "konto" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"nutzer_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sitzung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"nutzer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sitzung_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "nutzer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"benutzername" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"rolle" text DEFAULT 'mitglied' NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"haushalt_id" uuid,
	"mitglied_id" uuid,
	"passwort_vorlaeufig" boolean DEFAULT false NOT NULL,
	"passwort_geaendert_am" timestamp with time zone,
	"passwort_geaendert_von" uuid,
	"letzte_anmeldung_am" timestamp with time zone,
	"ki_hinweis_bestaetigt_am" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nutzer_email_unique" UNIQUE("email"),
	CONSTRAINT "nutzer_mitglied_id_unique" UNIQUE("mitglied_id"),
	CONSTRAINT "nutzer_rolle_check" CHECK ("nutzer"."rolle" in ('admin', 'mitglied')),
	CONSTRAINT "nutzer_benutzername_check" CHECK ("nutzer"."benutzername" ~ '^[a-z0-9][a-z0-9._]{2,29}$')
);
--> statement-breakpoint
CREATE TABLE "verifizierung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ki_verbindung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"anbieter" text NOT NULL,
	"name" text NOT NULL,
	"schluessel_chiffrat" text,
	"schluessel_iv" text,
	"schluessel_tag" text,
	"schluessel_hinweis" text,
	"schluessel_version" integer,
	"basis_url" text,
	"letzter_test_status" text,
	"letzter_test_am" timestamp with time zone,
	"aktiv" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ki_verbindung_name_eindeutig" UNIQUE("haushalt_id","name"),
	CONSTRAINT "ki_verbindung_id_haushalt_eindeutig" UNIQUE("id","haushalt_id"),
	CONSTRAINT "ki_verbindung_anbieter_check" CHECK ("ki_verbindung"."anbieter" in ('anthropic')),
	CONSTRAINT "ki_verbindung_test_status_check" CHECK ("ki_verbindung"."letzter_test_status" in ('ok', 'schluessel_ungueltig', 'kein_guthaben', 'zeitueberschreitung', 'fehler')),
	CONSTRAINT "ki_verbindung_schluessel_check" CHECK (("ki_verbindung"."schluessel_chiffrat" is null) = ("ki_verbindung"."schluessel_iv" is null)
        and ("ki_verbindung"."schluessel_iv" is null) = ("ki_verbindung"."schluessel_tag" is null)
        and ("ki_verbindung"."schluessel_tag" is null) = ("ki_verbindung"."schluessel_hinweis" is null)
        and ("ki_verbindung"."schluessel_hinweis" is null) = ("ki_verbindung"."schluessel_version" is null)),
	CONSTRAINT "ki_verbindung_hinweis_check" CHECK (char_length("ki_verbindung"."schluessel_hinweis") <= 4),
	CONSTRAINT "ki_verbindung_test_check" CHECK (("ki_verbindung"."letzter_test_status" is null) = ("ki_verbindung"."letzter_test_am" is null))
);
--> statement-breakpoint
CREATE TABLE "ki_rollen_zuweisung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"rolle" text NOT NULL,
	"verbindung_id" uuid NOT NULL,
	"modell" text NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ki_rollen_zuweisung_eindeutig" UNIQUE("haushalt_id","rolle"),
	CONSTRAINT "ki_rollen_zuweisung_rolle_check" CHECK ("ki_rollen_zuweisung"."rolle" in ('verpackung', 'naehrwerte', 'naehrwerte_schaetzen', 'mhd', 'mhd_zweitversuch'))
);
--> statement-breakpoint
CREATE TABLE "ki_aufruf" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"foto_id" uuid,
	"rolle" text,
	"verbindung_id" uuid,
	"versuch" smallint DEFAULT 1 NOT NULL,
	"sicherheit" text,
	"modell" text NOT NULL,
	"tokens_ein" integer,
	"tokens_aus" integer,
	"kosten_usd" numeric(10, 6),
	"dauer_ms" integer,
	"erfolg" boolean NOT NULL,
	"fehlerart" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ki_aufruf_rolle_check" CHECK ("ki_aufruf"."rolle" in ('verpackung', 'naehrwerte', 'naehrwerte_schaetzen', 'mhd', 'mhd_zweitversuch')),
	CONSTRAINT "ki_aufruf_versuch_check" CHECK ("ki_aufruf"."versuch" between 1 and 2),
	CONSTRAINT "ki_aufruf_sicherheit_check" CHECK ("ki_aufruf"."sicherheit" in ('hoch', 'mittel', 'niedrig'))
);
--> statement-breakpoint
CREATE TABLE "erfassung_entwurf" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"nutzer_id" uuid NOT NULL,
	"daten" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foto" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"rolle" text NOT NULL,
	"pfad" text NOT NULL,
	"dateityp" text NOT NULL,
	"status" text DEFAULT 'entwurf' NOT NULL,
	"nutzer_id" uuid,
	"entwurf_id" uuid,
	"produkt_id" uuid,
	"einheit_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "foto_pfad_unique" UNIQUE("pfad"),
	CONSTRAINT "foto_rolle_check" CHECK ("foto"."rolle" in ('verpackung', 'naehrwerte', 'mhd')),
	CONSTRAINT "foto_status_check" CHECK ("foto"."status" in ('entwurf', 'fest')),
	CONSTRAINT "foto_fest_check" CHECK ("foto"."status" <> 'fest' or "foto"."produkt_id" is not null),
	CONSTRAINT "foto_einheit_braucht_produkt_check" CHECK ("foto"."einheit_id" is null or "foto"."produkt_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "kategorie" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid,
	"ist_system" boolean DEFAULT false NOT NULL,
	"schluessel" text,
	"name" text NOT NULL,
	"piktogramm" text,
	"warengruppe_id" uuid NOT NULL,
	"ausgeblendet" boolean DEFAULT false NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kategorie_schluessel_unique" UNIQUE("schluessel"),
	CONSTRAINT "kategorie_name_eindeutig" UNIQUE("haushalt_id","name"),
	CONSTRAINT "kategorie_herkunft_check" CHECK ("kategorie"."ist_system" = ("kategorie"."haushalt_id" is null) and "kategorie"."ist_system" = ("kategorie"."schluessel" is not null))
);
--> statement-breakpoint
CREATE TABLE "behaelter" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schluessel" text NOT NULL,
	"name" text NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "behaelter_schluessel_unique" UNIQUE("schluessel")
);
--> statement-breakpoint
CREATE TABLE "lagerort" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"name" text NOT NULL,
	"ausgeblendet" boolean DEFAULT false NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lagerort_eindeutig" UNIQUE("haushalt_id","name")
);
--> statement-breakpoint
CREATE TABLE "erfassung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"nutzer_id" uuid NOT NULL,
	"weg" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "erfassung_weg_check" CHECK ("erfassung"."weg" in ('foto', 'manuell'))
);
--> statement-breakpoint
CREATE TABLE "lebensmittelart" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid,
	"ist_system" boolean DEFAULT false NOT NULL,
	"schluessel" text NOT NULL,
	"name" text NOT NULL,
	"kategorie_id" uuid NOT NULL,
	"ausgeblendet" boolean DEFAULT false NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"kcal_100" numeric(6, 1),
	"eiweiss_100" numeric(6, 1),
	"kh_100" numeric(6, 1),
	"fett_100" numeric(6, 1),
	"uebliche_haltbarkeit_monate" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lebensmittelart_id_kategorie_eindeutig" UNIQUE("id","kategorie_id"),
	CONSTRAINT "lebensmittelart_name_eindeutig" UNIQUE("haushalt_id","name"),
	CONSTRAINT "lebensmittelart_herkunft_check" CHECK ("lebensmittelart"."ist_system" = ("lebensmittelart"."haushalt_id" is null) and "lebensmittelart"."ist_system" = ("lebensmittelart"."schluessel" !~ '^eigen_')),
	CONSTRAINT "lebensmittelart_schluessel_check" CHECK ("lebensmittelart"."schluessel" ~ '^[a-z0-9_]{2,60}$'),
	CONSTRAINT "lebensmittelart_kcal_check" CHECK ("lebensmittelart"."kcal_100" >= 0),
	CONSTRAINT "lebensmittelart_makros_check" CHECK ("lebensmittelart"."eiweiss_100" >= 0 and "lebensmittelart"."kh_100" >= 0 and "lebensmittelart"."fett_100" >= 0),
	CONSTRAINT "lebensmittelart_haltbarkeit_check" CHECK ("lebensmittelart"."uebliche_haltbarkeit_monate" > 0)
);
--> statement-breakpoint
CREATE TABLE "haushalt_einstellung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"standard_ernaehrungsform" text DEFAULT 'alles' NOT NULL,
	"ampel_gelb_tage" integer DEFAULT 90 NOT NULL,
	"ampel_orange_tage" integer DEFAULT 28 NOT NULL,
	"ki_aktiv" boolean DEFAULT false NOT NULL,
	"noch_gut_zaehlt_mit" boolean DEFAULT false NOT NULL,
	"wochenuebersicht_aktiv" boolean DEFAULT true NOT NULL,
	"wochenuebersicht_wochentag" smallint DEFAULT 6 NOT NULL,
	"wochenuebersicht_uhrzeit" time DEFAULT '10:00' NOT NULL,
	"dringend_aktiv" boolean DEFAULT true NOT NULL,
	"einrichtung_abgeschlossen_am" timestamp with time zone,
	"einrichtung_schritt" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "haushalt_einstellung_haushalt_id_unique" UNIQUE("haushalt_id"),
	CONSTRAINT "haushalt_einstellung_ernaehrungsform_check" CHECK ("haushalt_einstellung"."standard_ernaehrungsform" in ('alles', 'vegetarisch', 'vegan')),
	CONSTRAINT "haushalt_einstellung_ampel_check" CHECK ("haushalt_einstellung"."ampel_orange_tage" > 0 and "haushalt_einstellung"."ampel_orange_tage" <= "haushalt_einstellung"."ampel_gelb_tage"),
	CONSTRAINT "haushalt_einstellung_wochentag_check" CHECK ("haushalt_einstellung"."wochenuebersicht_wochentag" between 1 and 7),
	CONSTRAINT "haushalt_einstellung_einrichtung_schritt_check" CHECK ("haushalt_einstellung"."einrichtung_schritt" >= 0)
);
--> statement-breakpoint
CREATE TABLE "haushalt" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"aktive_quelle_version_id" uuid,
	"rechenmodus" text DEFAULT 'offiziell' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "haushalt_rechenmodus_check" CHECK ("haushalt"."rechenmodus" in ('offiziell', 'individuell'))
);
--> statement-breakpoint
CREATE TABLE "mitglied_allergie" (
	"id" uuid PRIMARY KEY NOT NULL,
	"mitglied_id" uuid NOT NULL,
	"bezeichnung" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mitglied_allergie_eindeutig" UNIQUE("mitglied_id","bezeichnung")
);
--> statement-breakpoint
CREATE TABLE "mitglied" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"name" text NOT NULL,
	"typ" text NOT NULL,
	"geburtsdatum" date,
	"geschlecht" text,
	"aktivitaet" text,
	"gewicht_kg" numeric(5, 1),
	"zustand" text,
	"ernaehrungsform" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mitglied_typ_check" CHECK ("mitglied"."typ" in ('baby', 'kind', 'jugendlich', 'erwachsen', 'senior')),
	CONSTRAINT "mitglied_geschlecht_check" CHECK ("mitglied"."geschlecht" in ('weiblich', 'maennlich', 'divers')),
	CONSTRAINT "mitglied_aktivitaet_check" CHECK ("mitglied"."aktivitaet" in ('wenig', 'normal', 'viel')),
	CONSTRAINT "mitglied_zustand_check" CHECK ("mitglied"."zustand" in ('schwanger', 'stillend')),
	CONSTRAINT "mitglied_ernaehrungsform_check" CHECK ("mitglied"."ernaehrungsform" in ('alles', 'vegetarisch', 'vegan')),
	CONSTRAINT "mitglied_gewicht_check" CHECK ("mitglied"."gewicht_kg" > 0)
);
--> statement-breakpoint
CREATE TABLE "produkt" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"kategorie_id" uuid NOT NULL,
	"lebensmittelart_id" uuid,
	"behaelter_id" uuid,
	"lagerort_id" uuid,
	"bezeichnung" text NOT NULL,
	"inhalt_wert" numeric(9, 2) NOT NULL,
	"inhalt_einheit" text NOT NULL,
	"abtropfgewicht_g" numeric(9, 2),
	"kcal_100" numeric(6, 2),
	"eiweiss_100" numeric(6, 2),
	"kh_100" numeric(6, 2),
	"fett_100" numeric(6, 2),
	"naehrwerte_quelle" text,
	"naehrwerte_bestaetigt_am" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produkt_inhalt_einheit_check" CHECK ("produkt"."inhalt_einheit" in ('g', 'ml')),
	CONSTRAINT "produkt_inhalt_check" CHECK ("produkt"."inhalt_wert" > 0),
	CONSTRAINT "produkt_naehrwerte_quelle_check" CHECK ("produkt"."naehrwerte_quelle" in ('tabelle', 'ki_schaetzung', 'richtwert', 'manuell')),
	CONSTRAINT "produkt_naehrwerte_bestaetigt_check" CHECK ("produkt"."naehrwerte_bestaetigt_am" is null or "produkt"."naehrwerte_quelle" is not null),
	CONSTRAINT "produkt_naehrwerte_vollstaendig_check" CHECK (("produkt"."naehrwerte_quelle" is null) = ("produkt"."kcal_100" is null
        and "produkt"."eiweiss_100" is null and "produkt"."kh_100" is null
        and "produkt"."fett_100" is null))
);
--> statement-breakpoint
CREATE TABLE "einheit" (
	"id" uuid PRIMARY KEY NOT NULL,
	"produkt_id" uuid NOT NULL,
	"mhd" date,
	"mhd_genauigkeit" text,
	"mhd_art" text DEFAULT 'mhd' NOT NULL,
	"mhd_geschaetzt" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'vorrat' NOT NULL,
	"entnommen_am" timestamp with time zone,
	"entnommen_von" uuid,
	"geprueft_am" date,
	"erfassung_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "einheit_id_produkt_eindeutig" UNIQUE("id","produkt_id"),
	CONSTRAINT "einheit_status_check" CHECK ("einheit"."status" in ('vorrat', 'verbraucht', 'entsorgt')),
	CONSTRAINT "einheit_mhd_genauigkeit_check" CHECK ("einheit"."mhd_genauigkeit" in ('tag', 'monat', 'jahr')),
	CONSTRAINT "einheit_mhd_genauigkeit_leer_check" CHECK (("einheit"."mhd" is null) = ("einheit"."mhd_genauigkeit" is null)),
	CONSTRAINT "einheit_mhd_art_check" CHECK ("einheit"."mhd_art" in ('mhd', 'verbrauchen_bis')),
	CONSTRAINT "einheit_mhd_geschaetzt_check" CHECK (not "einheit"."mhd_geschaetzt" or "einheit"."mhd" is not null),
	CONSTRAINT "einheit_entnahme_check" CHECK (("einheit"."status" = 'vorrat') = ("einheit"."entnommen_am" is null)),
	CONSTRAINT "einheit_entnommen_von_check" CHECK ("einheit"."status" <> 'vorrat' or "einheit"."entnommen_von" is null)
);
--> statement-breakpoint
CREATE TABLE "ziel" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"tage" integer NOT NULL,
	"zieldatum" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ziel_haushalt_id_unique" UNIQUE("haushalt_id"),
	CONSTRAINT "ziel_tage_check" CHECK ("ziel"."tage" > 0)
);
--> statement-breakpoint
CREATE TABLE "warengruppe" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schluessel" text NOT NULL,
	"name" text NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warengruppe_schluessel_unique" UNIQUE("schluessel")
);
--> statement-breakpoint
CREATE TABLE "quelle_bedarf" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quelle_version_id" uuid NOT NULL,
	"personengruppe" text NOT NULL,
	"kcal_tag" numeric(7, 1) NOT NULL,
	"wasser_ml_tag" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quelle_bedarf_eindeutig" UNIQUE("quelle_version_id","personengruppe"),
	CONSTRAINT "quelle_bedarf_personengruppe_check" CHECK ("quelle_bedarf"."personengruppe" in ('baby', 'kind', 'jugendlich', 'erwachsen', 'senior')),
	CONSTRAINT "quelle_bedarf_werte_check" CHECK ("quelle_bedarf"."kcal_tag" >= 0 and "quelle_bedarf"."wasser_ml_tag" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quelle_wert" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quelle_version_id" uuid NOT NULL,
	"warengruppe_id" uuid NOT NULL,
	"ernaehrungsform" text DEFAULT 'alles' NOT NULL,
	"menge_pro_person_tag" numeric(9, 2) NOT NULL,
	"mass_einheit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quelle_wert_eindeutig" UNIQUE("quelle_version_id","warengruppe_id","ernaehrungsform"),
	CONSTRAINT "quelle_wert_ernaehrungsform_check" CHECK ("quelle_wert"."ernaehrungsform" in ('alles', 'vegetarisch', 'vegan')),
	CONSTRAINT "quelle_wert_mass_einheit_check" CHECK ("quelle_wert"."mass_einheit" in ('g', 'ml')),
	CONSTRAINT "quelle_wert_menge_check" CHECK ("quelle_wert"."menge_pro_person_tag" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quelle_version" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quelle_id" uuid NOT NULL,
	"stand" text NOT NULL,
	"link" text NOT NULL,
	"standard_tage" integer NOT NULL,
	"geprueft" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quelle_version_eindeutig" UNIQUE("quelle_id","stand"),
	CONSTRAINT "quelle_version_standard_tage_check" CHECK ("quelle_version"."standard_tage" > 0)
);
--> statement-breakpoint
CREATE TABLE "quelle" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schluessel" text NOT NULL,
	"name" text NOT NULL,
	"land" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quelle_schluessel_unique" UNIQUE("schluessel")
);
--> statement-breakpoint
CREATE TABLE "benachrichtigung_einstellung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nutzer_id" uuid NOT NULL,
	"art" text NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"zeitplan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "benachrichtigung_einstellung_eindeutig" UNIQUE("nutzer_id","art"),
	CONSTRAINT "benachrichtigung_einstellung_art_check" CHECK ("benachrichtigung_einstellung"."art" in ('wochenuebersicht', 'dringend', 'checkin_mail'))
);
--> statement-breakpoint
CREATE TABLE "push_abo" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nutzer_id" uuid NOT NULL,
	"geraet" text,
	"endpoint" text NOT NULL,
	"schluessel_p256dh" text NOT NULL,
	"schluessel_auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_abo_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "nachkauf_eintrag" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"warengruppe_id" uuid,
	"produkt_id" uuid,
	"bezeichnung" text NOT NULL,
	"menge" numeric(9, 2),
	"mass_einheit" text,
	"quelle" text NOT NULL,
	"erledigt" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nachkauf_eintrag_quelle_check" CHECK ("nachkauf_eintrag"."quelle" in ('nachkauf', 'manuell')),
	CONSTRAINT "nachkauf_eintrag_mass_einheit_check" CHECK ("nachkauf_eintrag"."mass_einheit" in ('g', 'ml', 'stueck')),
	CONSTRAINT "nachkauf_eintrag_menge_check" CHECK (("nachkauf_eintrag"."menge" is null) = ("nachkauf_eintrag"."mass_einheit" is null) and ("nachkauf_eintrag"."menge" is null or "nachkauf_eintrag"."menge" > 0))
);
--> statement-breakpoint
CREATE TABLE "anmelde_sperre" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schluessel" text NOT NULL,
	"fehlversuche" integer DEFAULT 0 NOT NULL,
	"letzter_fehlversuch_am" timestamp with time zone,
	"gesperrt_bis" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anmelde_sperre_schluessel_unique" UNIQUE("schluessel"),
	CONSTRAINT "anmelde_sperre_schluessel_check" CHECK ("anmelde_sperre"."schluessel" ~ '^(name|ip):.+$'),
	CONSTRAINT "anmelde_sperre_fehlversuche_check" CHECK ("anmelde_sperre"."fehlversuche" >= 0)
);
--> statement-breakpoint
ALTER TABLE "konto" ADD CONSTRAINT "konto_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sitzung" ADD CONSTRAINT "sitzung_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutzer" ADD CONSTRAINT "nutzer_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutzer" ADD CONSTRAINT "nutzer_mitglied_id_mitglied_id_fk" FOREIGN KEY ("mitglied_id") REFERENCES "public"."mitglied"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutzer" ADD CONSTRAINT "nutzer_passwort_geaendert_von_nutzer_id_fk" FOREIGN KEY ("passwort_geaendert_von") REFERENCES "public"."nutzer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_verbindung" ADD CONSTRAINT "ki_verbindung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_rollen_zuweisung" ADD CONSTRAINT "ki_rollen_zuweisung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_rollen_zuweisung" ADD CONSTRAINT "ki_rollen_zuweisung_verbindung_fk" FOREIGN KEY ("verbindung_id","haushalt_id") REFERENCES "public"."ki_verbindung"("id","haushalt_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_aufruf" ADD CONSTRAINT "ki_aufruf_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_aufruf" ADD CONSTRAINT "ki_aufruf_foto_id_foto_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."foto"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_aufruf" ADD CONSTRAINT "ki_aufruf_verbindung_id_ki_verbindung_id_fk" FOREIGN KEY ("verbindung_id") REFERENCES "public"."ki_verbindung"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erfassung_entwurf" ADD CONSTRAINT "erfassung_entwurf_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erfassung_entwurf" ADD CONSTRAINT "erfassung_entwurf_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_entwurf_id_erfassung_entwurf_id_fk" FOREIGN KEY ("entwurf_id") REFERENCES "public"."erfassung_entwurf"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_produkt_id_produkt_id_fk" FOREIGN KEY ("produkt_id") REFERENCES "public"."produkt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_einheit_id_einheit_id_fk" FOREIGN KEY ("einheit_id") REFERENCES "public"."einheit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_einheit_produkt_fk" FOREIGN KEY ("einheit_id","produkt_id") REFERENCES "public"."einheit"("id","produkt_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kategorie" ADD CONSTRAINT "kategorie_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kategorie" ADD CONSTRAINT "kategorie_warengruppe_id_warengruppe_id_fk" FOREIGN KEY ("warengruppe_id") REFERENCES "public"."warengruppe"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lagerort" ADD CONSTRAINT "lagerort_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erfassung" ADD CONSTRAINT "erfassung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erfassung" ADD CONSTRAINT "erfassung_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lebensmittelart" ADD CONSTRAINT "lebensmittelart_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lebensmittelart" ADD CONSTRAINT "lebensmittelart_kategorie_id_kategorie_id_fk" FOREIGN KEY ("kategorie_id") REFERENCES "public"."kategorie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "haushalt_einstellung" ADD CONSTRAINT "haushalt_einstellung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "haushalt" ADD CONSTRAINT "haushalt_aktive_quelle_version_id_quelle_version_id_fk" FOREIGN KEY ("aktive_quelle_version_id") REFERENCES "public"."quelle_version"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mitglied_allergie" ADD CONSTRAINT "mitglied_allergie_mitglied_id_mitglied_id_fk" FOREIGN KEY ("mitglied_id") REFERENCES "public"."mitglied"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mitglied" ADD CONSTRAINT "mitglied_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_kategorie_id_kategorie_id_fk" FOREIGN KEY ("kategorie_id") REFERENCES "public"."kategorie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_behaelter_id_behaelter_id_fk" FOREIGN KEY ("behaelter_id") REFERENCES "public"."behaelter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_lagerort_id_lagerort_id_fk" FOREIGN KEY ("lagerort_id") REFERENCES "public"."lagerort"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produkt" ADD CONSTRAINT "produkt_lebensmittelart_kategorie_fk" FOREIGN KEY ("lebensmittelart_id","kategorie_id") REFERENCES "public"."lebensmittelart"("id","kategorie_id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "einheit" ADD CONSTRAINT "einheit_produkt_id_produkt_id_fk" FOREIGN KEY ("produkt_id") REFERENCES "public"."produkt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "einheit" ADD CONSTRAINT "einheit_entnommen_von_nutzer_id_fk" FOREIGN KEY ("entnommen_von") REFERENCES "public"."nutzer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "einheit" ADD CONSTRAINT "einheit_erfassung_id_erfassung_id_fk" FOREIGN KEY ("erfassung_id") REFERENCES "public"."erfassung"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ziel" ADD CONSTRAINT "ziel_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quelle_bedarf" ADD CONSTRAINT "quelle_bedarf_quelle_version_id_quelle_version_id_fk" FOREIGN KEY ("quelle_version_id") REFERENCES "public"."quelle_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quelle_wert" ADD CONSTRAINT "quelle_wert_quelle_version_id_quelle_version_id_fk" FOREIGN KEY ("quelle_version_id") REFERENCES "public"."quelle_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quelle_wert" ADD CONSTRAINT "quelle_wert_warengruppe_id_warengruppe_id_fk" FOREIGN KEY ("warengruppe_id") REFERENCES "public"."warengruppe"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quelle_version" ADD CONSTRAINT "quelle_version_quelle_id_quelle_id_fk" FOREIGN KEY ("quelle_id") REFERENCES "public"."quelle"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benachrichtigung_einstellung" ADD CONSTRAINT "benachrichtigung_einstellung_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_abo" ADD CONSTRAINT "push_abo_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_warengruppe_id_warengruppe_id_fk" FOREIGN KEY ("warengruppe_id") REFERENCES "public"."warengruppe"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_produkt_id_produkt_id_fk" FOREIGN KEY ("produkt_id") REFERENCES "public"."produkt"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "konto_nutzer_id_idx" ON "konto" USING btree ("nutzer_id");--> statement-breakpoint
CREATE INDEX "sitzung_nutzer_id_idx" ON "sitzung" USING btree ("nutzer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nutzer_benutzername_eindeutig" ON "nutzer" USING btree (lower("benutzername"));--> statement-breakpoint
CREATE INDEX "verifizierung_identifier_idx" ON "verifizierung" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "ki_aufruf_haushalt_erstellt_idx" ON "ki_aufruf" USING btree ("haushalt_id","created_at");--> statement-breakpoint
CREATE INDEX "erfassung_entwurf_nutzer_id_idx" ON "erfassung_entwurf" USING btree ("nutzer_id");--> statement-breakpoint
CREATE INDEX "foto_entwurf_id_idx" ON "foto" USING btree ("entwurf_id");--> statement-breakpoint
CREATE INDEX "foto_produkt_id_idx" ON "foto" USING btree ("produkt_id");--> statement-breakpoint
CREATE INDEX "kategorie_haushalt_id_idx" ON "kategorie" USING btree ("haushalt_id");--> statement-breakpoint
CREATE INDEX "erfassung_haushalt_id_idx" ON "erfassung" USING btree ("haushalt_id");--> statement-breakpoint
CREATE INDEX "erfassung_nutzer_erstellt_idx" ON "erfassung" USING btree ("nutzer_id","created_at");--> statement-breakpoint
CREATE INDEX "lebensmittelart_kategorie_id_idx" ON "lebensmittelart" USING btree ("kategorie_id");--> statement-breakpoint
CREATE INDEX "lebensmittelart_haushalt_id_idx" ON "lebensmittelart" USING btree ("haushalt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lebensmittelart_schluessel_system_eindeutig" ON "lebensmittelart" USING btree ("schluessel") WHERE "lebensmittelart"."haushalt_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "lebensmittelart_schluessel_eigen_eindeutig" ON "lebensmittelart" USING btree ("haushalt_id","schluessel") WHERE "lebensmittelart"."haushalt_id" is not null;--> statement-breakpoint
CREATE INDEX "mitglied_haushalt_id_idx" ON "mitglied" USING btree ("haushalt_id");--> statement-breakpoint
CREATE INDEX "produkt_haushalt_id_idx" ON "produkt" USING btree ("haushalt_id");--> statement-breakpoint
CREATE INDEX "produkt_lebensmittelart_id_idx" ON "produkt" USING btree ("lebensmittelart_id");--> statement-breakpoint
CREATE INDEX "produkt_kategorie_id_idx" ON "produkt" USING btree ("kategorie_id");--> statement-breakpoint
CREATE INDEX "produkt_behaelter_id_idx" ON "produkt" USING btree ("behaelter_id");--> statement-breakpoint
CREATE INDEX "produkt_lagerort_id_idx" ON "produkt" USING btree ("lagerort_id");--> statement-breakpoint
CREATE INDEX "einheit_erfassung_id_idx" ON "einheit" USING btree ("erfassung_id");--> statement-breakpoint
CREATE INDEX "einheit_produkt_status_mhd_idx" ON "einheit" USING btree ("produkt_id","status","mhd");--> statement-breakpoint
CREATE INDEX "einheit_mhd_vorrat_idx" ON "einheit" USING btree ("mhd") WHERE "einheit"."status" = 'vorrat';--> statement-breakpoint
CREATE INDEX "push_abo_nutzer_id_idx" ON "push_abo" USING btree ("nutzer_id");--> statement-breakpoint
CREATE INDEX "nachkauf_eintrag_haushalt_id_idx" ON "nachkauf_eintrag" USING btree ("haushalt_id");