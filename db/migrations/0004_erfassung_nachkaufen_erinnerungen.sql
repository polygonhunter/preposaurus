CREATE TABLE "ki_aufruf" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"foto_id" uuid,
	"modell" text NOT NULL,
	"tokens_ein" integer,
	"tokens_aus" integer,
	"kosten_usd" numeric(10, 6),
	"dauer_ms" integer,
	"erfolg" boolean NOT NULL,
	"fehlerart" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"hash" text NOT NULL,
	"groesse_bytes" integer NOT NULL,
	"dateityp" text NOT NULL,
	"status" text DEFAULT 'entwurf' NOT NULL,
	"entwurf_id" uuid,
	"produkt_id" uuid,
	"einheit_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "foto_pfad_unique" UNIQUE("pfad"),
	CONSTRAINT "foto_rolle_check" CHECK ("foto"."rolle" in ('verpackung', 'naehrwerte', 'mhd')),
	CONSTRAINT "foto_status_check" CHECK ("foto"."status" in ('entwurf', 'fest')),
	CONSTRAINT "foto_fest_check" CHECK ("foto"."status" <> 'fest' or "foto"."produkt_id" is not null),
	CONSTRAINT "foto_groesse_check" CHECK ("foto"."groesse_bytes" > 0)
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
ALTER TABLE "ki_aufruf" ADD CONSTRAINT "ki_aufruf_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ki_aufruf" ADD CONSTRAINT "ki_aufruf_foto_id_foto_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."foto"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erfassung_entwurf" ADD CONSTRAINT "erfassung_entwurf_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erfassung_entwurf" ADD CONSTRAINT "erfassung_entwurf_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_entwurf_id_erfassung_entwurf_id_fk" FOREIGN KEY ("entwurf_id") REFERENCES "public"."erfassung_entwurf"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_produkt_id_produkt_id_fk" FOREIGN KEY ("produkt_id") REFERENCES "public"."produkt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_einheit_id_einheit_id_fk" FOREIGN KEY ("einheit_id") REFERENCES "public"."einheit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benachrichtigung_einstellung" ADD CONSTRAINT "benachrichtigung_einstellung_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_abo" ADD CONSTRAINT "push_abo_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_warengruppe_id_warengruppe_id_fk" FOREIGN KEY ("warengruppe_id") REFERENCES "public"."warengruppe"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nachkauf_eintrag" ADD CONSTRAINT "nachkauf_eintrag_produkt_id_produkt_id_fk" FOREIGN KEY ("produkt_id") REFERENCES "public"."produkt"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ki_aufruf_haushalt_erstellt_idx" ON "ki_aufruf" USING btree ("haushalt_id","created_at");--> statement-breakpoint
CREATE INDEX "erfassung_entwurf_nutzer_id_idx" ON "erfassung_entwurf" USING btree ("nutzer_id");--> statement-breakpoint
CREATE INDEX "foto_entwurf_id_idx" ON "foto" USING btree ("entwurf_id");--> statement-breakpoint
CREATE INDEX "foto_produkt_id_idx" ON "foto" USING btree ("produkt_id");--> statement-breakpoint
CREATE INDEX "push_abo_nutzer_id_idx" ON "push_abo" USING btree ("nutzer_id");--> statement-breakpoint
CREATE INDEX "nachkauf_eintrag_haushalt_id_idx" ON "nachkauf_eintrag" USING btree ("haushalt_id");