# Preposaurus – Abgleich der Konzept-Stränge

> Stand 2026-11-22 · Orchestrator · Entwurf.
> Abgeglichen: `05_STATUS_ENTSCHEIDUNGEN.md` (verbindlich), `UX_KONZEPT.md`, `DATENKATALOG.md`, `EINSTELLUNGEN_NUTZER.md`, `ONBOARDING.md`, `SCHNITTSTELLEN.md`, `design-richtungen.html` (nur gezeigte Inhalte), Issues #108, #110, #114–#128, PR #112 (Stand `c9cbd78`, Review „mergebereit“).
> Leitsatz: kein UI ohne Daten, keine Daten ohne Zweck, keine widersprüchlichen Festlegungen.
> „Frage N“ verweist auf `ENTSCHEIDUNGEN_RUNDE1.md`. „E-n“ verweist dort auf den Abschnitt „Von uns entschieden“.

**Inhalt:** 1 Widersprüche · 2 Abdeckungsmatrix · 3 SCHNITTSTELLEN-Einträge · 4 Schema-Liste · 5 Folgeänderungen

---

## 1. Widersprüche

Auflösung: **05** = folgt aus einer Maintainer-Entscheidung · **selbst** = Technik- oder Folgefrage, vom Orchestrator entschieden · **Frage N** = Maintainer.

### 1.1 Die großen fünf

| Nr. | Thema | Was steht wo | Auflösung |
|---|---|---|---|
| W1 | **MHD-Schätzung** | 05 „Ohne MHD“: „Datum fehlt“, KI-Schätzung wählbar, nie automatisch. 05 M2-Festlegung: geschätzt = heute + übliche Haltbarkeit der **Kategorie**. #110: Richtwerte **nie** als MHD. #116, #121, #124: Funktion `estimateBestBeforeOnRequest` entfernen, nur die KI schätzt, Genauigkeit Monat oder Jahr. UX F4: gar keine Schätzung, `mhd_geschaetzt` entfällt. DATENKATALOG F3: Schätzung = heute + Haltbarkeit der **Lebensmittelart**, ohne KI, Genauigkeit Tag. #108: fünf KI-Rollen, keine davon schätzt ein MHD | **05:** „Datum fehlt“ ist der Normalfall, `einheit.mhd` wird nullable, `mhd_geschaetzt` bleibt. Die UX-Empfehlung zu F4 ist überholt. **Frage 6:** Wie geschätzt wird (gar nicht im MVP, Richtwert, KI). **selbst:** Genauigkeit einer Schätzung ist „Monat“, nie „Tag“ (E-10). Beide Schätzwege haben heute keine Grundlage, weil die Haltbarkeits-Richtwerte bis zur Prüfung (U3, #19) leer sind |
| W2 | **Foto-Erkennung in der Ersteinrichtung** | ONBOARDING §2.2: Schritt 4 nur, wenn ein Schlüssel in der `.env` steht. EINSTELLUNGEN §2 und SCHNITTSTELLEN Nr. 7, 9: KI gehört nicht in die Einrichtung. #108: Der Schlüssel wird in der App eingetragen, `.env` ist nur noch der Sonderfall. ONBOARDING §6.1, §6.2 und `technik.html` nennen den Schlüssel weiter nur in der `.env` | Die Bedingung „Schlüssel in `.env`“ trifft den Normalfall nicht mehr. **Frage 21:** kein Schritt (Empfehlung), Schritt nur bei `.env`-Schlüssel oder Schritt mit Schlüsselfeld. **selbst:** Die Prüfung „KI eingerichtet“ (Systemstatus, „Erste Schritte“) fragt Verbindungen aus DB **und** `.env` ab |
| W3 | **Nährwert-Bestätigung** | 05: Schätzung „gesondert zu bestätigen“. #115, #120, #124: Spalte `naehrwerte_bestaetigt_am`, unbestätigte Schätzungen können also gespeichert sein, „ca.“ gilt für **unbestätigte**. #121: Richtwert gilt „bis zur Bestätigung als unbestätigt“. DATENKATALOG F2: Bestätigen ist Teil des Speicherns, die Spalte entfällt, Richtwert wird live gelesen. UX §8.5: „Überspringen“ ohne jede Bestätigung. Reihenfolge: #124 „KI schätzt, sonst Richtwert“, DATENKATALOG „Richtwert, KI nur ohne Richtwert“. Werte von `naehrwerte_quelle`: #120 nennt `richtwert`, DATENKATALOG nicht | **Frage 7:** bestätigen beim Speichern oder nachträglich. **Frage 8:** Richtwert zuerst oder KI zuerst. **selbst:** „ca.“ hängt an der Herkunft, nicht an der Bestätigung: Eine bestätigte Schätzung bleibt eine Schätzung (E-5). Richtwerte werden live gelesen, nicht ins Produkt kopiert, `naehrwerte_quelle` kennt deshalb kein `richtwert` (E-5). UX: „Überspringen“ heißt künftig „Keine Nährwerttabelle“. Auch der manuelle Weg braucht die Bestätigung, wenn die Felder leer bleiben |
| W4 | **E-Mail-Reste** | 05 „Anmeldung“: nur Benutzername und Passwort. Dagegen: 05 Zeile „Erinnerungen“ (Check-in-Mails), 05 Tech-Stack (Nodemailer), UX §8.6 Anmelden (E-Mail), UX-Sitemap („Mein Konto“ mit Benachrichtigungen, Darstellung), `features.html` ERS-02, ERS-03, ERI-06, EIN-02, `UMSETZUNG.md` M3-01, M3-02, M3-11, M9-01, M11-03, M11-05, M11-06, `technik.html` (SMTP, „Push aus, dann Mail“), ONBOARDING §6.1, §6.2 (SMTP-Zeilen), SCHNITTSTELLEN Nr. 18 (SMTP im Systemstatus) gegen Nr. 28 (kein SMTP). #120: `nutzer.email` nullable, EINSTELLUNGEN §4.5: Better Auth verlangt die Spalte | **selbst:** `nutzer.email` bleibt NOT NULL mit technischer Adresse `<id>@nutzer.invalid`, nie angezeigt, nie exportiert. #120 wird korrigiert (E-1). **Frage 4:** keine Mail im MVP. Dann entfallen Check-in-Mail, Ausweich-Mail, SMTP-Konfiguration, Nodemailer, M11-03 und die SMTP-Zeile im Systemstatus. Alle genannten Fundstellen stehen in §5 |
| W5 | **Zielmengen je Ernährungsform** | PR #112: fertige Zeilen je Form (`quelle_wert.ernaehrungsform`). Fachlogik auf `main` und 05 M2-Festlegung: Verschiebungsregeln zur Laufzeit (`diet-shifts.ts`, `targetsForDiet`). DATENKATALOG F8: Zeilen | **selbst** (E-3): Die DB-Zeilen sind die eine Wahrheit, die Fachlogik wählt nur aus. `diet-shifts` wird zum Werkzeug, das die Seed-Zeilen erzeugt und prüft (mengengleich, Anteile = 1). Die Zahlen sind in beiden Formen dieselben. Welche Ersatzregeln fachlich gelten, bleibt Aufgabe U3 (#19) |

