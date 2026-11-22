# Datenmodell & Architektur: Offline-first, Haushalt-Sync, Backend-Wahl

> **Kurzfazit:** Für Preposaurus ist Offline-first Pflicht, nicht Kür: Eine Vorrats-App muss im Keller ohne Netz und erst recht im Krisenfall ohne Server funktionieren. Die pragmatischste Kombination für ein MVP mit Haushalts-Sharing ist **Postgres/Supabase in einer EU-Region (Frankfurt)**, plus eine lokale SQLite-Datenbank am Gerät, synchronisiert über eine Sync-Engine wie **PowerSync** (EU-Region verfügbar). Firebase/Firestore bringt Offline-Cache "ab Werk" mit und ist am schnellsten startklar, bindet aber stärker an Google und löst Konflikte nur per Last-Write-Wins. Wer maximale Datenhoheit und minimale Kosten will, kann **PocketBase selbst bei einem EU-Hoster** betreiben, muss Offline-Sync dann aber selbst bauen und ein Pre-1.0-Produkt in Kauf nehmen. Das Datenmodell sollte Bestandsänderungen als **Ereignisse (Zu-/Abgänge)** speichern statt als überschriebene Mengen. Das entschärft Sync-Konflikte im Mehrnutzer-Haushalt deutlich.

---

## Ergebnisse

### 1. Anforderungen aus der Idee (abgeleitet aus `00_IDEE.md`)

| Anforderung | Konsequenz für die Architektur |
|---|---|
| Vorrat wird im Keller/der Speisekammer erfasst, oft schlechter Empfang | Lesen **und Schreiben** müssen offline gehen, mit Upload-Queue |
| Krisenfall (Strom-/Netzausfall) ist der eigentliche Use Case | App muss komplett ohne Server nutzbar sein, inklusive Bedarfsrechnung und Empfehlungen (lokal gebündelt) |
| Mehrere Haushaltsmitglieder, mehrere Geräte | Mandant = Haushalt; Rechte pro Haushalt; Echtzeit-Sync wünschenswert, aber nicht kritisch |
| Fotos (Produkt, MHD) | Datei-Storage, Thumbnails, Upload erst bei Netz |
| Offizielle Empfehlungen, auswählbar, mit Quelle/Datum | Versionierter, read-only Katalog, der mit der App ausgeliefert und per Update erneuert wird |
| DSGVO, Zielgruppe DACH | EU-Region, AVV/DPA, Kontolöschung in der App, Datensparsamkeit |
| "Später erweiterbar" (Non-Food, Notfallplan, Rezepte) | Generisches Artikel-/Kategorie-Modell statt Lebensmittel-Speziallogik |

### 2. Backend-Optionen im Vergleich (Stand Abruf 2026-10-06)

