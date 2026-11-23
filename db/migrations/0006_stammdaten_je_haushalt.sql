CREATE TABLE "lebensmittelart_suchwort" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lebensmittelart_id" uuid NOT NULL,
	"wort" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lebensmittelart_suchwort_eindeutig" UNIQUE("lebensmittelart_id","wort")
);
--> statement-breakpoint
CREATE TABLE "kategorie_ausblendung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"kategorie_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kategorie_ausblendung_eindeutig" UNIQUE("haushalt_id","kategorie_id")
);
--> statement-breakpoint
CREATE TABLE "lebensmittelart_ausblendung" (
	"id" uuid PRIMARY KEY NOT NULL,
	"haushalt_id" uuid NOT NULL,
	"lebensmittelart_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lebensmittelart_ausblendung_eindeutig" UNIQUE("haushalt_id","lebensmittelart_id")
);
--> statement-breakpoint
ALTER TABLE "lebensmittelart_suchwort" ADD CONSTRAINT "lebensmittelart_suchwort_lebensmittelart_id_lebensmittelart_id_fk" FOREIGN KEY ("lebensmittelart_id") REFERENCES "public"."lebensmittelart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kategorie_ausblendung" ADD CONSTRAINT "kategorie_ausblendung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kategorie_ausblendung" ADD CONSTRAINT "kategorie_ausblendung_kategorie_id_kategorie_id_fk" FOREIGN KEY ("kategorie_id") REFERENCES "public"."kategorie"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lebensmittelart_ausblendung" ADD CONSTRAINT "lebensmittelart_ausblendung_haushalt_id_haushalt_id_fk" FOREIGN KEY ("haushalt_id") REFERENCES "public"."haushalt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lebensmittelart_ausblendung" ADD CONSTRAINT "lebensmittelart_ausblendung_lebensmittelart_id_lebensmittelart_id_fk" FOREIGN KEY ("lebensmittelart_id") REFERENCES "public"."lebensmittelart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kategorie_ausblendung_kategorie_id_idx" ON "kategorie_ausblendung" USING btree ("kategorie_id");--> statement-breakpoint
CREATE INDEX "lebensmittelart_ausblendung_lebensmittelart_id_idx" ON "lebensmittelart_ausblendung" USING btree ("lebensmittelart_id");