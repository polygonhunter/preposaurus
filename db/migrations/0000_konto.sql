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
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"rolle" text DEFAULT 'mitglied' NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"haushalt_id" uuid,
	"mitglied_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nutzer_email_unique" UNIQUE("email"),
	CONSTRAINT "nutzer_mitglied_id_unique" UNIQUE("mitglied_id"),
	CONSTRAINT "nutzer_rolle_check" CHECK ("nutzer"."rolle" in ('admin', 'mitglied'))
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
ALTER TABLE "konto" ADD CONSTRAINT "konto_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sitzung" ADD CONSTRAINT "sitzung_nutzer_id_nutzer_id_fk" FOREIGN KEY ("nutzer_id") REFERENCES "public"."nutzer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "konto_nutzer_id_idx" ON "konto" USING btree ("nutzer_id");--> statement-breakpoint
CREATE INDEX "sitzung_nutzer_id_idx" ON "sitzung" USING btree ("nutzer_id");--> statement-breakpoint
CREATE INDEX "verifizierung_identifier_idx" ON "verifizierung" USING btree ("identifier");