| Option | Typ | Offline-Fähigkeit | Echtzeit | EU-Hosting | Free-Tier (Auszug) | Einstieg bezahlt | Bemerkungen |
|---|---|---|---|---|---|---|---|
| **Supabase** | Managed Postgres + Auth + Storage + Realtime (Open Source, selbst hostbar) | Kein eingebauter Offline-Store im Client dokumentiert [5]; Offline über Zusatz (PowerSync, Electric) | Broadcast, Presence, Postgres Changes [5] | Frankfurt, Irland, London, Paris, Stockholm, Zürich [2] | 500 MB DB, 50.000 MAU, 1 GB Storage, 5 GB Egress, 200 Realtime-Verbindungen, **Pause nach 1 Woche Inaktivität**, 2 Projekte [1] | Pro ab 25 USD/Monat (100.000 MAU, 8 GB Disk, 100 GB Storage) [1] | DPA mit SCCs (EU/UK/CH) verfügbar [4]; Row Level Security für Haushalts-Rechte [3] |
| **Firebase (Firestore)** | Managed NoSQL (Google) | Offline-Persistenz auf Android/iOS standardmäßig an, im Web per Opt-in; 100 MB Default-Cache; Konflikte per Last-Write-Wins [7] | Ja (Listener) | u. a. europe-west3 Frankfurt, europe-west10 Berlin, Multi-Region eur3; **Standort später nicht änderbar** [8] | 1 GiB, 50.000 Reads/Tag, 20.000 Writes/Tag, 50.000 Auth-MAU [6] | Blaze pay-as-you-go; neue Storage-Buckets nur noch mit Blaze [6] | Schnellster Start, starker Lock-in (proprietäres Datenmodell) |
| **PowerSync** | Sync-Engine: Backend-DB (Postgres, MongoDB, MySQL, SQL Server) ↔ SQLite im Client | Kernfunktion: lokale SQLite, Upload-Queue für Writes [10] | Ja (Streaming) | Cloud-Regionen u. a. **EU** [11] | 2 GB Sync/Monat, 500 MB, 50 gleichzeitige Clients, Deaktivierung nach 1 Woche Inaktivität [9] | Pro ab 49 USD/Monat [9] | SDKs für Flutter, React Native/Expo, Web, Kotlin, Swift u. a. [10]; "Open Edition" selbst hostbar (source-available) [9]; offizielle Supabase-Integration [11] |
| **ElectricSQL (Electric)** | Read-Path-Sync aus Postgres über HTTP ("Shapes") | Lesen lokal; **Writes laufen über eigene API** [12] | Ja | k. A. auf den geprüften Seiten | PAYG: 1 USD pro 1 Mio. Writes, 0,10 USD pro GB-Monat, Rechnungen < 5 USD erlassen [13] | Pro 249 USD/Monat [13] | Kombinierbar mit PGlite/TanStack DB [12]; mehr Eigenbau beim Schreibpfad |
| **Convex** | Managed reaktive DB (TypeScript-Funktionen) | Nicht als Offline-first-Produkt geprüft (unklar) | Ja (reaktiv) | Irland (aws-eu-west-1) mit **30 % Aufpreis**; Region nicht nachträglich wechselbar [15] | 1 Mio. Function Calls, 0,5 GB DB, 1 GB Files [14] | Professional 25 USD pro Entwickler/Monat [14] | PowerSync listet Convex inzwischen als Quelle [10] |
| **Appwrite Cloud** | Managed BaaS (Open Source, selbst hostbar) | Kein Offline-Sync verifiziert | Ja (Realtime) | **Frankfurt (FRA)** verfügbar, Amsterdam/London "coming soon" [17] | Free: max. 2 Projekte, Limits pro Ressource; konkrete Zahlen auf Pricing-Seite nicht abrufbar [16][18] | Nicht verifiziert (Pricing-Seite lieferte keine Planpreise) [16] | Daten bleiben laut Anbieter in der Region [17] |
| **PocketBase** | Single-Binary-Backend (Go + SQLite), selbst gehostet | Kein eingebauter Offline-Sync; Realtime-Subscriptions vorhanden [19] | Ja | Überall, wo man es betreibt (z. B. Hetzner DE/FI, DSGVO-konform, ISO 27001, BSI C5 laut Anbieter [22]) | Software kostenlos; nur Server-Kosten | – | Version **v0.40.4**, also **Pre-1.0** [19]; Backups = `pb_data` kopieren [20]; Auth inkl. OAuth2 [19] |
| **Triplit** | Sync-DB (Client-Cache + Server), CRDT-basiert | Offline-Modus, IndexedDB/SQLite [21] | Ja | Selbst hostbar | – | – | Lizenz AGPL-3.0 [21]. **Projektstatus/Wartung unklar**: Es gibt Hinweise, dass das Team 2025 zu Supabase gewechselt ist; das konnte ich nicht verifizieren |
| **Automerge** | CRDT-Bibliothek + `automerge-repo` mit Sync-Server | Ja, Kernfunktion; konfliktfreies Mergen, volle Historie [23] | Ja | Selbst hostbar | Open Source | – | Stark bei Dokumenten (Text, gemeinsames Bearbeiten), für relationale Abfragen ("alle Chargen mit MHD < 30 Tage") eher umständlich (eigene Einschätzung) |
| **InstantDB** | Managed Sync-DB | – | – | – | – | – | **Warnbeispiel:** Team zu OpenAI gewechselt, keine neuen Anmeldungen, Cloud-Abschaltung am 31.08.2027 [24]. Zeigt das Anbieterrisiko bei jungen Sync-Startups |