### 1.2 Weitere Widersprüche

| Nr. | Thema | Was steht wo | Auflösung |
|---|---|---|---|
| W6 | „Noch gut“ am Zieldatum | #117: zählt am Zieldatum nie. Fachlogik `isCountedOn`: zählt mit Schalter „an“ auch am Zieldatum. UX F10: 30 Tage ab Prüfung. DATENKATALOG F5: ohne Ablauf | **05:** Fehler in der Fachlogik, in #121 beheben (E-7). **Frage 17:** Dauer |
| W7 | Kernzahl | 05 M2: eine Nachkommastelle, abgerundet. UX F1 und alle drei Design-Richtungen: ganze Tage im Satz, Nachkommastelle an den Balken | **Frage 13** |
| W8 | Makros im MVP | `features.html` UEB-07 „später“. 05 „Ordnung (Update)“: Makros werden über alle Ebenen summiert | **05:** Summen (A6, A8) sind MVP, „Eiweiß reicht X Tage“ (A7) bleibt später. UX F2 erledigt. Makro-Richtwerte an der Lebensmittelart kommen dazu (#126, #128 nennen sie schon) |
| W9 | kcal-Richtwert rechnet | #110: Richtwerte „nur als Hinweis“. 05 „Nährwerte (Update)“: Richtwert der Lebensmittelart, markiert mit „ca.“ | **05:** darf rechnen. UX F3 erledigt. #110 gilt nur noch für die Haltbarkeit |
| W10 | Lebensmittelart am Produkt | PR #112: Kategorie Pflicht, Art optional, zusammengesetzter FK. UX §1 und 05 „Baum“: Art ist Pflicht | **selbst** (E-2): Art Pflicht, `produkt.kategorie_id` entfällt. Ohne Treffer führt „+ Neue Lebensmittelart“ weiter. Wer das darf: **Frage 11** |
| W11 | Persönliche Einstellungen | UX §5 und `technik.html`: `nutzer_einstellung` für Vorbelegungen. PR #112: `benachrichtigung_einstellung` je Nutzer. `UMSETZUNG.md` M11-05, M11-06: „je Nutzer“. 05 „Anmeldung“: keine privaten Daten. EINSTELLUNGEN §1.5: beide Tabellen entfallen | **selbst** (E-4): keine `nutzer_einstellung`, Vorbelegung aus der letzten Erfassung (`erfassung`). **Frage 5:** Erinnerungen je Haushalt |
| W12 | Angaben zu Personen | `features.html` HH-02: Geburtsjahr Pflicht. EINSTELLUNGEN §1.1: Felder bleiben im Schema, Allergien im MVP. ONBOARDING F2: Geburtsjahr darf leer sein. DATENKATALOG F4: Felder gar nicht anlegen. PR #112 legt sie an, die Demo-Daten füllen sie | **Frage 3** (Datenschutz) |
| W13 | Aufbau der Einstellungen | 05 und UX-Sitemap: „Mein Konto · Haushalt · Nutzerverwaltung · Daten & System“. EINSTELLUNGEN: „Konto und Gerät“. Foto-Erkennung: #108 unter „Daten & System“, EINSTELLUNGEN und UX-Sitemap unter „Haushalt“. Mitglied: #108 „sieht die Seite nicht“, EINSTELLUNGEN §5 „liest an/aus“ | **Frage 19.** **selbst** (E-18): Mitglied sieht nur „an“ oder „aus“, nie Verbindungen oder Schlüssel |
| W14 | Hell und Dunkel | 05: hell Standard, dunkel optional. EINSTELLUNGEN: im MVP nicht umschaltbar. Design-Richtungen: jede Richtung mit heller und dunkler Palette | **Frage 20** |
| W15 | „Dringend“ | UX §8.2: Zustand „dringend“ gilt bis zur Orange-Schwelle (28 Tage). DATENKATALOG F10: Push „Dringend“ nur für 7 Tage. UX F13: „Diese Woche“ fest 7 Tage. Orange unter 7 Tagen einstellbar, dann überlappen die Gruppen | **Frage 14.** **selbst** (E-21): Orange-Schwelle mindestens 7 Tage. Das Wort „Dringend“ für zwei Grenzen prüft der Usability-Strang |
| W16 | VAPID-Schlüssel | EINSTELLUNGEN §1.4: „Die App startet nicht ohne sie“. ONBOARDING §6.1: optional, ohne sie keine Push-Frage | **selbst** (E-12): optional. Hart sind nur `DATABASE_URL` und `APP_SECRET` |
| W17 | Selbst weitergehen | UX F8: ja, mit Schalter in den Einstellungen. EINSTELLUNGEN §1.2: Schalter „später“. Kein Feld im DATENKATALOG | **Frage 9** |
| W18 | Einrichtungs-Actions | ONBOARDING §2.2: fünf Personentypen, Schalter „Ich zähle selbst mit“, bis zu 5 Schritte. DATENKATALOG §8.2: `setupHouseholdAction` kennt nur Erwachsene, Kinder, Babys. `einrichtung_schritt` CHECK 1–4. `UMSETZUNG.md` M3-09: drei Schritte | **selbst** (E-24): Action nimmt alle Typen aus `MEMBER_TYPES` und `zaehltSelbstMit`. `einrichtung_schritt` ohne enge Obergrenze. Zahl der Schritte hängt an Frage 21 |
| W19 | Passwort beim Anlegen | #123: App erzeugt es. EINSTELLUNGEN §3.1: erzeugt, Admin darf überschreiben. 05: Admin „vergibt“ | Kein echter Widerspruch. EINSTELLUNGEN gilt, #123 ergänzen. Regeln: **Frage 18** |
| W20 | Reihenfolge Schema | DATENKATALOG §4: Punkte direkt in PR #112. #120 und #116: erst nach dem Merge. #108: `ki_verbindung` „wird in PR #112 umgesetzt“, der Branch enthält noch `ki_einstellung` | **selbst** (E-19): Liste A aus §4 geht in #112, solange die PR offen ist, sonst in #120. Liste B folgt als eigene Migration nach den Antworten |
| W21 | Status-Filter im Vorrat | 05 „Rotation“: sechs Filter inklusive Nachkaufen, Verbraucht, Entsorgt. UX D7 und Design: Zustand-Chips nur für den Bestand, neu „Unvollständig“, Verlauf als Unterseite | Teil von **Frage 2** (UX-Konzept freigeben) |
| W22 | Nächster Schritt | UX §3 A4: Fehlmenge bis zum Ziel. UX §8.1 und Design: „20 l bringen euch auf 9 Tage“, daneben Nachkaufen „24 l fehlen“ | **selbst** (E-20): eine Zahl, die Fehlmenge bis zum Ziel, an beiden Stellen |
| W23 | Verweis | ONBOARDING §6.2 nennt für den Systemstatus „SCHNITTSTELLEN Nr. 14“, gemeint ist Nr. 18 | Folgeänderung §5 |

---

## 2. Abdeckungsmatrix

Lesart: Jede Zeile ist ein UI-Element. **Lücke** nennt, was fehlt: `D` Datenfeld oder Auswertung, `A` Action oder Abfrage, `E` Einstellung, `U` UI-Beschreibung. „–“ heißt: vollständig. Actions und Abfragen aus DATENKATALOG §8.2.

### 2.1 Übersicht und Bald fällig

| UI-Element | Datenfeld bzw. Auswertung | Action / Abfrage | Einstellung | Lücke |
|---|---|---|---|---|
| Satz „reicht für X Tage“, zwei Balken, „begrenzt“ | A1, A2 · `einheit`, `produkt`, `mitglied.typ`, `quelle_bedarf` | `getOverview` | Mitglieder, „Noch gut zählt mit“ | Rundung: Frage 13 |
| Zielmarke, Zielzeile „Am 01.03. …“ | A3 · `ziel.tage`, `ziel.zieldatum` | `getOverview` | Ziel und Quelle | – |
| Nächster Schritt | A4 | `getOverview` | – | Zahl wie Nachkaufen (E-20) |
| „ca.“ an der Kernzahl | A18 · `naehrwerte_quelle`, Richtwert der Art | `getOverview` | – | Schwelle 10 % als Konstante. Hängt an Frage 7, 8 |
| Erklär-Blatt (Rechnung, Bedarf je Person, Quelle, Stand, Link, Datenqualität) | A1, A18 · `quelle_version.stand`, `link`, `geprueft` | `getOverview` | – | `U`: Zeile „Quelle noch nicht geprüft“ fehlt im UX-Konzept, das Feld `geprueft` gibt es |
| Startphase (kein „0 Tage“) | abgeleitet aus A1, A10 | `getOverview` | – | Frage 22. `U`: nicht im UX-Konzept, nicht in den Design-Richtungen |
| Karte „Erste Schritte“ | abgeleitet (Bestand, `ziel.zieldatum`, Namen, Zahl der Nutzer, `ki_aktiv`, `push_abo`) | Abfrage fehlt (`A`) | „wieder einblenden“ (Browser) | `A`: Abfrage benennen. `E`: Eintrag fehlt in EINSTELLUNGEN |
| Kachel Bald fällig (Zähler, drei Einträge) | A11, A12 | `getOverview` | Ampel-Schwellen | – |
| Kachel Nachkaufen | A13 | `getOverview` | – | – |
| Abdeckung je Warengruppe | A9 · `quelle_wert` | `getOverview` | Ernährungsform | `D`: Design zeigt „Sonstiges · ohne Zielmenge“. Regel fehlt: Warengruppe ohne `quelle_wert` hat keinen Balken |
| Kachel Nährwerte, Unterseite | A5, A6, A8 | `getOverview` | – | Makro-Richtwerte an der Art (§4 A10), bis dahin „ohne N Produkte“ |
| Haushaltszeile, Begrüßung „Hallo Alex“, Initialen | `mitglied.name`, `nutzer.name`, `ziel` | `getOverview` | Haushalt | – |
| Design: „2 Flaschen“, „6 Kisten“ je Warengruppe | – | – | – | `D`: kein Feld. Auf Ebene Warengruppe gibt es nur „Packungen“. Auftrag an #127 |
| Design PC: Zähler in der Seitenleiste („Bald fällig 18“, „Nachkaufen 4“) | A11, A13 | `getOverview` | – | UX P12 verbietet nur rote Zähler am Dock. Usability-Strang klärt |
| Bald fällig: Kopfzähler, vier Gruppen, Gruppe „bis zum Ziel“ | A11, A12, A3 · `mhd`, `mhd_art`, `geprueft_am` | `getDueUnits(gruppe, sortierung)` | Schwellen Gelb, Orange | Frage 14. Fachlogik `timeGroupFor` fehlt (#121) |
| Zeile mit Datum, Anzahl, Lagerort, Kategorie | `einheit`, `produkt.lagerort_id`, Baum | `getDueUnits` | Lagerorte | – |
| Verbraucht, Entsorgt, „Alle 4“, Rückgängig | `einheit.status`, `entnommen_am`, `entnommen_von` | `takeOutUnitsAction`, `undoTakeOutAction` | – | – |
| Noch gut | `einheit.geprueft_am` | `markStillGoodAction`, `undoStillGoodAction` | „Noch gut zählt mit“ | Frage 17 |
| Datum ändern, nachtragen | `mhd`, `mhd_genauigkeit`, `mhd_geschaetzt` | `setUnitsDateAction` | – | – |
| „Nachkaufen“ in der Rückgängig-Zeile | `nachkauf_eintrag` | `addRestockItemAction` | – | – |
| „Datum fehlt“ | `einheit.mhd` leer | Filter „Unvollständig“ | – | `U`: Zustand in keiner Design-Richtung gezeigt (#127) |
| Push „Dringend“, Wochenübersicht | A3, A11, A13 · `push_abo`, `*_gesendet_am` | Worker | Wochenübersicht, Dringend, Push je Gerät | Fragen 5, 14. Ohne Push gibt es keinen zweiten Kanal: Frage 4 |

### 2.2 Vorrat, Detail, Verlauf

| UI-Element | Datenfeld bzw. Auswertung | Action / Abfrage | Einstellung | Lücke |
|---|---|---|---|---|
| Ebene 1 Warengruppen mit Balken | A8, A9 | `getGroupLevel` | – | – |
| Ebene 2: Kategorien als Überschrift, Sprungchips, Zeile je Art | A8 · `kategorie`, `lebensmittelart` | `getFoodTypeLevel` | Stammdaten | `produkt.lebensmittelart_id` muss Pflicht sein (§4 A9) |
| „−1“ | FIFO, „Datum fehlt“ zuletzt | `takeOutUnitsAction` (FIFO) | – | – |
| Suche, Trefferliste, Zustand-Chips, Filter-Blatt | `behaelter`, `lagerort`, Zustand, A18 | `searchStock(filter)` | – | – |
| Detail: Kennwerte, Packungen nach Datum, Produkte | A8 · `einheit`, `produkt` | `getFoodTypeDetail` | – | Frage 10 (wann zwei Produkte) |
| Nährwerte mit Herkunft | `naehrwerte_quelle`, Richtwert der Art | `updateNutritionAction` | – | Fünf Herkünfte (SCHNITTSTELLEN Nr. 20). Frage 7 kann „unbestätigt“ ergänzen |
| Produktangaben, Fotos | `inhalt_*`, `abtropfgewicht_g`, `behaelter_id`, `lagerort_id`, `foto` | `updateProductAction`, `POST /api/photos` | – | Frage 16 |
| Hinweis „üblich etwa 2 Jahre haltbar“ | `lebensmittelart.uebliche_haltbarkeit_monate` | `getFoodTypeDetail` | Stammdaten | Werte leer bis U3 |
| „Packungen hinzufügen“ | `erfassung`, `einheit.erfassung_id` | Link ins Erfassen, `createStockAction` | – | Frage 12 |
| Löschen (Admin) | Produkt, Einheiten, Fotos | `deleteProductAction` | – | – |
| Verlauf | `einheit.status`, `entnommen_*`, `created_at`, `erfassung.nutzer_id` | `getHistory` | – | – |
| Filter „Unvollständig“ | A18 | `searchStock` | – | Umfang hängt an Frage 7 |

### 2.3 Erfassen

| UI-Element | Datenfeld bzw. Auswertung | Action / Abfrage | Einstellung | Lücke |
|---|---|---|---|---|
| Einstieg mit zuletzt genutztem Weg | `erfassung.weg` | Abfrage fehlt (`A`) | – | `A`: letzte Erfassung des Nutzers in die Startdaten aufnehmen |
| Entwurf fortsetzen oder verwerfen | `erfassung_entwurf` | `saveDraftAction`, `discardDraftAction` | – | – |
| Datenschutzhinweis vor dem ersten Foto | `nutzer.ki_hinweis_bestaetigt_am` | `confirmAiNoticeAction` | KI an/aus | Frage 21 (Einschalten zählt als Bestätigung) |
| Schritt Verpackung, Karte mit Pfad | KI-Schema A, Baum | `POST /api/photos`, `/api/recognize` | KI-Rolle `verpackung` | – |
| „Zu Spaghetti 500 g hinzufügen?“ | `produkt` | `matchProductsAction` | – | Frage 10 |
| „+ Neue Lebensmittelart“, neuer Lagerort | `lebensmittelart`, `lagerort` | `createFoodTypeAction`, `createStorageLocationAction` | Stammdaten | Frage 11 |
| Schritt Nährwerte, „Keine Nährwerttabelle“ | KI-Schema B, B′, Richtwert | `/api/recognize`, `estimateNutritionAction` | Rollen `naehrwerte`, `naehrwerte_schaetzen` | Fragen 7, 8. `U`: UX §8.5 kennt nur „Überspringen“ |
| Schritt Datum: Chip mit Anzahl, „nicht lesbar“, „Datum fehlt“, „schätzen“ | KI-Schema C, `einheit.mhd*` | `/api/recognize`, `estimateBestBeforeAction` | Rollen `mhd`, `mhd_zweitversuch` | Frage 6. `U`: UX §8.5 nennt „Datum fehlt“ und „schätzen“ nicht |
| Selbst weitergehen | `sicherheit` aus der KI | – | Schalter „Jeden Schritt bestätigen“ | Frage 9. `D`, `E`: Feld fehlt, falls der Schalter kommt |
| Prüfen und Speichern, Meldung „reicht jetzt 11,3 statt 9,4“ | `erfassung.id` (Idempotenz), A1 vorher und nachher | `createStockAction` | – | – |
| Manueller Weg | dieselben Felder | `createStockAction` | – | `U`: Bestätigung für „ca.“-Werte fehlt (W3) |
| Hinweise H1–H14 | Zähler abgeleitet (`foto.nutzer_id`, `einheit.entnommen_von`), „gesehen“ im Browser | – | „Hinweise wieder anzeigen“ (Browser) | `E`: Eintrag fehlt in EINSTELLUNGEN (SCHNITTSTELLEN Nr. 17) |
| Push-Frage nach dem ersten MHD | `push_abo` | `POST /api/push/subscribe` | Push je Gerät | – |

### 2.4 Nachkaufen, Statistik

| UI-Element | Datenfeld bzw. Auswertung | Action / Abfrage | Einstellung | Lücke |
|---|---|---|---|---|
| „Fehlt bis zum Ziel“ mit Beispielen | A13, Arten des Haushalts je Warengruppe | `getRestockList` | Ziel | – |
| „Ersetzen“ | A14 | `getRestockList` | – | Fachlogik `replacementCandidates` fehlt (neues M2-Issue) |
| Eigene Einträge | `nachkauf_eintrag` | `addRestockItemAction` | – | – |
| Abhaken, Ausblenden, „Erledigt“ | `status`, `erledigt_am`, `quelle = ziel` | `setRestockStatusAction` | – | Schema §4 B4. Fristen E-15 |
| „Gekauft und erfassen“ | `lebensmittelart_id` | Link `?art=` | – | – |
| Statistik: Abdeckung, verbraucht und entsorgt je Monat | A9, A15 | `getStatistics` | – | – |
| Verlauf „Tage versorgt“ | A16 | – | – | später |

### 2.5 Einstellungen, Nutzer, Anmeldung

| UI-Element | Datenfeld bzw. Auswertung | Action / Abfrage | Lücke |
|---|---|---|---|
| Konto und Gerät: Anzeigename, Passwort ändern, „zuletzt geändert am … von …“ | `nutzer.name`, `passwort_geaendert_am`, `_von` | `updateOwnProfileAction`, `changeOwnPasswordAction` | – |
| Push auf diesem Gerät | `push_abo` | `/api/push/subscribe` | `D`: `push_abo.geraet` hat keine Anzeige (§4 A18) |
| Abmelden, überall abmelden | `sitzung` | `signOutAction` | – |
| Haushalt: Name, Standard-Ernährungsform | `haushalt.name`, `standard_ernaehrungsform` | `saveHouseholdAction` | – |
| Mitglieder: Name, Typ, Ernährungsform | `mitglied` | `saveMemberAction`, `removeMemberAction` | Frage 3. `D`: Altersgrenzen der Typen („Kinder bis 12“) haben keine Quelle, sie müssen aus der geprüften Quelle kommen (U3) |
| Allergien (EINSTELLUNGEN §1.1: MVP) | `mitglied_allergie` | keine Action | `A` fehlt, Verwendung fehlt. Frage 3 |
| Ziel und Quelle mit Stand und Link | `ziel`, `quelle_version` | `saveGoalAction` | `aktive_quelle_version_id` (§4 A12) |
| Lagerorte, Lebensmittelarten, Kategorien | Stammdaten, `ausgeblendet` | `create…`, `update…` | Frage 11 |
| Ampel, „Noch gut zählt mit“ | `ampel_*_tage`, `noch_gut_zaehlt_mit` | `saveRotationSettingsAction` | Orange ≥ 7 (E-21) |
| Erinnerungen des Haushalts | `wochenuebersicht_*`, `dringend_aktiv` | `saveReminderSettingsAction` | Frage 5 |
| Foto-Erkennung: an/aus, Verbindungen, Schlüssel maskiert, Test, Rolle und Modell, „Empfohlen“ | `ki_aktiv`, `ki_verbindung`, `ki_rollen_zuweisung`, `ki_aufruf` | `setAiEnabledAction`, `createAiConnectionAction`, `replaceAiKeyAction`, `testAiConnectionAction`, `assignAiRoleAction`, `resetAiRolesAction` | `U`, `E`: EINSTELLUNGEN §1.3 und §6.2 beschreiben noch einen Schlüssel in `ki_einstellung`. Frage 19 (Ort) |
| Nutzerverwaltung: Liste, anlegen, Rolle, zurücksetzen, deaktivieren, Sitzungen beenden, verknüpfen | `nutzer.*`, `anmelde_sperre` | `createUserAction`, `resetPasswordAction`, `setUserRoleAction`, `setUserActiveAction`, `revokeUserSessionsAction`, `linkMemberAction` | – |
| Seite „Passwort nur jetzt“, Liste „Was die Person braucht“ mit App-Adresse | Antwort der Action, `APP_URL` | wie oben | `E`: Liste fehlt in EINSTELLUNGEN §3.1 |
| Daten und System: Export | alles außer Geheimnissen | `GET /api/export` | – |
| Version, Lizenz, Quellen | Build-Konstanten, `quelle_version` | – | – |
| Systemstatus (Adresse verschlüsselt, Datenbank, Foto-Erkennung, Push) | Umgebung, DB | Abfrage fehlt (`A`) | `A`: `getSystemStatus` benennen. `E`: fehlt in EINSTELLUNGEN §1.4. Ohne SMTP-Zeile (Frage 4) |
| Anmelden, „Zu viele Versuche“ | `benutzername`, `anmelde_sperre` | `signInAction` | `U`: UX §8.6 nennt E-Mail |
| Kommandozeile `admin.mjs` | dieselben Use-Cases | – | kein Paket in `UMSETZUNG.md` |

### 2.6 Ersteinrichtung und erster Login

| UI-Element | Datenfeld bzw. Auswertung | Action / Abfrage | Lücke |
|---|---|---|---|
| O-01 Vorab-Prüfung | wie Systemstatus | Abfrage fehlt (`A`) | Frage 24 |
| O-02 Konto | `nutzer`, `haushalt`, `haushalt_einstellung`, `ziel` in einer Transaktion | `setupAdminAction` | – |
| O-03 Haushalt: Zähler für fünf Typen, „Ich zähle selbst mit“, Ernährungsform | `mitglied`, `nutzer.mitglied_id`, `standard_ernaehrungsform` | `setupHouseholdAction` | `A`: Eingabe erweitern (W18). Fall „niemand mit Bedarf“ im Onboarding beschreiben. Frage 23 |
| O-04 Ziel, Quelle mit Stand | `ziel`, `quelle_version` | `saveGoalAction` | – |
| O-05 Foto-Erkennung | `ki_aktiv`, Verbindung | `setAiEnabledAction` | Frage 21 |
| O-06 Home-Bildschirm, O-07 Fertig | Gerät, `einrichtung_abgeschlossen_am` | `completeSetupAction` | Illustrationen (#127) |
| Fortsetzen nach Abbruch | `einrichtung_schritt` | jede Einrichtungs-Action | Wertebereich (W18) |
| O-09 Willkommen Mitglied | `letzte_anmeldung_am`, `passwort_vorlaeufig`, `mitglied_id`, `haushalt.name`, `ziel` | `changeOwnPasswordAction` | – |
| O-12 „Datenbank nicht erreichbar“ | `/api/health` | – | – |
| Meilensteine | abgeleitet, „gezeigt“ im Browser | – | Frage 22 |

### 2.7 Daten ohne Zweck (Gegenrichtung)

| Feld bzw. Tabelle | Befund | Auflösung |
|---|---|---|
| `mitglied.geburtsdatum`, `geschlecht`, `aktivitaet`, `gewicht_kg`, `zustand`, `haushalt.rechenmodus`, `mitglied_allergie` | keine Anzeige, Auswertung oder Regel im MVP | Frage 3 |
| `mitglied.piktogramm` | kein Screen zeigt es, Design nutzt Initialen | entfernen (§4 A18) |
| `kategorie.kcal_durchschnitt_100`, `uebliche_haltbarkeit_monate` | ersetzt durch Richtwerte der Lebensmittelart | entfernen (§4 A17) |
| `foto.hash`, `foto.groesse_bytes` | keine Regel, keine Anzeige | entfernen (§4 A18) |
| `push_abo.geraet` | keine Anzeige, Sitzungsliste ist „später“ | entfernen oder unter „Konto und Gerät“ anzeigen (§4 A18) |
| `benachrichtigung_einstellung`, `NOTIFICATION_KINDS` | ohne Erinnerungen je Nutzer ohne Zweck | Frage 5 |
| `produkt.naehrwerte_bestaetigt_am` | nur nötig, wenn unbestätigt gespeichert werden darf | Frage 7 |
| `produkt.kategorie_id` | doppelt, sobald die Art Pflicht ist | entfernen (§4 A9) |
| `ki_verbindung` (mehrere), Rolle `naehrwerte_schaetzen` | Zweck vorhanden (#108), aber im Einstellungs-Konzept nicht beschrieben | Folgeänderung §5 |
| `ki_aufruf.tokens_*`, `kosten_usd`, `sicherheit` | Anzeige erst später (EIN-09), Messung im PoC | behalten, Zweck benannt |
| `quelle_version.geprueft` | Regel vorhanden, Anzeige fehlt | Zeile im Erklär-Blatt (§5) |
| `konto.access_token` u. a., `verifizierung`, `nutzer.email_verified`, `image` | von Better Auth vorgegeben | behalten, bleiben leer |
| Fachlogik `removeUser`, `STILL_GOOD_COUNTS_AS_SUPPLIED`, `targetsForDiet` zur Laufzeit | ohne Aufrufer | entfernen bzw. ins Seed-Werkzeug (#121) |

---

## 3. SCHNITTSTELLEN-Einträge

Alle Einträge mit Status `offen` sind in `SCHNITTSTELLEN.md` gesetzt, nur Status- und Antwortspalte. Einträge mit Status `Maintainer` haben die Fragenummer bekommen.

| Nr. | Neuer Status | Begründung in Kurzform |
|---|---|---|
| 10 | Maintainer | Gruppen und Ort der Foto-Erkennung: Frage 19. Neue Seiten gehen als Auftrag an #127 |
| 15 | Maintainer | Startphase: Frage 22. Übrige Bausteine als Auftrag an #127 |
| 16 | übernommen | Auftrag an #127, Lizenz AGPL-kompatibel |
| 17 | übernommen | Datenquellen vorhanden (Browser-Speicher, `APP_URL`). Nachtrag in EINSTELLUNGEN nötig |
| 19 | übernommen | folgt aus 05 „Ohne MHD“. Keine Design-Richtung zeigt den Zustand, Auftrag an #127 |
| 20 | übernommen | fünf Herkünfte. Vorbehalt: Frage 7 kann „unbestätigt“ ergänzen |
| 21 | übernommen | Design-Richtungen zeigen keines der Felder. Befund „Flaschen“, „Kisten“ |
| 22 | übernommen | Makro-Richtwerte kommen (§4 A10), bis dahin Teilsumme mit Hinweis |
| 23 | übernommen | Fristen vorläufig als Konstanten (E-15). Schema hängt an Frage 2 |
| 24 | übernommen | verbindlich durch #108. EINSTELLUNGEN §1.3, §6.2 nachziehen |
| 26 | Maintainer | `lagerort.ausgeblendet` übernommen. Anlegen durch Mitglieder: Frage 11 |
| 27 | Maintainer | Fragen 5 und 14 |
| 28 | Maintainer | Frage 4 |
| 29 | übernommen | Onboarding muss den Fall „niemand mit Bedarf“ beschreiben |
| 30 | übernommen | mit Korrektur an `setupHouseholdAction` (E-24) |
| 3, 7, 9, 12, 18, 25 | bleiben Maintainer | Fragen 5 · 21, 23 · 21 · 3 · 24 · 3 |

---

## 4. Zusammengeführte Schema-Liste

Quellen: DATENKATALOG §4 (19 Punkte), EINSTELLUNGEN §6, ONBOARDING §8, Review zu PR #112, Issue #120.
Weg: Liste A in PR #112, solange sie offen ist, sonst in #120 (E-19). Liste B als eigene Migration nach den Antworten. Nach dem ersten Merge gilt: nur neue Migrationen.

### A · Sofort sicher (folgt aus Entscheidungen oder ist reine Technik)

| Nr. | Tabelle | Änderung | Grund |
|---|---|---|---|
| A1 | `einheit` | `mhd` nullable. `mhd_genauigkeit` nullable ohne Standard. CHECK `(mhd is null) = (mhd_genauigkeit is null)`. CHECK `not mhd_geschaetzt or mhd is not null`. `mhd_geschaetzt` bleibt | 05 „Ohne MHD“, #116 |
| A2 | `ki_einstellung` | ersetzen durch `ki_verbindung` (mit `schluessel_hinweis`, `letzter_test_*`) und `ki_rollen_zuweisung` (fünf Rollen, `aktiv`). Seed mit Empfehlung, Konstante `AI_ROLES` | #108 letzter Kommentar, #114, Review N4 |
| A3 | `haushalt_einstellung` | + `noch_gut_zaehlt_mit` boolean, Standard false | 05 „Noch gut“, #117 |
| A4 | `haushalt_einstellung` | + `einrichtung_abgeschlossen_am`, `einrichtung_schritt` (smallint, CHECK ≥ 0, keine enge Obergrenze) | Fortsetzen nach Abbruch, SCHNITTSTELLEN Nr. 2, 11 |
| A5 | `produkt` | `naehrwerte_geschaetzt` → `naehrwerte_quelle` (`etikett`, `manuell`, `ki_schaetzung`, leer). CHECK: leer genau dann, wenn alle vier Werte leer sind | 05 „Nährwerte“, #115, E-5 |
| A6 | `nutzer` | + `benutzername` (NOT NULL, UNIQUE, klein), `passwort_vorlaeufig`, `passwort_geaendert_am`, `passwort_geaendert_von`, `letzte_anmeldung_am`, `ki_hinweis_bestaetigt_am`. `email` bleibt NOT NULL (technische Adresse). Spaltenname gegen das Username-Plugin prüfen | 05 „Anmeldung“, E-1 |
| A7 | `anmelde_sperre` | neue Tabelle, ohne FK auf `nutzer` | EINSTELLUNGEN §4.3 |
| A8 | `erfassung`, `einheit`, `produkt` | neue Tabelle `erfassung(id, haushalt_id, nutzer_id, weg)`. `einheit.erfassung_id` NOT NULL. `produkt.erfassung_id` entfällt | Idempotenz für Nachschub (freigegebener Speicherablauf), Vorbelegung ohne `nutzer_einstellung` |
| A9 | `produkt` | `lebensmittelart_id` NOT NULL. `kategorie_id` und zusammengesetzter FK entfallen. `bezeichnung` nullable. Index auf `lebensmittelart_id` | 05 „Baum“, E-2, Review N2 |
| A10 | `lebensmittelart` | + `eiweiss_100`, `kh_100`, `fett_100`. `schluessel` für alle Arten, UNIQUE `(haushalt_id, schluessel)` NULLS NOT DISTINCT, Herkunft-CHECK anpassen | 05 „Baum“ (Makros je Ebene), #110, Review M3 |
| A11 | `ki_aufruf` | + `rolle`, `versuch`, `verbindung_id` (SET NULL), `sicherheit` | #114 |
| A12 | `haushalt` | `aktive_quelle_id` → `aktive_quelle_version_id` | Stand und Link der genutzten Fassung (CLAUDE.md: Werte versioniert) |
| A13 | `lagerort` | + `ausgeblendet` | EIN-04, freigegeben |
| A14 | `quelle_bedarf` | `personengruppe` mit CHECK auf `MEMBER_TYPES`. `wasser_l_tag` → `wasser_ml_tag` (int) | eindeutige Zuordnung, Fachlogik rechnet in ml |
| A15 | `foto` | + `nutzer_id` (SET NULL) | Onboarding-Hinweise, SCHNITTSTELLEN Nr. 14 |
| A16 | `einheit` | Teilindex `(mhd) WHERE status = 'vorrat'`. CHECK: `entnommen_von` nur bei Status ≠ `vorrat` | Review N1, N7 |
| A17 | `kategorie` | `kcal_durchschnitt_100`, `uebliche_haltbarkeit_monate` entfernen. Name eigener Kategorien eindeutig je Haushalt | Richtwerte an der Art, Review N7 |
| A18 | `foto`, `mitglied`, `push_abo` | `foto.hash`, `foto.groesse_bytes`, `mitglied.piktogramm` entfernen. `push_abo.geraet` entfernen, falls der Usability-Strang keine Anzeige vorsieht | kein Feld ohne Zweck |
| A19 | Konstanten | `QUANTITY_UNITS` (g, ml) am Produkt, `piece` nur in `RESTOCK_UNITS` | Typen gleichziehen |
| A20 | Seeds | `set`-Listen um Richtwerte ergänzen (Review N5). Demo: Benutzernamen, eine Packung „Datum fehlt“, ein Produkt ohne Nährwerte | #120 „Fertig, wenn“ |

### B · Hängt an einer Frage

| Nr. | Tabelle | Änderung | Hängt an |
|---|---|---|---|
| B1 | `haushalt_einstellung`, `benachrichtigung_einstellung` | + `wochenuebersicht_aktiv`, `_wochentag`, `_uhrzeit`, `dringend_aktiv`, `wochenuebersicht_gesendet_am`, `dringend_gesendet_am`. Tabelle `benachrichtigung_einstellung` und `NOTIFICATION_KINDS` entfernen | Frage 5. Bei „je Nutzer“ bleibt die Tabelle, die Merker wandern an den Nutzer |
| B2 | `mitglied`, `haushalt`, `mitglied_allergie` | `geburtsdatum`, `geschlecht`, `aktivitaet`, `gewicht_kg`, `zustand`, `rechenmodus` und `mitglied_allergie` entfernen, Demo-Daten anpassen | Frage 3 |
| B3 | `produkt` | + `naehrwerte_bestaetigt_am` | Frage 7, nur bei „nachträglich“ |
| B4 | `nachkauf_eintrag` | `produkt_id` → `lebensmittelart_id`. `erledigt` → `status` (offen, erledigt, ausgeblendet). + `erledigt_am`. `bezeichnung` nullable mit CHECK. `quelle` + `ziel` | Frage 2 (UX-Konzept §5, §8.6) |
| B5 | `ki_rollen_zuweisung` | sechste Rolle `mhd_schaetzen` im CHECK und im Seed | Frage 6, nur bei „KI schätzt“ |
| B6 | `haushalt_einstellung` | + `jeden_schritt_bestaetigen` | Frage 9, nur bei „mit Schalter“ |
| B7 | Seed Lebensmittelarten | Schlüssel ohne Behälter (`kichererbsen` statt `kichererbsen_dose`), Tee und Kaffee umhängen, Tiefe der Liste. Muss vor dem ersten Release feststehen, danach sind Schlüssel fest | #128, Frage 10 |
| B8 | Seed `quelle_wert`, `quelle_bedarf`, Richtwerte | Werte je Ernährungsform, Bedarf je Personentyp mit Altersgrenzen, kcal, Makros, Haltbarkeit | U3, #19 (kein Schema, nur Daten) |
| B9 | `nutzer` | später: freiwilliges Feld „E-Mail für Erinnerungen“ | Frage 4, nur bei „Mail schon im MVP“ |

Kein Schema nötig für: Frage 14 (Konstante), Frage 17 (Konstante), Fragen 21–24 (Ablauf).

---

## 5. Folgeänderungen an Dokumenten und Issues

Liste für den Issue-Orchestrator. **sofort** = folgt schon aus 05 oder aus E-Punkten. **nach Frage N** = erst nach der Antwort.

### 5.1 Dokumente

| Nr. | Stelle | Änderung | Wann |
|---|---|---|---|
| F1 | `05_STATUS_ENTSCHEIDUNGEN.md` | M2-Festlegung „Geschätztes MHD“ an 05 „Ohne MHD“ angleichen. `STILL_GOOD_COUNTS_AS_SUPPLIED` als ersetzt markieren. Antworten der Runde 1 eintragen. E-Punkte als „technische Festlegungen“ nachtragen | sofort, Rest nach Runde 1 |
| F2 | `05_STATUS_ENTSCHEIDUNGEN.md` | Zeile „Erinnerungen“ (Check-in-Mails), Tech-Stack (Nodemailer), Zeile „Einstellungen“ („Mein Konto“), Zeile „Rotation“ (sechs Filter) | nach Fragen 4, 19, 2 |
| F3 | `features.html` | ERS-02 Benutzername · ERS-03 „Nutzer anlegen“ statt Einladungslink · EIN-02 ohne E-Mail · EIN-07, EIN-08 nach #108 · ERF-09 „Datum fehlt“ · ERF-13 Lebensmittelart · UEB-07 teilen (Summen MVP, Makro-Tage später) · ROT-05 Schalter | sofort |
| F4 | `features.html` | UEB-04, UEB-05, UEB-09, VOR-01 bis VOR-03, ERF-05, ERF-07, NK-02 (UX D3–D15) · neu: Seite Bald fällig, Verlauf, Filter „Unvollständig“ | nach Frage 2 |
| F5 | `features.html` | ERI-06 „später“, ERI-07 und EIN-03 entfallen · HH-02 ohne Geburtsjahr, HH-04 „später“ · ERF-17 ins MVP · neu: Startphase, „Erste Schritte“, Hinweise, Systemstatus | nach Fragen 4, 5, 3, 12, 22 |
| F6 | `docs/UMSETZUNG.md` | §2 Grundentscheidungen 7 und 11, §7.3 W8, W9, U11 (überholt durch #108, #114, #117) · M3-01, M3-02 (Benutzername, Bremse) · M3-10 (reaktivieren statt entfernen) · M3-11 und Ordner `einladung/[token]` entfallen (#123) · M9-01 ohne E-Mail · M5-01, M5-03, M6-09, M6-11 („Datum fehlt“) · neue Pakete #120–#126 | sofort |
| F7 | `docs/UMSETZUNG.md` | M3-09 Schritte der Einrichtung · M11-03 (Mail-Port) entfällt, M11-05 und M11-06 je Haushalt und ohne Mail · U2 (Nodemailer-Ausnahme), U9, L16 entfallen · M7 und M4 nach dem UX-Konzept · neues Paket Kommandozeile `admin.mjs`, neues Paket Systemstatus und Vorab-Prüfung | nach Fragen 21, 4, 5, 2 |
| F8 | `technik.html` | Datenmodell: `nutzer_einstellung` und `benachrichtigung_einstellung` raus, `ki_verbindung`, `ki_rollen_zuweisung`, `erfassung`, `anmelde_sperre` rein · KI-Schemata A, B, B′, C aus DATENKATALOG §8.3 · Sicherheit: Schlüssel verschlüsselt in der DB, `APP_SECRET`, Passwort einmal anzeigen · Modellwahl nach #108, #114 · Actions aus DATENKATALOG §8.1 · Ablauf Ersteinrichtung | sofort |
| F9 | `technik.html` | SMTP, „Push aus, dann Mail“, Check-in-Mail, E-Mail-Adressen in der Datenschutz-Tabelle | nach Frage 4 |
| F10 | `UX_KONZEPT.md` | §1 MHD nicht mehr Pflicht · §4 fünf Herkünfte, „MHD fehlt“ nach 05 · §5 `naehrwerte_quelle`, keine `nutzer_einstellung` · §6 Sitemap (Konto, Schritte der Einrichtung) · §8.5 „Keine Nährwerttabelle“ mit Bestätigung, Chip „Datum fehlt“, Bestätigung auch im manuellen Weg · §8.6 Anmelden mit Benutzername · §14 F2, F3, F4, F10 als entschieden markieren · Erklär-Blatt: Zeile „Quelle noch nicht geprüft“ · A4 und Beispiel in §8.1 angleichen (E-20) | sofort |
| F11 | `UX_KONZEPT.md` | §8.1 Startphase und „Erste Schritte“ · Antworten zu F1, F5–F9, F11–F17 | nach Runde 1 |
| F12 | `EINSTELLUNGEN_NUTZER.md` | §1.3 und §6.2: `ki_verbindung`, `ki_rollen_zuweisung`, Rolle `naehrwerte_schaetzen` statt `ki_einstellung` · §1.4: VAPID optional, Systemstatus, „Hinweise wieder anzeigen“, „Erste Schritte wieder einblenden“ · §3.1: Liste „Was die Person braucht“ · §6.2 „Alles als neue Migration nach 0006“ an E-19 angleichen | sofort |
| F13 | `EINSTELLUNGEN_NUTZER.md` | §1.1 Mitglieder-Details und Allergien · §2 Schritte | nach Fragen 3, 21 |
| F14 | `ONBOARDING.md` | §6.1, §6.2: KI-Schlüssel wird in der App eingetragen · §6.2 Verweis „Nr. 14“ → Nr. 18 · §2.3, §8 „Geburtsjahr bleibt leer“ · §2.2 Fall „niemand mit Bedarf“ | sofort |
| F15 | `ONBOARDING.md` | Schritt 4, Zeitbudget, Ablaufdiagramm · SMTP-Zeilen | nach Fragen 21, 4 |
| F16 | `DATENKATALOG.md` | §8.2 `setupHouseholdAction`, `einrichtung_schritt`, Abfragen `getSystemStatus`, „Erste Schritte“, letzte Erfassung · §4 durch die Liste hier ersetzen | sofort |
| F17 | `DATENKATALOG.md` | §2.7 `naehrwerte_bestaetigt_am` · §8.3 B′ · `estimateBestBeforeAction` · §2.3 | nach Fragen 7, 8, 6, 3 |
| F18 | `01_FOTO_ERKENNUNG.md`, `03`, `04_EINSTELLUNGEN.md` | Hinweis „abgelöst durch …“ bzw. Lebensmittelart statt Kategorie (#110) | sofort |
| F19 | `.env.example`, `src/shared/config/env.ts` | `APP_SECRET` mit Startprüfung · Standardmodell Haiku 5.5 · SMTP-Variablen raus | sofort, SMTP nach Frage 4 |
| F20 | `design.html`, `dashboard-mockup.html` | als abgelöst kennzeichnen, sobald die Richtung gewählt ist | nach Frage 1 |

### 5.2 Issues

| Nr. | Issue | Änderung | Wann |
|---|---|---|---|
| I1 | #112 / #120 | Umfang auf Liste A erweitern. In #120 korrigieren: `naehrwerte_quelle` ohne `richtwert`, `nutzer.email` bleibt NOT NULL, „Kein E-Mail-Wert ist Pflicht“ → „keine echte E-Mail-Adresse“ | sofort |
| I2 | #120 (zweiter Teil) | Liste B als eigene Migration | nach Runde 1 |
| I3 | #121 | zusätzlich: `isCountedOn` unterscheidet heute und Zieldatum („Noch gut“ nie am Zieldatum), `STILL_GOOD_COUNTS_AS_SUPPLIED` entfernen, Zustand `no-date`, `timeGroupFor`, `containsEstimates` → Richtwert-Anteil, `removeUser` entfernen, `goal-progress` ohne Fehler bei vergangenem Zieldatum, `diet-shifts` als Seed-Werkzeug, Orange ≥ 7 | sofort |
| I4 | #121, #124 | `estimateBestBeforeOnRequest` entfernen oder auf Lebensmittelart umstellen, MHD-Teil von #124 streichen oder behalten | nach Frage 6 |
| I5 | #122 | Makro-Richtwerte der Art, „ohne N Produkte“, Warengruppe ohne Zielmenge | sofort |
| I6 | #124 | Nährwerte: Reihenfolge und Bestätigung | nach Fragen 7, 8 |
| I7 | #123 | Admin darf das erzeugte Passwort überschreiben, `passwort_vorlaeufig`, Liste „Was die Person braucht“. #42 schließen | sofort |
| I8 | neu (M3) | Anmelde-Bremse (`anmelde_sperre`), Kommandozeile `admin.mjs`, Willkommensseite für Mitglieder, Probelauf Better Auth ohne Admin-Plugin vor M3-01 | sofort |
| I9 | #108, #114 | Text auf `ki_verbindung` und `ki_rollen_zuweisung` umstellen, Mitglied sieht „an“ oder „aus“ (E-18). Ort der Seite | sofort, Ort nach Frage 19 |
| I10 | #110 | Schlüssel für eigene Arten (Review M3). Satz „nie als MHD“ je nach Antwort präzisieren | sofort, Satz nach Frage 6 |
| I11 | #125 | Zeitgruppe „Diese Woche“ | nach Frage 14 |
| I12 | #126 | Makro-Richtwerte, Rechte für Mitglieder | nach Frage 11 |
| I13 | #127 | Aufträge aus SCHNITTSTELLEN Nr. 10, 15, 16, 19–23: Zustand „Datum fehlt“, Herkunft der Nährwerte, Startphase, „Erste Schritte“, Hinweis-Baustein, Einrichtung, Passwort-Seite, Einstellungen. Nicht zeigen: „Flaschen“, „Kisten“ | nach Frage 1 |
| I14 | #128, #19 | Review-Befunde zur Startliste (Behälter im Namen, Tee und Kaffee, Erdnüsse). Richtwerte inklusive Makros und Haltbarkeit. Altersgrenzen der Personentypen aus der Quelle | sofort |
| I15 | #119 | Antworten der Runde 1 übernehmen, danach schließen | nach Runde 1 |
| I16 | neu (M2) | `nextStep` (A4), `replacementCandidates` (A14), `needsSecondAttempt` und `mergeAttempts` (#114) | sofort |
| I17 | neu (M7, M3) | Startphase, Karte „Erste Schritte“, Hinweise H1–H14, Meilensteine | nach Frage 22 |
| I18 | neu (M9, M3) | Systemstatus und Vorab-Prüfung (eine Funktion, zwei Orte), `APP_SECRET`-Startprüfung | sofort, Sperre nach Frage 24 |
| I19 | M11-Issues | je Haushalt, ohne Mail, Merker `*_gesendet_am` | nach Fragen 4, 5, 14 |
| I20 | neu (Export, SYS-01) | Test: Export enthält keine Geheimnisse (Passwort, Token, Schlüssel, Endpoint, technische E-Mail) | sofort |
| I21 | alle UI-Issues mit dem Label `wartet-auf-design` (u. a. #108, #117, #123, #125, #126) | Kommentar mit den Folgen aus dieser Datei | nach Fragen 1, 2 |