**Hinweis:** Preise und Limits ändern sich häufig. Alle Werte stammen von den Anbieterseiten (Abruf 2026-10-06) und sind vor einer Entscheidung neu zu prüfen.

### 3. Sync-Strategien: welche passt zu einem Vorrat?

| Strategie | Prinzip | Pro | Contra | Eignung Preposaurus |
|---|---|---|---|---|
| **Online-only + Cache** (Supabase pur) | Server ist Wahrheit, Client cached | Einfach, kein Sync-Code | Schreiben offline schwierig; Krisenfall-Nutzen fraglich | Nur für reinen Web-Prototyp |
| **Dokument-Cache mit LWW** (Firestore) | Lokaler Cache, beim Reconnect gewinnt der letzte Schreiber [7] | Sofort nutzbar, wenig Code | Zwei Personen buchen gleichzeitig Dosen aus: eine Änderung geht verloren, falls Menge überschrieben wird | Gut, **wenn** Bestand als Ereignisse modelliert wird (s. u.) |
| **SQLite-Replikation + Upload-Queue** (PowerSync, Electric) | Server-DB → Teilmenge pro Nutzer ins lokale SQLite; lokale Writes werden in eine Queue gelegt und über Backend/API hochgeladen [10][12] | Volle SQL-Abfragen offline (MHD-Filter, Bedarfsrechnung); Server-Validierung bleibt | Zusätzlicher Dienst, mehr Komponenten | **Empfohlen für MVP mit Sharing** |
| **CRDT/local-first** (Automerge, Triplit) | Jede Kopie ist gleichberechtigt, Merges konfliktfrei [21][23] | Beste Offline-Robustheit, P2P möglich | Abfragen/Rechte/Server-Validierung komplexer; Ökosystem kleiner, Wartung teils unklar | Spannend für später (z. B. P2P-Sync im Haushalt ohne Internet), nicht für MVP |

### 4. Auth & Konten

| Aspekt | Befund |
|---|---|
| Methoden Supabase | E-Mail/Passwort, Magic Link, OTP, Telefon, viele Social Logins inkl. Apple und Google, SSO, MFA [25] |
| Anonymer Start | Supabase unterstützt `signInAnonymously()` und spätere Verknüpfung mit E-Mail/OAuth zu einem dauerhaften Konto [26]. Passt zu "erst ausprobieren, später Haushalt teilen" |
| App Store 4.8 | Wer Google/Facebook-Login anbietet, muss eine gleichwertige datensparsame Alternative anbieten (in der Praxis meist "Sign in with Apple") [27] |
| App Store 5.1.1(v) | Kontolöschung muss **in der App** möglich sein [27]. Auch DSGVO-relevant (Art. 17) |
| Firebase Auth | 50.000 MAU im Spark-Plan kostenlos [6] |
| PocketBase | E-Mail/Passwort + OAuth2 (Google, Facebook, GitHub, GitLab u. a.) [19] |

### 5. DSGVO-Standort

| Option | EU-Region | Vertragsseite | Anmerkung |
|---|---|---|---|
| Supabase Cloud | Ja (Frankfurt u. a.) [2] | DPA mit SCCs für EU/UK/CH [4] | US-Unternehmen auf AWS. Unter dem CLOUD Act bleibt ein Restrisiko (rechtliche Bewertung gehört in Report Recht/Datenschutz) |
| Firebase | Ja (Frankfurt, Berlin, eur3) [8] | Google-Standardverträge (nicht im Detail geprüft) | Standortwahl endgültig [8] |
| PowerSync Cloud | EU-Region [11] | Nicht geprüft | Synchronisierte Daten liegen zusätzlich beim Sync-Dienst. Muss als Auftragsverarbeiter mit in den AVV |
| Convex | Irland, +30 % [15] | Nicht geprüft | |
| Appwrite Cloud | Frankfurt [17] | Nicht geprüft | |
| Self-hosted (PocketBase, Supabase, PowerSync Open Edition) auf EU-Hoster | Volle Kontrolle, z. B. Hetzner DE/FI [22] | AVV mit Hoster | Betriebsaufwand (Updates, Backups, Monitoring) liegt beim Team |

**Datensparsamkeit:** Die Vorratsdaten selbst sind wenig sensibel. Sensibel werden sie über **Haushaltsmitglieder** (Alter, Schwangerschaft, Allergien, Medikamente; Gesundheitsdaten können unter Art. 9 DSGVO fallen) und über **Fotos** (Metadaten, Personen im Bild). Empfehlung: Mitglieder nur als Profil-Kategorie ohne Klarnamen erfassen (Altersgruppe statt Geburtsdatum). Medikamente und Diäten nur optional und gern nur lokal speichern. Diese Einordnung ist meine Einschätzung und keine Rechtsberatung.

### 6. Vorschlag: grobes Datenmodell

Grundprinzipien:
- **Client-generierte IDs (UUID)**: Datensätze entstehen offline, also keine Server-Sequenzen.
- **`household_id` auf jeder Haushaltstabelle**: Darüber laufen Rechte (RLS [3]) und Sync-Partitionierung (Sync Streams [11]).
- **`created_at`, `updated_at`, `deleted_at` (Soft Delete)**: Löschungen müssen sich ebenfalls synchronisieren.
- **Bestand = Summe von Bewegungen**: Zu- und Abgänge werden als Ereignis gespeichert, nicht als überschriebene Menge. Gleichzeitige Ausbuchungen auf zwei Handys addieren sich dann korrekt, auch bei Last-Write-Wins-Sync.
- **Empfehlungskatalog getrennt und versioniert**: global, read-only, mit Quelle, Version und Abrufdatum; wird mit der App gebündelt, damit er offline verfügbar ist.

```
GLOBAL (read-only, versioniert, mit App ausgeliefert + Update)
├── source            Quelle: BBK, BMEL, ZSV-AT, BWL/BABS-CH, EU, FEMA …
│     id, code, name, publisher, country, url, license_note, retrieved_at
├── recommendation_set  konkrete Fassung einer Quelle
│     id, source_id, version, valid_from, days_basis (z. B. 10), notes
├── recommendation_line Mengenvorgabe je Kategorie
│     id, set_id, category_id, amount, unit (kg|l|stk|kcal),
│     per (person_day|person|household), person_type (adult|child|senior|…),
│     note, source_page_ref
├── category          Wasser, Getreide, Gemüse, Hygiene, Medizin, Energie …
│     id, parent_id, kind (food|nonfood), icon_key, color, default_shelf_life_days
└── product           Produktstammdaten (Open Food Facts-Cache, eigene)
      id, barcode (EAN), name, brand, category_id, net_qty, unit,
      kcal_per_100, image_url, off_id, source (off|user|ai)

HAUSHALT (synchronisiert, partitioniert nach household_id)
├── household         id, name, country, created_by
├── membership        id, household_id, user_id, role (owner|editor|viewer), joined_at
├── invitation        id, household_id, code/token, expires_at, role
├── member_profile    Person im Haushalt (nicht zwingend ein App-Nutzer)
│     id, household_id, label ("Kind 1"), person_type, age_group,
│     kcal_override, flags (vegetarisch, glutenfrei, …), [optional/lokal: Medikamente]
├── goal              id, household_id, recommendation_set_id, target_days,
│                     target_date, status, created_at
├── location          Lagerort: Keller, Speisekammer, Garage …
│     id, household_id, name, icon_key, parent_id
├── item              "Was" im Haushalt (z. B. "Ravioli Dose 800 g")
│     id, household_id, product_id?, category_id, name, unit, unit_size,
│     kcal_per_unit, photo_id, min_stock, notes
├── batch (Charge)    "Welche Packung, welches MHD, wo"
│     id, household_id, item_id, location_id, best_before (MHD),
│     use_by (Verbrauchsdatum, optional), opened_at, mhd_source (ocr|manual|estimated),
│     photo_id, purchased_at, price?
├── stock_movement    Ereignislog: Bestand = Σ Bewegungen je Charge
│     id, household_id, batch_id, delta_qty, reason (purchase|consume|
│     discard|expired|correction|move), device_id, user_id, occurred_at
├── photo             id, household_id, storage_path, kind (product|mhd|shelf),
│                     width, height, uploaded (bool), exif_stripped (bool)
├── reminder          id, household_id, batch_id?, type (expiry|restock|check),
│                     due_at, done_at
└── shopping_item     id, household_id, category_id/item_id, qty, from_gap_calc, done
```

Abgeleitet (Views/lokal berechnet, nicht gespeichert):
- **Bestand je Charge** = Σ `stock_movement.delta_qty`
- **Versorgungstage je Kategorie** = Bestand ÷ (Σ Bedarf der `member_profile` laut `recommendation_line`)
- **Gesamtfortschritt** gegenüber `goal.target_days`, Lücke wird zur Einkaufsliste

Kurzes API-Beispiel (Supabase-RLS-Muster, nur zur Veranschaulichung):

```sql
create policy "Haushaltsmitglieder lesen Chargen" on batch for select
using ( household_id in (select private.my_household_ids()) );
-- my_household_ids(): SECURITY DEFINER, liest membership für (select auth.uid())
```

(Muster laut Supabase-Doku: Security-Definer-Funktion gegen rekursive Policies, `auth.uid()` in `select` wrappen, Filterspalten indexieren [3].)

---

## Bedeutung für Preposaurus

1. **Stufenweise vorgehen statt sofort voller Sync:**
   - **PoC:** rein lokal (SQLite bzw. IndexedDB), kein Backend, Empfehlungskatalog als JSON gebündelt. So testen wir die Kernfrage "Foto → Produkt + MHD → Versorgungstage" ohne Infrastruktur.
   - **MVP mit Haushalt teilen:** Supabase (Region Frankfurt) als Wahrheit und für Auth/Storage, PowerSync (EU) für lokale SQLite und Upload-Queue. Beide sind offiziell integriert [11], beide haben Free-Tiers [1][9]. Achtung: Beide pausieren Free-Projekte nach einer Woche Inaktivität [1][9]. Für echte Nutzer ist also früh ein Bezahlplan nötig (ca. 25 USD + 49 USD pro Monat).
   - **Low-Budget/Datenhoheit-Alternative:** PocketBase auf einem EU-Server. Offline-Queue und Konfliktlogik müssten wir selbst bauen. Durch das Bewegungs-Ereignismodell ist das machbar, aber Aufwand.
   - **Schnellster Weg (falls Flutter/native):** Firebase mit Frankfurt-Region. Offline ist bei Mobile standardmäßig an [7]. Mit Bewegungs-Ereignissen ist LWW unproblematisch. Nachteil: Lock-in, Regionswahl endgültig [8].
2. **Bewegungs-Log statt Mengenfeld** ist die wichtigste Modellentscheidung. Sie macht Sync robust, liefert eine Historie ("wer hat die letzten Wasserflaschen genommen?") und Statistik (Verbrauch, Verschwendung durch Ablauf).
3. **Item vs. Charge trennen:** "10 Dosen Ravioli" sind meist mehrere Chargen mit unterschiedlichem MHD. Nur so funktionieren Rotation ("zuerst verbrauchen") und MHD-Ampeln sauber.
4. **Empfehlungen als versionierte Daten** (Quelle → Set → Zeilen) machen die Quellenwahl, Länderwechsel und spätere Updates der Behörden-Checklisten trivial und transparent ("berechnet nach BBK, Stand …").
5. **Anonymer Start, späteres Konto:** App ohne Registrierung nutzbar (lokal); erst beim Teilen des Haushalts Konto anlegen (Supabase Anonymous → Linking [26]). Kontolöschung in der App von Anfang an einplanen [27].
6. **Einladung per Code/QR** (Tabelle `invitation`) statt E-Mail-Pflicht ist datensparsam und passt zur Familie am Küchentisch.
7. **Fotos:** lokal sofort speichern, Upload lazy, EXIF/GPS entfernen, Thumbnails erzeugen. Storage-Kosten im Blick behalten (Supabase Free 1 GB [1]).
8. **Krisenmodus:** Alles Rechenrelevante (Katalog, Bedarfsformeln, Bestand) muss lokal liegen. Optional später P2P-Sync im WLAN/Bluetooth ohne Internet (CRDT-Ansatz, z. B. Automerge [23]). Das wäre ein echtes Alleinstellungsmerkmal.
9. **Anbieterrisiko bewerten:** InstantDB zeigt, dass junge Sync-Anbieter verschwinden können [24]. Bevorzugt Komponenten mit Open-Source-/Self-Host-Ausweg (Supabase, PowerSync Open Edition, PocketBase).

## Offene Fragen

1. **Plattform-Entscheidung** (PWA vs. Flutter vs. React Native/Expo) steuert die Sync-Wahl mit. Abhängigkeit zum Plattform-Report.
2. Reicht für den MVP "ein Gerät pro Haushalt" plus Export, oder ist Sharing MVP-Pflicht?
3. Ist der CLOUD-Act-Restrisiko-Aspekt (US-Anbieter mit EU-Region) für die Zielgruppe ein Verkaufsargument, das Self-Hosting bei einem EU-Hoster rechtfertigt?
4. Wie werden Gesundheitsangaben (Schwangerschaft, Medikamente, Allergien) rechtlich eingeordnet (Art. 9 DSGVO)? Nur lokal speichern?
5. Appwrite-Preise/Limits und Hetzner-Serverpreise konnten nicht verifiziert werden (Seiten lieferten keine Zahlen).
6. Triplit: Wartungsstatus nach dem mutmaßlichen Teamwechsel 2025 ungeklärt.
7. Konvertiert PowerSync nur Postgres → SQLite, oder wollen wir zusätzlich Echtzeit-Presence ("Papa scannt gerade im Keller")? Das wäre über Supabase Realtime möglich [5].
8. Wie häufig aktualisieren die Behörden ihre Empfehlungen, und wie liefern wir Katalog-Updates aus (App-Update vs. Remote-JSON mit Signatur)?

## Quellen

Alle abgerufen am 2026-10-06.

1. Supabase – Pricing. https://supabase.com/pricing
2. Supabase Docs – Available regions. https://supabase.com/docs/guides/platform/regions
3. Supabase Docs – Row Level Security. https://supabase.com/docs/guides/database/postgres/row-level-security
4. Supabase – Data Processing Addendum. https://supabase.com/legal/dpa
5. Supabase Docs – Realtime. https://supabase.com/docs/guides/realtime
6. Firebase – Pricing. https://firebase.google.com/pricing
7. Firebase Docs – Access data offline (Firestore). https://firebase.google.com/docs/firestore/manage-data/enable-offline
8. Firebase Docs – Firestore locations. https://firebase.google.com/docs/firestore/locations
9. PowerSync – Pricing. https://www.powersync.com/pricing
10. PowerSync Docs – Overview. https://docs.powersync.com/intro/powersync-overview
11. PowerSync Docs – Supabase + PowerSync. https://docs.powersync.com/integration-guides/supabase-+-powersync
12. Electric Docs – Intro (vorher electric-sql.com, Weiterleitung). https://electric.ax/docs/intro
13. Electric – Pricing. https://electric.ax/pricing
14. Convex – Pricing. https://www.convex.dev/pricing
15. Convex Docs – Regions. https://docs.convex.dev/production/regions
16. Appwrite – Pricing. https://appwrite.io/pricing
17. Appwrite Docs – Regions. https://appwrite.io/docs/products/network/regions
18. Appwrite Docs – Free plan. https://appwrite.io/docs/advanced/platform/free
19. PocketBase – Startseite (Version v0.40.4). https://pocketbase.io/
20. PocketBase Docs – Going to production. https://pocketbase.io/docs/going-to-production/
21. Triplit – GitHub-Repository (README). https://github.com/aspen-cloud/triplit
22. Hetzner – Cloud. https://www.hetzner.com/cloud/
23. Automerge – Startseite. https://automerge.org/
24. InstantDB – Pricing-Seite (Ankündigung Wechsel zu OpenAI/Abschaltung). https://www.instantdb.com/pricing
25. Supabase Docs – Auth. https://supabase.com/docs/guides/auth
26. Supabase Docs – Anonymous Sign-Ins. https://supabase.com/docs/guides/auth/auth-anonymous
27. Apple – App Review Guidelines (4.8, 5.1.1(v)). https://developer.apple.com/app-store/review/guidelines/
