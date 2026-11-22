# Preposaurus – Datenkatalog und Schnittstellen

> Stand 2026-11-22 · Strang **Datenstruktur** · Entwurf zur Freigabe.
> Grundlage: `05_STATUS_ENTSCHEIDUNGEN.md` (inkl. Updates vom 2026-11-22), `UX_KONZEPT.md` (Screens, Auswertungen A1–A19), `EINSTELLUNGEN_NUTZER.md`, `SCHNITTSTELLEN.md`, Schema in PR #112 (Branch `m1/datenmodell`, Stand `c9cbd78`), Fachlogik auf `main` (`d9d3a1d`), `technik.html`, `features.html`, `01`–`03`, Issues #108 (inkl. letztem Kommentar: KI-Verbindungen), #110, #114–#117, #119.
> Leitfrage: **Welche Daten brauchen wir wirklich, wofür und woher?** Kein Feld ohne Verwendung, keine Anzeige ohne Feld.

**Inhalt:** §0 Kurzfassung · §1 Lesehilfe · §2 Katalog je Entität · §3 Auswertungen → Daten · §4 Abgleich Schema PR #112 · §5 Abgleich Fachlogik · §6 Historie und Verlauf · §7 Export und Backup · §8 Schnittstellen · §9 Offene Fragen

---

## 0. Kurzfassung

**Wichtigste Lücken** (Verwendung ohne Feld):
1. `einheit.mhd` ist Pflicht, „Datum fehlt“ (#116) braucht `NULL`. Ebenso Fachlogik: `BestBefore` darf nicht fehlen.
2. Idempotenz hängt an `produkt.erfassung_id` (UNIQUE). „Packungen hinzufügen“ zu einem bestehenden Produkt hat damit keinen Schlüssel. Vorschlag: kleine Tabelle `erfassung` und `einheit.erfassung_id`.
3. Nährwert-Herkunft: `naehrwerte_geschaetzt` reicht nicht für #115 (Etikett, von Hand, KI-Schätzung). Vorschlag `produkt.naehrwerte_quelle`.
4. Makro-Richtwerte fehlen an der Lebensmittelart (nur `kcal_100`). A6/A8 zeigen Makros auf jeder Ebene, auch bei Produkten ohne Tabelle.
5. Nachkaufen: Ziel-Lücken werden live gerechnet, aber „Abhaken“ (F5) und „Ausblenden“ brauchen einen gespeicherten Zustand. Dazu fehlen `erledigt_am`, ein Bezug auf die **Lebensmittelart** (statt Produkt) und der Wert `ziel` als Quelle.
6. `haushalt.aktive_quelle_id` zeigt auf die Quelle, nicht auf die **Version**. „So wird gerechnet“ braucht Stand und Link der genutzten Version.
7. KI-Protokoll `ki_aufruf` kennt weder Rolle noch Versuch. Der Zweitversuch Haiku → Sonnet (#114) ist so nicht nachvollziehbar.
8. Erinnerungen: kein Merker, wann zuletzt gesendet wurde. „Dringend höchstens einmal am Tag, nur Neues“ geht so nicht.
9. KI-Schema B (Nährwerte) liefert weder kJ noch Portionsgröße, die Fachlogik (`resolveKcal`, `toPer100`) braucht beides.
10. `lagerort` lässt sich nicht ausblenden, `lebensmittelart` hat für eigene Arten keinen Schlüssel für das KI-Schema.

**Wichtigste Streichkandidaten** (Feld ohne Verwendung im MVP):
- `mitglied`: `geburtsdatum`, `geschlecht`, `aktivitaet`, `gewicht_kg`, `zustand`, dazu `haushalt.rechenmodus`. Sie wirken nur im Modus „Individuell“ (ZIEL-02, später). Gesundheitsdaten ohne Zweck nicht speichern, die Migration kommt mit ZIEL-02.
- `mitglied_allergie`: Der Hinweis (NK-06) ist „später“. Ohne ihn wird das Feld nirgends genutzt.
- `kategorie.kcal_durchschnitt_100`, `kategorie.uebliche_haltbarkeit_monate`: ersetzt durch die Richtwerte der Lebensmittelart.
- `produkt.kategorie_id`, sobald `lebensmittelart_id` Pflicht ist (abgeleitet, doppelt gespeichert).
- `benachrichtigung_einstellung`, `ki_einstellung` (ersetzt durch Haushalts-Spalten bzw. `ki_verbindung` + `ki_rollen_zuweisung`).
- `foto.hash`, `foto.groesse_bytes`: nur behalten, wenn die Verwendung aus §2.11 gilt.
- Fachlogik: `removeUser` (Nutzer werden nie gelöscht), `STILL_GOOD_COUNTS_AS_SUPPLIED` als Konstante.

**Fehler in der Fachlogik:** Mit „Noch gut zählt mit“ = an zählt eine geprüfte Packung heute auch **am Zieldatum** mit (`isCountedOn` unterscheidet die Stichtage nicht). Das widerspricht #117.

---

## 1. Lesehilfe

**Herkunft:** `F` Foto/KI-Vorschlag (bestätigt) · `M` manuell · `A` abgeleitet/berechnet · `S` Seed (versioniert) · `E` Einstellung · `Sys` vom System gesetzt (Zeitstempel, Nutzer, Idempotenz) · `BA` von Better Auth verlangt.
**Pflicht:** `P` Pflicht · `o` optional.
**Stand:** `MVP` · `später`.
**Kennzeichen:** **[S]** Streichkandidat (keine Verwendung) · **[L]** Lücke (Verwendung ohne Feld, Feld fehlt im Schema) · **[Ä]** Änderung am bestehenden Feld nötig.
**Verwendung:** Auswertungen A1–A19 (UX §3), Funktions-IDs aus `features.html`, Screens aus UX §8, `R:` Regel, `X:` Export.

Alle Tabellen haben `id` (uuid, App-erzeugt), `created_at`, `updated_at`. Sie werden unten nur genannt, wenn sie fachlich genutzt werden.

---

## 2. Datenkatalog je Entität

### 2.1 Haushalt (`haushalt`)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `name` | Anzeigename | text | P | E (Standard „Unser Haushalt“) | Einstellungen Haushalt, Kopf der Wochenübersicht | MVP |
| `aktive_quelle_id` **[Ä]** | aktive Empfehlung | uuid → `quelle` | o | Sys (Seed BBK/BLE) | ZIEL-01, ZIEL-06 Erklär-Blatt | MVP |
| → Vorschlag `aktive_quelle_version_id` **[L]** | genutzte Fassung mit Stand und Link | uuid → `quelle_version` | P | Sys bei Einrichtung, später E | A1, A9, ZIEL-06 („Stand, Link“), SYS-06 | MVP |
| `rechenmodus` **[S]** | offiziell/individuell | text | P | E | nur ZIEL-02 (später) | später |

### 2.2 Haushaltseinstellung (`haushalt_einstellung`, 1:1)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `standard_ernaehrungsform` | alles/vegetarisch/vegan | text | P | E | A9, A13 (Zielmengen), UEB-08 | MVP |
| `ampel_gelb_tage` | Schwelle „bald fällig“ | int Tage | P | E (90) | A11, Bald-fällig-Gruppen, ROT-01 | MVP |
| `ampel_orange_tage` | Schwelle „dringend“ | int Tage | P | E (28) | A11, ERI-03 | MVP |
| `ki_aktiv` | Foto-Erkennung an | bool | P | E (aus) | R: kein Foto verlässt das NAS ohne „an“; ERF-16 | MVP |
| `noch_gut_zaehlt_mit` **[L]** | geprüfte, abgelaufene Packung zählt heute | bool | P | E (aus) | A1, A2, A9 (nur Stichtag heute), #117 | MVP |
| `wochenuebersicht_aktiv`, `_wochentag` (1–7), `_uhrzeit` **[L]** | Zeitplan Wochenübersicht je Haushalt | bool, smallint, time | P | E (an, Sa, 10:00) | ERI-02, Worker | MVP |
| `dringend_aktiv` **[L]** | Push „Dringend“ | bool | P | E (an) | ERI-03 | MVP |
| `einrichtung_abgeschlossen_am` **[L]** | Merker Ersteinrichtung | timestamptz | o | Sys | ERS-01 (Fortsetzen nach Abbruch) | MVP |
| `einrichtung_schritt` **[L]** | zuletzt erledigter Schritt (1–4) | smallint CHECK | o | Sys | Fortsetzen am richtigen Schritt, auch nach Überspringen (`ONBOARDING.md` §2.3, SCHNITTSTELLEN Nr. 11) | MVP |
| `wochenuebersicht_gesendet_am`, `dringend_gesendet_am` **[L]** | letzter Versand | timestamptz | o | Sys (Worker) | R: höchstens 1×/Tag, „Dringend“ meldet nur, was seit dem letzten Versand dringend wurde, Nachholen nach Ausfall (P16) | MVP |
| `inventur_intervall` | – | – | – | – | ROT-08/ERI-05 | später |

### 2.3 Mitglied (`mitglied`) und Allergie

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `name` | Anzeigename der Person | text | P | M (Einrichtung: „Person 2“ …) | Einstellungen Mitglieder, UEB-08 | MVP |
| `typ` | baby/kind/jugendlich/erwachsen/senior | text | P | M (Zähler in der Einrichtung) | A1 (Bedarf über `quelle_bedarf`), A9 (Zielmengen), Erklär-Blatt („Baby zählt nicht“) | MVP |
| `ernaehrungsform` | leer = wie Haushalt | text | o | M | A9, A13 | MVP |
| `piktogramm` **[S]** | Symbol der Person | text | o | M | keine festgelegte Anzeige. Streichen oder Design meldet Bedarf | – |
| `geburtsdatum`, `geschlecht`, `aktivitaet`, `gewicht_kg`, `zustand` **[S]** | Angaben für DGE-Rechnung | div. | o | M | nur ZIEL-02 „Individuell“ und HH-05 (beide später). Gesundheitsdaten, deshalb nicht auf Vorrat speichern | später |
| `mitglied_allergie.bezeichnung` **[S]** | Allergie | text | o | M | nur NK-06 (später). Ohne Hinweis keine Verwendung | später |

Hinweis: HH-02 nennt das Geburtsjahr als Pflicht. Das ist durch den MVP-Zuschnitt (ZIEL-02 später) und `EINSTELLUNGEN_NUTZER.md` §1.1 überholt. `typ` wird direkt gewählt.

### 2.4 Nutzer und Anmeldung (`nutzer`, `sitzung`, `konto`, `verifizierung`, `anmelde_sperre`)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `name` | Anzeigename | text | P | M | Verlauf („Alex hat entnommen“), Nutzerliste, ROT-07 | MVP |
| `benutzername` **[L]** | Anmeldename, klein | text UNIQUE | P | M | ERS-02, Nutzerliste | MVP |
| `email` | technische Adresse `<id>@nutzer.invalid` | text UNIQUE | P | BA/Sys | nur Better Auth, nie angezeigt, nie exportiert | MVP |
| `email_verified`, `image` | – | bool, text | P/o | BA | keine (Bibliothek verlangt sie) | MVP |
| `rolle` | admin/mitglied | text | P | E (Admin) | R: Rechte-Matrix, „letzter Admin“ | MVP |
| `aktiv` | deaktiviert = keine Anmeldung | bool | P | E | R: Anmeldung, Nutzerliste | MVP |
| `haushalt_id` **[Ä]** | Haushalt | uuid | heute o | Sys | R: Mandantenfilter. Nach M3 auf NOT NULL prüfen | MVP |
| `mitglied_id` | Verknüpfung Person | uuid UNIQUE | o | E | HH-06, Einrichtung (erste Person = Admin) | MVP |
| `passwort_vorlaeufig` **[L]** | vom Admin gesetzt | bool | P | Sys | Hinweis „eigenes Passwort setzen?“ | MVP |
| `passwort_geaendert_am`, `_von` **[L]** | Nachvollziehbarkeit | timestamptz, uuid | o | Sys | Konto („zuletzt geändert am … von …“) | MVP |
| `letzte_anmeldung_am` **[L]** | – | timestamptz | o | Sys | Nutzerliste | MVP |
| `ki_hinweis_bestaetigt_am` **[L]** | Datenschutzhinweis vor erstem Foto | timestamptz | o | M (ein Tipp) | R: Foto-Erkennung erst nach Bestätigung | MVP |
| `konto.password` | scrypt-Hash | text | P | Sys | Anmeldung. **Nie** exportiert, nie geloggt | MVP |
| `konto.access_token` … `scope` | OAuth-Felder | text | o | BA | ungenutzt (kein OAuth), von der Bibliothek vorgegeben | – |
| `sitzung.*` | Sitzung je Gerät | – | – | BA | ERS-02, „Überall abmelden“ | MVP |
| `verifizierung.*` | – | – | – | BA | bleibt leer | – |
| `anmelde_sperre.schluessel`, `fehlversuche`, `letzter_fehlversuch_am`, `gesperrt_bis` **[L]** | Bremse gegen Durchprobieren | text UNIQUE, int, timestamptz | P | Sys | `EINSTELLUNGEN_NUTZER.md` §4.3, Worker räumt nach 24 h auf | MVP |

### 2.5 Quelle und Ziel (`quelle`, `quelle_version`, `quelle_bedarf`, `quelle_wert`, `warengruppe`, `ziel`)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `quelle.schluessel`, `name`, `land` | z. B. bbk-ble, „BBK/BLE“, DE | text | P | S | ZIEL-01, SYS-06, Erklär-Blatt | MVP |
| `quelle_version.stand`, `link` | Fassung | text | P | S | ZIEL-06, SYS-06, R: Werte versioniert | MVP |
| `quelle_version.standard_tage` | Standard-Zeitraum (10) | int | P | S | Vorbelegung Zieldauer (Einrichtung), STA-01 alternative Basis | MVP |
| `quelle_version.geprueft` | gegen Original geprüft | bool | P | S | R: nur geprüfte Fassung wird aktiv (Hinweis im Erklär-Blatt, solange ungeprüft) | MVP |
| `quelle_bedarf.personengruppe` **[Ä]** | Gruppe | text | P | S | A1. Vorschlag: Werte = `MEMBER_TYPES` mit CHECK, eine Zeile je Typ. Sonst fehlt die Zuordnung `mitglied.typ` → Gruppe | MVP |
| `quelle_bedarf.kcal_tag`, `wasser_l_tag` | Bedarf je Person | numeric kcal, l | P | S | A1, A2, A4, A10, Erklär-Blatt | MVP |
| `warengruppe.schluessel`, `name`, `sortierung` | Rechenebene | text, int | P | S | A9, A13, Vorrat Ebene 1. Piktogramm über den Schlüssel im Code, keine Spalte | MVP |
| `quelle_wert.menge_pro_person_tag`, `mass_einheit`, `ernaehrungsform` | Zielmenge je Warengruppe und Form | numeric g/ml | P | S | A9, A13, UEB-03, NK-01 | MVP |
| `ziel.tage` | Zieldauer | int | P | E (aus `standard_tage`) | UEB-02, A3, A9 („X von Y Tagen“), A13. Die Zeile entsteht in der Einrichtungs-Transaktion, kein Haushalt ohne Ziel (SCHNITTSTELLEN Nr. 13) | MVP |
| `ziel.zieldatum` | Stichtag | date | o | E | A3, A14, Bald fällig „bis zum Ziel“ | MVP |
| `ziel_etappe` | – | – | – | – | ZIEL-05, ERI-04 | später |

### 2.6 Stammdaten Ordnung (`kategorie`, `lebensmittelart`, `behaelter`, `lagerort`)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `kategorie.name`, `warengruppe_id`, `sortierung`, `ausgeblendet` | Zwischenebene | text, uuid, int, bool | P | S / M (eigene) | Vorrat Ebene 2 (Zwischenüberschrift, Sprungchips), Pfadzeile, EIN-04 | MVP |
| `kategorie.piktogramm` | Symbol | text | o | S | Zeilen im Vorrat (auch für Lebensmittelarten, siehe unten) | MVP |
| `kategorie.ist_system`, `schluessel`, `haushalt_id` | System oder eigen | bool, text, uuid | – | S/Sys | R: Seed findet Zeile wieder, System nur ausblendbar. `ist_system` ist aus `haushalt_id is null` ableitbar (geringe Doppelung, durch CHECK gesichert) | MVP |
| `kategorie.kcal_durchschnitt_100`, `uebliche_haltbarkeit_monate` **[S]** | alte Ersatzwerte | numeric, int | o | S | keine mehr: Richtwerte stehen an der Lebensmittelart (#110, UX §4: eigene Art ohne Richtwert zählt mit 0) | – |
| `lebensmittelart.name`, `kategorie_id`, `sortierung`, `ausgeblendet` | „Spaghetti“ | text, uuid | P | S / M | Vorrat-Zeile, Detail, Suche, Bald fällig, Nachkaufen, Erfassen, KI-Schema A | MVP |
| `lebensmittelart.schluessel` **[Ä]** | Schlüssel für KI-Liste und Export | text | P (Vorschlag) | S / Sys (Slug aus Name) | KI-Schema A braucht für **eigene** Arten einen Wert. Vorschlag: Schlüssel für alle Arten, UNIQUE je Haushalt (`NULLS NOT DISTINCT`) | MVP |
| `lebensmittelart.kcal_100` | kcal-Richtwert | numeric | o | S | A1, A5, A8 als „ca.“, A18 | MVP |
| `lebensmittelart.eiweiss_100`, `kh_100`, `fett_100` **[L]** | Makro-Richtwerte | numeric | o | S | A6, A8 für Produkte ohne Tabelle. Ohne sie fehlen Makros genau bei den Produkten, die „ca.“ tragen | MVP |
| `lebensmittelart.uebliche_haltbarkeit_monate` | Richtwert Haltbarkeit | int | o | S | Hinweis auf Detailseite, M2-09 Plausibilität („weit weg vom Üblichen“). Nie als MHD (#110), Ausnahme siehe Frage 3 | MVP |
| `lebensmittelart.piktogramm` | – | – | – | – | Entscheidung: Kategorie-Piktogramm reicht (an Design gemeldet) | – |
| `behaelter.schluessel`, `name`, `sortierung` | Dose, Glas … | text | P | S | Filter (VOR-03), KI-Schema A (Liste), Wiedererkennen eines Produkts | MVP |
| `lagerort.name`, `sortierung` | Keller, Küche | text, int | P | M | Filter (A19, VOR-05), Bald fällig „nach Lagerort“ | MVP |
| `lagerort.ausgeblendet` **[L]** | nicht mehr anbieten | bool | P | E | EIN-04 („ausblenden“), ein FK darf nicht ins Leere zeigen | MVP |
| `tag`, `produkt_tag` | Schlagwörter | – | – | – | VOR-06 | später |

### 2.7 Produkt (`produkt`)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `lebensmittelart_id` **[Ä]** | Art | uuid | heute o → **P** | F/M | gesamter Baum, A8, Nachkaufen, Wiedererkennen. UX §1: Pflicht. Ohne Art keine Summe je Art | MVP |
| `kategorie_id` **[S]** | Kategorie | uuid | P | A (aus Art) | doppelt, sobald die Art Pflicht ist. Ableiten per Join, der zusammengesetzte FK entfällt | – |
| `bezeichnung` **[Ä]** | heute Pflichtname | text | P → o | F/M | UX zeigt „Lebensmittelart + Menge“ („Spaghetti 500 g“). Vorschlag: optionaler **Zusatz** („Vollkorn“), leer = Name der Art (Frage 6 im UX-Konzept) | MVP |
| `inhalt_wert`, `inhalt_einheit` | Menge je Packung | numeric, g/ml | P | F/M | A5, A8, A9, A10, kcal je Packung, Wiedererkennen | MVP |
| `abtropfgewicht_g` | Bezug der Nährwerte bei Konserven | numeric g | o | F/M | `nutritionBase` (kcal), A9 je nach Frage 12 im UX-Konzept | MVP |
| `behaelter_id` | Behälter | uuid | o | F/M | Filter, Wiedererkennen | MVP |
| `lagerort_id` | Lagerort | uuid | o | M (vorbelegt aus letzter Erfassung) | A19, Bald fällig nach Lagerort | MVP |
| `kcal_100`, `eiweiss_100`, `kh_100`, `fett_100` | Nährwerte je 100 g/ml | numeric | o | F/M/KI-Schätzung | A1, A5, A6, A8, Detail | MVP |
| `naehrwerte_geschaetzt` **[Ä]** | Schätzung ja/nein | bool | P | A | ersetzen durch `naehrwerte_quelle` | – |
| `naehrwerte_quelle` **[L]** | `tabelle` · `manuell` · `ki_schaetzung`, leer = keine Werte (dann Richtwert der Art live, nie gespeichert) | text CHECK | o | Sys | A18, „ca.“, Detail („vom Etikett“, „von Hand“, „Schätzung“), #115 | MVP |
| `naehrwerte_bestaetigt_am` | gesonderte Bestätigung der Schätzung (#115) | timestamptz | o | M | siehe Frage 2: nur nötig, wenn unbestätigte Schätzungen gespeichert werden dürfen | offen |
| `erfassung_id` **[Ä]** | Idempotenz | uuid UNIQUE | o | Sys | wandert an `einheit` bzw. in `erfassung` (§2.9) | – |
| `ballaststoffe_100`, `zucker_100`, `salz_100` | – | – | – | – | nirgends ausgewertet, nicht anlegen | – |

### 2.8 Einheit = Packung (`einheit`)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `produkt_id` | Produkt | uuid | P | Sys | alles | MVP |
| `mhd` **[Ä]** | Datum, Monat/Jahr als Monats- bzw. Jahresende | date | P → **o** | F/M | A1, A3, A11, A12, A14, A16, FIFO. `NULL` = „Datum fehlt“ (#116) | MVP |
| `mhd_genauigkeit` **[Ä]** | tag/monat/jahr | text | P → o | F/M | Anzeige „09/2027“, Gruppierung. CHECK: leer genau dann, wenn `mhd` leer | MVP |
| `mhd_art` | mhd/verbrauchen_bis | text | P | F/M (Standard mhd) | ROT-06, „Noch gut“ nur bei MHD | MVP |
| `mhd_geschaetzt` | Datum auf Wunsch geschätzt | bool | P | Sys | Chip „geschätzt“, A18. CHECK: true nur mit `mhd` | MVP |
| `status` | vorrat/verbraucht/entsorgt | text | P | M | alle Auswertungen, ROT-03/04, Verlauf | MVP |
| `entnommen_am` | Zeitpunkt der Entscheidung | timestamptz | P bei ≠ vorrat | Sys | A15, A16, A17, Verlauf, ROT-07 | MVP |
| `entnommen_von` | wer | uuid → nutzer | o | Sys | Verlauf („von Alex“), ROT-07 | MVP |
| `geprueft_am` | „Noch gut“ | date | o | M | Vorrat „geprüft am“, verlässt Gruppe „Abgelaufen“, A1 mit Schalter | MVP |
| `erfassung_id` **[L]** | aus welcher Erfassung | uuid → `erfassung` | P (neu) | Sys | Idempotenz auch für „Packungen hinzufügen“, Verlauf „hinzugefügt“ | MVP |
| `created_at` | Anlagezeitpunkt | timestamptz | P | Sys | A16 (Rückrechnung), Verlauf. **Muss beim Import erhalten bleiben** | MVP |

### 2.9 Erfassung, Entwurf, Foto, KI

**`erfassung`** (neu, **[L]**): eine bestätigte Erfassung.

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `id` | Idempotenz-Schlüssel (Entwurfs-ID oder im Gerät erzeugt) | uuid | P | Sys | R: doppeltes „Speichern“ legt nichts doppelt an | MVP |
| `haushalt_id`, `nutzer_id` | wer | uuid | P | Sys | Vorbelegung (letzter Lagerort über das Produkt, letzter Weg), Verlauf | MVP |
| `weg` | foto/manuell | text | P | Sys | Vorbelegung des Erfassungswegs (UX F2), später Statistik Foto-Quote | MVP |

Begründung: Ohne diese Tabelle braucht es entweder `nutzer_einstellung` (vom Einstellungen-Strang verworfen) oder Browser-Speicher, und Nachschub hätte keinen Idempotenz-Schlüssel.

**`erfassung_entwurf`**

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `nutzer_id`, `haushalt_id` | Besitzer | uuid | P | Sys | R: nur eigener Entwurf, „fortsetzen oder verwerfen?“ | MVP |
| `daten` | Stand der Schritte, Vorschläge, Korrekturen | jsonb (Zod `CaptureDraftSchema`) | P | F/M | Erfassen, P14 („Entwurf geht nie verloren“) | MVP |
| `updated_at` | – | – | – | Sys | R: Aufräumen nach 7 Tagen | MVP |

**`foto`**

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `rolle` | verpackung/naehrwerte/mhd | text | P | Sys | Detail (Produktbild = Verpackung), KI-Rolle | MVP |
| `pfad` | Datei im Volume, Vorschaubild per Namensregel | text UNIQUE | P | Sys | `/api/photos/[id]` | MVP |
| `dateityp` | MIME | text | P | Sys | Auslieferung | MVP |
| `nutzer_id` **[L]** | wer hochgeladen hat | uuid → nutzer, SET NULL | o | Sys | Onboarding-Hinweise enden nach drei gelungenen Fotos je Rolle und Nutzer (SCHNITTSTELLEN Nr. 14). Der Entwurf als Quelle reicht nicht, er wird nach dem Bestätigen gelöscht | MVP |
| `status`, `entwurf_id`, `produkt_id`, `einheit_id` | Zuordnung | – | – | Sys | R: Bestätigen hängt um, Aufräumen. `einheit_id` zeigt bei Chip mit Anzahl auf **eine** der Packungen (Verwendung: „Datum ändern“ zeigt das Foto) | MVP |
| `hash` **[S?]** | Prüfsumme | text | P | Sys | nur sinnvoll mit Regel „gleiches Foto im selben Entwurf → kein zweiter KI-Aufruf“. Sonst streichen | MVP |
| `groesse_bytes` **[S?]** | Größe | int | P | Sys | keine Anzeige festgelegt. Behalten nur für „Speicherbedarf der Fotos“ unter Daten & System (später, SYS-04) | später |

**KI-Verbindungen** (ersetzen `ki_einstellung`, Festlegung #108, letzter Kommentar)

| Tabelle.Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `ki_verbindung.anbieter` | anthropic (später openai, lokal) | text CHECK | P | E | Adapter-Wahl | MVP |
| `ki_verbindung.name` | „Anthropic privat“ | text | P | E | Liste, Zuweisung | MVP |
| `ki_verbindung.schluessel_chiffrat`, `_iv`, `_tag` | AES-256-GCM mit `APP_SECRET` | text | P | E | Aufruf. **Nie** im Export, Log, Client | MVP |
| `ki_verbindung.schluessel_hinweis` | `…4f2a` | text | P | Sys | maskierte Anzeige ohne Entschlüsseln | MVP |
| `ki_verbindung.letzter_test_status`, `letzter_test_am` | Ergebnis „Verbindung testen“ | text, timestamptz | o | Sys | Status-Anzeige (EIN-08) | MVP |
| Verbindung aus `.env` | – | keine Zeile | – | Umgebung | erscheint als feste Verbindung „aus Umgebungsvariable“, Kennung `env` | MVP |
| `ki_rollen_zuweisung.rolle` | verpackung · naehrwerte · naehrwerte_schaetzen · mhd · mhd_zweitversuch | text CHECK, UNIQUE je Haushalt | P | Seed/E | Adapter: Modell je Aufruf | MVP |
| `ki_rollen_zuweisung.verbindung_id` | Verbindung, leer = `.env` | uuid | o | E | Adapter | MVP |
| `ki_rollen_zuweisung.modell` | Modell-ID aus fester Liste | text | P | E (Empfehlung) | Adapter, Anzeige „Empfohlen: …“ (Empfehlung als Konstante im Code) | MVP |
| `ki_rollen_zuweisung.aktiv` | nur für `mhd_zweitversuch`: abschaltbar | bool | P | E (an) | #114 | MVP |

**`ki_aufruf`** (Protokoll)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `foto_id`, `modell`, `erfolg`, `fehlerart`, `dauer_ms` | Aufruf | – | – | Sys | Fehleranalyse, Status „Fehler beim letzten Aufruf“ (#108) | MVP |
| `rolle` **[L]** | KI-Rolle (auch ohne Foto, z. B. Schätzung, Test) | text | P | Sys | #114 (beide Versuche nachvollziehbar), PoC | MVP |
| `versuch` **[L]** | 1 oder 2 | smallint | P | Sys | #114 Zweitversuch | MVP |
| `verbindung_id` **[L]** | genutzte Verbindung | uuid SET NULL | o | Sys | Status je Verbindung | MVP |
| `sicherheit` **[L]** | hoch/mittel/niedrig/leer | text | o | F | Messung „wie oft war Haiku unsicher“ (#114) | MVP |
| `tokens_ein`, `tokens_aus`, `kosten_usd` | Verbrauch | int, numeric | o | Sys | EIN-09 Kosten des Monats (später). Trotzdem jetzt mitschreiben, sonst fehlen Daten, wenn EIN-09 kommt | MVP schreiben, später anzeigen |

### 2.10 Nachkaufen (`nachkauf_eintrag`)

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `quelle` **[Ä]** | ziel · nachkauf · manuell | text | P | Sys | Abschnitte „Fehlt bis zum Ziel“, „Ersetzen“, „Eigene“. `ziel` wird nur gespeichert, wenn eine Lücke abgehakt oder ausgeblendet wird | MVP |
| `warengruppe_id` | Ziel-Lücke | uuid | o | A | NK-01, A13 | MVP |
| `produkt_id` **[Ä]** → `lebensmittelart_id` **[L]** | „Spaghetti nachkaufen“ | uuid | o | M/A | NK-02, NK-05 („Gekauft und erfassen“ füllt die Art vor), UX §5 | MVP |
| `bezeichnung` **[Ä]** | Freitext | text | P → o | M | NK-03. CHECK: mindestens Warengruppe, Art oder Bezeichnung | MVP |
| `menge`, `mass_einheit` | g/ml/stueck | numeric, text | o | A/M | Liste, Ziel-Lücke als Momentaufnahme beim Abhaken | MVP |
| `erledigt` **[Ä]** → `status` | offen · erledigt · ausgeblendet | text | P | M | Abhaken (NK-04), Ausblenden (UX 8.6), Abschnitt „Erledigt“ | MVP |
| `erledigt_am` **[L]** | wann abgehakt | timestamptz | o | Sys | „Erledigt“ sortieren, Aufräumen nach 14 Tagen (Vorschlag), R: ausgeblendete Ziel-Lücke gilt bis zur nächsten Änderung der Lücke | MVP |

### 2.11 Erinnerung und Push

| Feld | Bedeutung | Typ | P | Herkunft | Verwendung | Stand |
|---|---|---|---|---|---|---|
| `push_abo.endpoint`, `schluessel_p256dh`, `schluessel_auth` | Web-Push je Gerät | text | P | Gerät | ERI-01. Nie exportiert | MVP |
| `push_abo.nutzer_id`, `geraet` | Besitzer, „iPhone“ | uuid, text | P/o | Sys | Konto und Gerät, Abmelden löscht Abo | MVP |
| `benachrichtigung_einstellung` **[S]** | – | – | – | – | entfällt (Erinnerungen je Haushalt, §2.2) | – |

### 2.12 Einstellungen, Verlauf

- Einstellungen stehen ausschließlich in `haushalt_einstellung`, `ki_verbindung`, `ki_rollen_zuweisung`, `ziel`, Stammdaten. Persönlich ist nur das Konto (§2.4). `nutzer_einstellung` wird nicht angelegt. „Hell/Dunkel“ und Vorbelegungen gehören nicht in die DB.
- **Verlauf** hat keine eigene Tabelle, siehe §6.

---

## 3. Auswertungen → Daten

Gemeinsame Begriffe: **gezählt(S)** = Einheit mit `status = vorrat` und
- `mhd ≥ S`, oder
- `mhd` leer **und** S = heute („Datum fehlt“ zählt heute, nie am Zieldatum, #116), oder
- `mhd < S`, `geprueft_am` gesetzt, `noch_gut_zaehlt_mit` an **und** S = heute (#117).

**kcal(e)** = Basis × kcal_100 ÷ 100, Basis = `abtropfgewicht_g` falls gesetzt, sonst `inhalt_wert`. kcal_100 = Produktwert, sonst Richtwert der Lebensmittelart (dann „ca.“), sonst 0 (dann „zählt noch nicht mit“). Makros genauso.
**Bedarf** = Σ über Mitglieder mit Bedarf (`typ ≠ baby`) von `quelle_bedarf` der aktiven Version.

| Nr. | Formel | Benötigte Felder | Fehlende/geschätzte Werte |
|---|---|---|---|
| A1 Heute versorgt | min(Σ kcal ÷ kcal-Bedarf, Σ Wasser-ml ÷ Wasser-Bedarf), S = heute | einheit.status, mhd, geprueft_am · produkt.inhalt, abtropfgewicht, kcal_100, naehrwerte_quelle · lebensmittelart.kcal_100 · kategorie→warengruppe (Wasser) · mitglied.typ · quelle_bedarf · haushalt_einstellung.noch_gut_zaehlt_mit | „Datum fehlt“ zählt mit. Geschätztes MHD zählt wie erkanntes. „ca.“ bei > 10 % kcal aus Richtwert/KI-Schätzung. Bedarf 0 (nur Babys) → keine Zahl, Hinweis „Person mit Bedarf anlegen“ |
| A2 Was begrenzt | kleinerer Wert aus A1, Abstand zum anderen | wie A1 | wie A1 |
| A3 Ziel am Datum | wie A1 mit S = zieldatum + Liste „gezählt heute, nicht am Ziel“ | wie A1 + ziel.tage, zieldatum | „Datum fehlt“ zählt **nicht** und steht in der Liste. „Noch gut“ zählt nie. Zieldatum vergangen → Zeile entfällt mit Hinweis „Zieldatum anpassen“ |
| A4 Nächster Schritt | (ziel.tage − Ist-Tage des Engpasses) × Tagesbedarf, in l bzw. kcal | A1, A3 | ohne Ziel kein Schritt |
| A5 Energie gesamt | Σ kcal(gezählt heute) | wie A1 | „ca.“ wie A1 |
| A6 Makros | Σ g je Makro; Anteil = g × 4/4/9 ÷ Σ kcal | produkt.eiweiss/kh/fett_100 · **lebensmittelart.eiweiss/kh/fett_100 [L]** | Ohne Makro-Richtwert fehlt der Posten: Anzeige „ohne X Produkte“ statt stiller Null |
| A7 Makro-Tage | Σ g ÷ DGE-Bedarf | A6 + DGE-Werte (fehlen) | später |
| A8 Summen je Knoten | A5, A6, Packungen, kg/l, Tage (= kcal ÷ Bedarf), nächstes MHD, Richtwert-Anteil je Warengruppe/Kategorie/Art/Produkt | wie A1/A6 + Baum | nächstes MHD ignoriert „Datum fehlt“, zeigt aber „+2 ohne Datum“ |
| A9 Abdeckung je Warengruppe | Bestand(g/ml, gezählt S) ÷ Zielmenge; Zielmenge = Σ Personen mit Bedarf × menge_pro_person_tag(Form) × ziel.tage | inhalt, abtropfgewicht (Frage 12 UX), kategorie.warengruppe_id, quelle_wert, mitglied.ernaehrungsform, standard_ernaehrungsform | Nährwerte egal (Mengenrechnung). Wasser nur aus Warengruppe Wasser |
| A10 Wasser | Σ ml(Warengruppe Wasser) ÷ Wasserbedarf; andere Getränke daneben | wie A1 | – |
| A11 Bald fällig | Zeitgruppe aus mhd − heute: < 0 abgelaufen · ≤ 7 diese Woche · ≤ orange · ≤ gelb · später | mhd, mhd_art, geprueft_am, ampel_* | „Datum fehlt“ in keiner Gruppe, nur Filter „Unvollständig“. Geprüfte („Noch gut“) verlassen „Abgelaufen“ |
| A12 Abgelaufen, offen | mhd < heute, status vorrat, geprueft_am leer | wie A11 | – |
| A13 Fehlt bis zum Ziel | Zielmenge − Bestand(S = zieldatum) je Warengruppe, Mini-Lücken entfallen | A9, A3, nachkauf_eintrag (ausgeblendet/erledigt) | „Datum fehlt“ zählt am Ziel nicht, erhöht also die Lücke (gewollt: Anreiz, Datum nachzutragen) |
| A14 Ersetzen | Einheiten mit mhd < zieldatum + Arten, die zuletzt (30 Tage) verbraucht wurden und keinen Bestand haben | einheit.entnommen_am, status, lebensmittelart_id | ohne Zieldatum nur der zweite Teil |
| A15 Verbraucht/entsorgt | Σ Packungen, kg/l, kcal je Status und Monat (Europe/Berlin), Anteil entsorgt | status, entnommen_am, inhalt, kcal | Menge und kcal mit **heutigen** Produktwerten (keine Momentaufnahme, §6) |
| A16 Verlauf Tage versorgt | A1 für vergangene Stichtage: Einheit zählt, wenn created_at ≤ S < entnommen_am (bzw. offen) und mhd ≥ S | created_at, entnommen_am, mhd | später. Bedarf = heutiger Haushalt (Hinweis im Chart). „Noch gut“ wird rückwirkend nicht berücksichtigt |
| A17 Wiederholt entsorgt | Anzahl entsorgt je Art über 12 Monate | status, entnommen_am, lebensmittelart_id | später |
| A18 Verlässlichkeit | Anteil kcal aus Richtwert/KI-Schätzung; Produkte ohne Tabelle; Packungen „Datum fehlt“ bzw. „geschätzt“ | naehrwerte_quelle, mhd, mhd_geschaetzt | Filter „Unvollständig“ = Art ohne Richtwert und ohne Werte · Produkt ohne Tabelle · Packung ohne Datum |
| A19 Was liegt wo | Bestand je Lagerort | produkt.lagerort_id | ohne Lagerort: Gruppe „ohne Ort“ |

Weitere Anzeigen und ihre Daten: Haushaltszeile (Anzahl Mitglieder, ziel), Erklär-Blatt (quelle.name, version.stand/link, quelle_bedarf, nicht gezählte Personengruppen), Verlauf (einheit + nutzer.name), Wochenübersicht (A3, A11, A13), Kopf „Gespeichert, reicht jetzt 11,3 statt 9,4 Tage“ (A1 vor/nach, Antwort von `createStockAction`).

**Anzeige ohne Feld (an Design gemeldet):** „Grund des Entsorgens“, Preis/Kosten, Marke, Barcode, Sorte (solange Frage 6 UX offen), „Zuletzt entnommen“ (später, ableitbar), Makros je Ebene ohne Makro-Richtwerte (bis Lücke 4 geschlossen).

---

## 4. Abgleich mit dem Schema aus PR #112 (`c9cbd78`)

Priorität: **P1** blockiert eine Entscheidung vom 2026-11-22 oder ist fachlich falsch · **P2** nötig für MVP-Screens · **P3** Aufräumen.
Empfehlung: Da PR #112 noch offen ist, die P1/P2-Punkte **direkt in die Migrationen des PR** übernehmen statt einer Folgemigration. Nach dem Merge gilt: nur neue Migrationen.

| Nr. | Prio | Tabelle | Änderung | Grund |
|---|---|---|---|---|
| 1 | P1 | einheit | `mhd` nullable; `mhd_genauigkeit` nullable ohne Standard; CHECKs: `(mhd is null) = (mhd_genauigkeit is null)`, `not mhd_geschaetzt or mhd is not null`. Index `(produkt_id, status, mhd)` bleibt | #116 „Datum fehlt“. Kopfkommentar und 05 (M1-Festlegung „mhd ist Pflicht“) nachziehen |
| 2 | P1 | ki_einstellung | ersetzen durch `ki_verbindung` + `ki_rollen_zuweisung` (§2.9), Seed der fünf Rollen mit Empfehlung, `AI_ROLES` in `constants.ts` | #108 (letzter Kommentar), #114. Läuft laut Orchestrator bereits in PR #112 |
| 3 | P1 | haushalt_einstellung | + `noch_gut_zaehlt_mit`, `wochenuebersicht_aktiv/_wochentag/_uhrzeit`, `dringend_aktiv`, `einrichtung_abgeschlossen_am`, `einrichtung_schritt`, `wochenuebersicht_gesendet_am`, `dringend_gesendet_am` | #117, Einstellungen §6.2, Onboarding §2.3, Worker-Dedupe |
| 4 | P1 | produkt | `naehrwerte_geschaetzt` → `naehrwerte_quelle` (CHECK tabelle/manuell/ki_schaetzung, leer erlaubt; CHECK: leer ⇔ alle vier Werte leer). Umgesetzt in #132: `richtwert` ist keine gespeicherte Quelle, der Name bleibt `tabelle` wie in 05 | #115 |
| 5 | P1 | nutzer | + `benutzername`, `passwort_vorlaeufig`, `passwort_geaendert_am/_von`, `letzte_anmeldung_am`, `ki_hinweis_bestaetigt_am`; neue Tabelle `anmelde_sperre` | Anmeldung (05), Einstellungen §6.1 |
| 6 | P1 | erfassung (neu), einheit, produkt | neue Tabelle `erfassung(id, haushalt_id, nutzer_id, weg)`; `einheit.erfassung_id` NOT NULL FK; `produkt.erfassung_id` entfällt | Idempotenz für Nachschub, Vorbelegung ohne `nutzer_einstellung` |
| 7 | P2 | produkt | `lebensmittelart_id` NOT NULL; `kategorie_id` und zusammengesetzter FK entfallen; `bezeichnung` nullable (Zusatz) | UX §1 (Art Pflicht), Normalisierung. Seed braucht dann je Kategorie eine Art „Sonstiges …“ für Fälle ohne Treffer, oder „+ Neue Lebensmittelart“ ist Pflichtweg |
| 8 | P2 | lebensmittelart | + `eiweiss_100`, `kh_100`, `fett_100`; `schluessel` für alle Arten, UNIQUE `(haushalt_id, schluessel)` NULLS NOT DISTINCT, Herkunft-CHECK anpassen | A6/A8, KI-Schema A für eigene Arten |
| 9 | P2 | nachkauf_eintrag | `produkt_id` → `lebensmittelart_id`; `erledigt` → `status` (offen/erledigt/ausgeblendet); + `erledigt_am`; `bezeichnung` nullable + CHECK; `RESTOCK_SOURCES` + `ziel` | UX §5, F5, „Ausblenden“ |
| 10 | P2 | haushalt | `aktive_quelle_id` → `aktive_quelle_version_id` (FK `quelle_version`, NOT NULL nach Einrichtung) | ZIEL-06 Stand/Link, Versionierung wirksam machen |
| 11 | P2 | ki_aufruf | + `rolle`, `versuch`, `verbindung_id`, `sicherheit` | #114 |
| 12 | P2 | lagerort | + `ausgeblendet` | EIN-04 |
| 13 | P2 | quelle_bedarf | `personengruppe` CHECK auf `MEMBER_TYPES` (Seed eine Zeile je Typ) | Zuordnung Mitglied → Bedarf eindeutig |
| 14 | P2 | benachrichtigung_einstellung | Tabelle und `NOTIFICATION_KINDS` entfernen | Erinnerungen je Haushalt (Maintainer-Frage 1 in EINSTELLUNGEN_NUTZER) |
| 15 | P3 | mitglied, haushalt | `geburtsdatum`, `geschlecht`, `aktivitaet`, `gewicht_kg`, `zustand`, `piktogramm`, `rechenmodus` sowie `mitglied_allergie` nicht anlegen (mit ZIEL-02/NK-06 per Migration nachholen) | Datensparsamkeit, kein Feld ohne Verwendung. Siehe Frage 8 |
| 16 | P3 | kategorie | `kcal_durchschnitt_100`, `uebliche_haltbarkeit_monate` entfernen | Richtwerte an der Art |
| 17a | P2 | foto | + `nutzer_id` (SET NULL) | Onboarding-Hinweise (SCHNITTSTELLEN Nr. 14) |
| 17 | P3 | foto | `hash` nur mit Regel „gleiches Foto → kein zweiter Aufruf“; `groesse_bytes` entfernen oder für SYS-04 behalten | kein Feld ohne Verwendung |
| 18 | P3 | quelle_bedarf | `wasser_l_tag` → `wasser_ml_tag` (int) | überall sonst ml, Fachlogik rechnet in ml |
| 19 | P3 | Konstanten | `QUANTITY_UNITS` (g, ml) vs. Fachlogik `QuantityUnit` mit `piece`: Produkt bleibt g/ml, `piece` nur für Nachkaufen (`RESTOCK_UNITS`) | Typen gleichziehen |

Richtig benannt und passend: `ziel`, `quelle_version`, `quelle_wert`, `warengruppe`, `behaelter`, `push_abo`, `erfassung_entwurf`, `einheit.status/entnommen_*/geprueft_am`, Better-Auth-Tabellen. Mandantenregel (haushalt_id an Haushaltstabellen, Kindtabellen über Eltern) bleibt; neue Tabellen `erfassung`, `ki_verbindung`, `ki_rollen_zuweisung` bekommen `haushalt_id`.

---

## 5. Abgleich mit der Fachlogik auf `main`

| Nr. | Datei / Funktion | Anpassung | Grund |
|---|---|---|---|
| 1 | `inventory/domain/unit.ts` `StockUnit.bestBefore` | `BestBefore \| null` | #116 |
| 2 | `supply/domain/supply-rules.ts` `isCountedOn` | Stichtag-Art übergeben (`{ day, isToday }` oder zwei Funktionen). `mhd = null` zählt nur heute. „Noch gut“ zählt nur heute, **nie am Zieldatum** | #116, #117. **Heute falsch:** mit `stillGoodCounts = true` zählt eine geprüfte Packung auch am Zieldatum |
| 3 | `supply-rules.ts` `STILL_GOOD_COUNTS_AS_SUPPLIED` | Konstante und Standardparameter entfernen, Wert ist Pflichteingabe aus `haushalt_einstellung` | #117, sonst kann der Schalter still übergangen werden |
| 4 | `supply-days.ts` `containsEstimates` | ersetzen durch `estimatedKcal` bzw. Anteil, damit die 10-%-Regel rechenbar ist; MHD-Schätzungen nicht mehr einrechnen („ca.“ betrifft kcal) | UX §4, A18 |
| 5 | `inventory/domain/unit-state.ts` `unitStateFor` | Eingabe `CalendarDay \| null`, neuer Zustand `no-date` (keine Ampel) | #116, A11 |
| 6 | neu: Zeitgruppen | `timeGroupFor(unit, today, thresholds)` mit fester Stufe 7 Tage | A11, UX §5 |
| 7 | `inventory/domain/fifo.ts` `pickFifoUnit` | Packungen ohne Datum nach den datierten (Frage 7) | #116 |
| 8 | `inventory/domain/group-units.ts` | Gruppe „Datum fehlt“, Formatierung ohne Datum | Detail, Bald fällig |
| 9 | `capture/domain/estimates.ts` `fillMissingNutrition` | Quelle ist der Richtwert der **Lebensmittelart**, inkl. Makros; Ergebnis mit Herkunft je Produkt | #110, #115 |
| 10 | `estimates.ts` `estimateBestBeforeOnRequest` | Haltbarkeit der Lebensmittelart statt Kategorie; ob die Funktion bleibt, hängt an Frage 3 | #110 vs. #116 |
| 11 | `capture/domain/plausibility.ts` | `typicalShelfLifeDays` aus der Lebensmittelart (nur Kommentar/Quelle) | #110 |
| 12 | `supply/domain/group-targets.ts` / `diet-shifts.ts` | Die DB speichert Mengen **je Ernährungsform** (`quelle_wert.ernaehrungsform`), die Fachlogik erwartet Verschiebungsregeln. Eins wählen: Vorschlag DB-Zeilen je Form, Fachlogik wählt nur aus; `targetsForDiet`/`validateDietShifts` nur noch im Seed-Werkzeug oder streichen | doppelte Wahrheit |
| 13 | `supply/domain/daily-need.ts` | unverändert, wenn `quelle_bedarf.personengruppe = MEMBER_TYPES`. Mapping Englisch ↔ DB-Werte im Repository | – |
| 14 | `supply/domain/goal-progress.ts` | `target-in-past` → Ergebnis „kein gültiges Zieldatum“ statt Fehler, damit die Übersicht ohne Zielzeile weiterrechnet | A3 Sonderfall |
| 15 | `supply/domain/stats.ts` `compareOutcomes` | zusätzlich je Monat und kcal | A15 |
| 16 | neu: Summen je Knoten | `summarizeNode(units, need)` → Packungen, Menge, kcal, Makros, Tage, nächstes MHD, Richtwert-Anteil, Anzahl ohne Datum | A8 |
| 17 | neu: nächster Schritt | `nextStep(goalProgress, need)` → Engpass und Fehlmenge | A4 |
| 18 | neu: Ersetzen | `replacementCandidates(units, history, targetDay)` | A14 |
| 19 | `auth/domain/user-rules.ts` `removeUser` | entfernen (kein Löschweg), knip würde ihn sonst nach Wegfall der Nutzung melden | Einstellungen §3.1 |
| 20 | `shared/lib/quantities.ts` | `piece` nur für Nachkaufen, siehe §4 Nr. 19 | Typen |
| 21 | neu: MHD-Zweitversuch | reine Funktion `needsSecondAttempt(result)` und `mergeAttempts(first, second)` (§8.3) | #114, testbar ohne Adapter |

---

## 6. Historie und Verlauf

**Empfehlung: keine Ereignis- und keine Snapshot-Tabelle im MVP.** Die Einheit ist selbst das Ereignis.

| Vorgang | Gespeichert | Nutzen |
|---|---|---|
| Erfassen | `einheit` mit `created_at`, `erfassung_id` → `erfassung(nutzer_id, weg)` | Verlauf „hinzugefügt von …“, A16 |
| Verbraucht / Entsorgt | `status`, `entnommen_am` (Zeitpunkt), `entnommen_von` | ROT-07, A15, A17, A14 |
| Rückgängig (5 s und später) | `status = vorrat`, `entnommen_*` = leer. Ein mit angelegter Nachkauf-Eintrag wird mit entfernt | P7. Wer zurücknimmt, wird nicht gespeichert (bewusst) |
| Noch gut | `geprueft_am` | Anzeige, A1 mit Schalter |
| Datum ändern / nachtragen | `mhd`, `mhd_genauigkeit`, `mhd_geschaetzt` überschrieben | Korrektur, keine Historie nötig |
| Produkt bearbeiten | Werte überschrieben, `naehrwerte_quelle = manuell` | Statistik rechnet mit korrigierten Werten (gewollt: Fehler werden mitkorrigiert) |
| Endgültig löschen (Admin) | Produkt, Einheiten, Fotos weg | verschwindet bewusst auch aus der Statistik (Fehlerfassung) |

Folgen und Grenzen:
- A15 rechnet Mengen mit den **heutigen** Produktwerten. Das ist richtig, solange Bearbeiten nur Fehler korrigiert. Eine Momentaufnahme (`menge_bei_entnahme`) erst, wenn angebrochene Packungen (VOR-08) kommen.
- A16 (später) rechnet mit dem heutigen Bedarf. Ein Haushalt, der wächst, sieht seine Vergangenheit „kürzer“. Hinweis im Chart genügt.
- Ein Ereignis-Log (`vorrat_ereignis`) wird erst nötig für Inventur-Korrekturen (ROT-08) oder Teilentnahmen (VOR-08), beides später.
- SYS-05 „Historie archivieren“ (später) löscht Einheiten mit `status ≠ vorrat` vor Datum X. Dann vorher Monatssummen als Tabelle `statistik_monat` sichern, sonst bricht A15. Erst mit SYS-05 anlegen.

---

## 7. Export und Backup

| Inhalt | JSON-Export (SYS-01, MVP) | CSV (SYS-02, später) | Backup `pg_dump` |
|---|---|---|---|
| Haushalt, Einstellungen, Ziel, aktive Quellen-Version (als `schluessel` + `stand`) | ja | – | ja |
| Mitglieder (Name, Typ, Ernährungsform) | ja | – | ja |
| Eigene Kategorien, Lebensmittelarten, Lagerorte | ja, vollständig | – | ja |
| System-Stammdaten (Warengruppe, System-Kategorie/-Art, Behälter, Quellenwerte) | **nur als Schlüssel-Verweis** | – | ja |
| Produkte, Einheiten inkl. `created_at`, `entnommen_*`, Historie | ja | eine Zeile je Packung | ja |
| Nachkaufen | ja | – | ja |
| Nutzer: Anzeigename, Benutzername, Rolle, aktiv, Verknüpfung | ja | – | ja |
| Foto-Metadaten (Rolle, Zuordnung) | ja, ohne Pfad | – | ja |
| Fotos (Dateien) | **nein** (später ZIP-Variante) | – | ja (Ordner) |
| KI-Verbindungen: Name, Anbieter, Rollen-Zuweisung | ja, **ohne** Schlüssel | – | ja (Chiffrat) |
| Passwort-Hashes (`konto.password`), Sitzungen, `verifizierung`, `anmelde_sperre` | **nie** | – | ja |
| API-Schlüssel (auch nicht als Chiffrat, IV, Tag, Hinweis) | **nie** | – | Chiffrat ja, `APP_SECRET` nein |
| Push-Abos (Endpoint, Schlüssel) | **nie** (gerätegebunden, Zugangsdaten) | – | ja |
| Entwürfe, `ki_aufruf`, technische `email` | nein (flüchtig bzw. technisch) | – | ja |

Begründung für Schlüssel-Verweise: Ein Import in eine frische Installation trifft so die Seed-Zeilen mit anderen UUIDs.

---

## 8. Schnittstellen

Grundsätze:
1. **Lesen** passiert in Server Components über Query-Services der Anwendungsschicht, **Schreiben** über Server Actions. Routen unter `/api/` nur für Dateien, Push, Health und Better Auth.
2. Jede Action gehört zu einem Screen oder Ablauf (Spalte „Screen“), jeder Screen hat seine Actions. Actions sind dünn: Zod-Schema prüfen → `requireSession()`/`requireAdmin()` → Use-Case. Die Use-Cases sind die spätere Grundlage einer offenen API (§8.6).
3. Ergebnis jeder Action: `{ ok: true, value } | { ok: false, error: { kind, field? } }` (wie `shared/lib/result.ts`). Fremde IDs ergeben `not-found`, nie `forbidden` (verrät nichts). Gemeinsame Fehler: `unauthenticated`, `forbidden` (Rolle), `not-found`, `validation` (mit Feld), `conflict` (Zustand hat sich geändert).
4. Schemas stehen einmal in `features/*/domain/*.schema.ts` und dienen Formular, Action und KI.

### 8.1 Abgleich mit `technik.html` (Schnittstellen intern)

| Bisher | Jetzt | Grund |
|---|---|---|
| `consumeUnitAction`, `discardUnitAction` | `takeOutUnitsAction` mit `outcome` + `undoTakeOutAction` | eine Logik, Mehrfachauswahl am PC, Rückgängig (P7) |
| `createCategoryAction` (Erfassen) | `createFoodTypeAction` im Erfassen, Kategorie nur in den Einstellungen | #110, ERF-13 später |
| `inviteUserAction`, `removeUserAction` | `createUserAction` (Passwort einmalig), kein Entfernen, `setUserActiveAction` | Anmeldung (05), Einstellungen §3 |
| `saveMySettingsAction` | `updateOwnProfileAction`, `changeOwnPasswordAction` | keine persönlichen Einstellungen |
| `saveHouseholdSettingsAction` (alles) | aufgeteilt nach Bereich | kleine Schemas, klare Rechte |
| – | neu: Ersteinrichtung, Nährwerte schätzen, „Datum fehlt“ nachtragen, Noch-gut zurücknehmen, KI-Verbindungen, Rollen-Zuweisung, Nachkaufen ausblenden, Wiedererkennen | Entscheidungen 2026-11-22, UX-Konzept |
| `/api/recognize` | bleibt, Rolle aus fester Liste, Antwort inkl. Plausibilität | #110, #114 |

### 8.2 Server Actions je Screen

Rechte: **A** Admin · **M** Mitglied · **öff.** ohne Anmeldung. Eingabe als Zod in Stichworten (`?` = optional).

**Anmelden, Ersteinrichtung (ERS)**

| Action | Screen | Eingabe | Ausgabe | Rechte | Fehler |
|---|---|---|---|---|---|
| `setupAdminAction` | Einrichtung 1 | `{ anzeigename: str 1–60, benutzername: Username, passwort: Password }` | `{ nutzerId }` + Sitzung | öff., nur solange 0 Nutzer | `already-set-up`, `validation` (Sperrliste, Länge) |
| `setupHouseholdAction` | Einrichtung 2 | `{ erwachsene: int ≥0, kinder: int ≥0, babys: int ≥0 }` (Summe ohne Babys ≥ 1) | `{ mitgliedIds }` | A | `no-counted-member` |
| `saveGoalAction` | Einrichtung 3, Einstellungen Ziel | `{ tage: int 1–365, zieldatum?: date ≥ heute }` | `{ ziel }` | A | `target-in-past` |
| `completeSetupAction` | Einrichtung 4 | `{}` | – | A | – |
| `signInAction` | Anmelden | `{ benutzername, passwort, angemeldetBleiben: bool }` | Weiterleitung | öff. | `invalid-credentials` (neutral, auch für deaktiviert), `throttled { sekunden }` |
| `signOutAction` | Konto | `{ ueberall: bool }` | – | A, M | – |

**Konto und Gerät**

| Action | Eingabe | Ausgabe | Rechte | Fehler |
|---|---|---|---|---|
| `updateOwnProfileAction` | `{ anzeigename }` | – | A, M | `validation` |
| `changeOwnPasswordAction` | `{ altesPasswort, neuesPasswort: Password }` | – (andere Sitzungen enden) | A, M | `wrong-password`, `validation` |
| `confirmAiNoticeAction` | `{}` | `{ bestaetigtAm }` | A, M | – |
| Route `POST/DELETE /api/push/subscribe` | `{ endpoint: url, keys: { p256dh, auth }, geraet? }` | 204 | A, M | `validation` |

**Nutzerverwaltung (A)**

| Action | Eingabe | Ausgabe | Fehler |
|---|---|---|---|
| `createUserAction` | `{ anzeigename, benutzername, rolle, mitgliedId?, passwort?: Password }` (leer = erzeugen) | `{ nutzerId, passwortEinmalig: string }` – nur in dieser Antwort, nie geloggt, nie in der URL | `username-taken`, `validation` |
| `resetPasswordAction` | `{ nutzerId, passwort?: Password }` | `{ passwortEinmalig }`; beendet alle Sitzungen, hebt Sperre auf | `not-found` |
| `setUserRoleAction` | `{ nutzerId, rolle }` | – | `last-admin` |
| `setUserActiveAction` | `{ nutzerId, aktiv: bool }` | – (deaktiviert: Sitzungen und Push-Abos weg) | `last-admin`, `cannot-deactivate-self` |
| `revokeUserSessionsAction` | `{ nutzerId }` | – | `not-found` |
| `linkMemberAction` | `{ nutzerId, mitgliedId: uuid \| null }` | – | `not-found` |

**Einstellungen Haushalt** (A ändert, M liest)

| Action | Eingabe | Ausgabe | Fehler |
|---|---|---|---|
| `saveHouseholdAction` | `{ name, standardErnaehrungsform }` | – | `validation` |
| `saveMemberAction` | `{ id?, name, typ, ernaehrungsform: Diet \| null }` | `{ mitgliedId }` | `no-counted-member` (letzte Person mit Bedarf würde Baby) |
| `removeMemberAction` | `{ id }` | – | `no-counted-member` |
| `saveRotationSettingsAction` | `{ ampelGelbTage, ampelOrangeTage, nochGutZaehltMit: bool }` | – | `urgent-above-soon`, `validation` |
| `saveReminderSettingsAction` | `{ wochenuebersichtAktiv, wochentag: 1–7, uhrzeit: HH:MM, dringendAktiv }` | – | `validation` |
| `createCategoryAction` / `updateCategoryAction` | `{ name, warengruppeId }` / `{ id, name?, warengruppeId?, ausgeblendet?, sortierung? }` | `{ id }` | `system-not-editable` (nur ausblenden), `name-taken` |
| `createFoodTypeAction` | `{ name, kategorieId, kcal100?, … }` – **auch im Erfassen** | `{ id, schluessel }` | `name-taken` · Rechte: A, M (Vorschlag, Frage 9) |
| `updateFoodTypeAction` | `{ id, name?, kategorieId?, ausgeblendet?, richtwerte? }` | – | `system-not-editable` |
| `createStorageLocationAction` | `{ name }` – auch im Erfassen | `{ id }` | `name-taken` · Rechte: A, M (Frage 9 Einstellungen) |
| `updateStorageLocationAction` | `{ id, name?, ausgeblendet?, sortierung? }` | – | `name-taken` |

**Einstellungen Foto-Erkennung** (A; M sieht nur an/aus)

| Action | Eingabe | Ausgabe | Fehler |
|---|---|---|---|
| `setAiEnabledAction` | `{ aktiv: bool }` | – | `no-connection` (einschalten ohne Verbindung) |
| `createAiConnectionAction` | `{ anbieter: 'anthropic', name, schluessel: str }` | `{ id, schluesselHinweis: '…4f2a' }` – Klartext nie zurück | `validation` |
| `replaceAiKeyAction` | `{ id, schluessel }` | `{ schluesselHinweis }` | `env-connection-locked` |
| `deleteAiConnectionAction` | `{ id }` | – (Zuweisungen fallen auf `.env` bzw. „nicht eingerichtet“) | `env-connection-locked`, `in-use` (Hinweis, welche Rollen betroffen) |
| `testAiConnectionAction` | `{ id \| 'env' }` | `{ status: ok \| schluessel_ungueltig \| kein_guthaben \| zeitueberschreitung \| fehler, getestetAm }` | – (Ergebnis ist der Status) |
| `assignAiRoleAction` | `{ rolle: AiRole, verbindungId: uuid \| 'env', modell: AiModel, aktiv?: bool }` | – | `model-not-supported` (Anbieter kennt Modell nicht) |
| `resetAiRolesAction` | `{ rollen?: AiRole[] }` (leer = alle) | Zuweisungen = Empfehlung (Haiku 5.5, `mhd_zweitversuch` Sonnet 5.5) | – |

**Erfassen** (A, M)

| Action / Route | Eingabe | Ausgabe | Fehler |
|---|---|---|---|
| `POST /api/photos` | multipart `{ datei, rolle, ziel: { entwurfId? } \| { produktId } }` | `{ fotoId, entwurfId? }`; verkleinert, EXIF weg, Vorschau | `too-large`, `not-an-image`, `not-found` |
| `POST /api/recognize` | `{ fotoId, rolle: verpackung \| naehrwerte \| mhd }` | `{ vorschlag (Schema A/B/C), bewertung (Plausibilität), versuche: 1 \| 2 }` | `ai-disabled`, `ai-not-configured`, `notice-not-confirmed`, `provider-error`, `timeout` → App bietet „Von Hand weiter“ |
| `estimateNutritionAction` | `{ lebensmittelartId, entwurfId?, fotoId? }` | `{ werte, herkunft: 'richtwert' \| 'ki_schaetzung' }` – muss im Formular gesondert bestätigt werden | `ai-disabled` (dann nur Richtwert), `no-basis` |
| `matchProductsAction` | `{ lebensmittelartId, inhaltWert, inhaltEinheit, behaelterId? }` | `{ produkte: [{ id, label, lagerort }] }` („Zu Spaghetti 500 g hinzufügen?“) | – |
| `saveDraftAction` | `{ entwurfId, daten: CaptureDraftSchema }` | `{ gespeichertAm }` | `not-found` (fremder Entwurf) |
| `discardDraftAction` | `{ entwurfId }` | – (erst DB, dann Dateien) | `not-found` |
| `createStockAction` | `{ erfassungId: uuid, entwurfId?, weg, produkt: { id } \| NewProduct, packungen: [{ mhd: date \| null, genauigkeit?, art, geschaetzt: bool, anzahl: int 1–99 }] }`; `NewProduct = { lebensmittelartId, bezeichnung?, inhaltWert > 0, inhaltEinheit, abtropfgewichtG?, behaelterId?, lagerortId?, naehrwerte?: { kcal, eiweiss, kh, fett } \| null, naehrwerteQuelle? }` | `{ produktId, einheitIds, versorgtVorher, versorgtNachher }`; zweiter Aufruf mit derselben `erfassungId` liefert dasselbe Ergebnis | `validation` (Feld), `not-found` (Art/Produkt fremd) |

**Vorrat, Detail, Bald fällig** (A, M; Löschen nur A)

| Action | Eingabe | Ausgabe | Fehler |
|---|---|---|---|
| `takeOutUnitsAction` | `{ auswahl: { einheitIds: uuid[] } \| { lebensmittelartId \| produktId, anzahl: int ≥1 } (FIFO), outcome: 'verbraucht' \| 'entsorgt', nachkaufen?: bool }` | `{ einheitIds, nachkaufEintragId? }` | `conflict` (nicht mehr im Vorrat), `not-enough-units` |
| `undoTakeOutAction` | `{ einheitIds, nachkaufEintragId? }` | – | `conflict` |
| `markStillGoodAction` / `undoStillGoodAction` | `{ einheitIds }` | `{ geprueftAm }` | `not-expired`, `use-by-date` (Verbrauchsdatum) |
| `setUnitsDateAction` („Datum ändern“, „Datum nachtragen“, „Datum fehlt“) | `{ einheitIds, mhd: date \| null, genauigkeit?, art, geschaetzt: bool }` | – | `validation` |
| `estimateBestBeforeAction` | `{ lebensmittelartId }` | `{ mhd, genauigkeit: 'tag', geschaetzt: true }` als Vorschlag | `no-typical-value` · siehe Frage 3 |
| `updateProductAction` | `{ produktId, bezeichnung?, lebensmittelartId?, inhalt?, abtropfgewichtG?, behaelterId?, lagerortId? }` | – | `validation` |
| `updateNutritionAction` | `{ produktId, naehrwerte: {…} \| null, quelle: 'tabelle' \| 'manuell' \| 'ki_schaetzung', fotoId? }` | – | `validation` |
| `deleteProductAction` | `{ produktId }` | – (DB, dann Dateien) | Rechte A, Rückfrage im UI |

**Nachkaufen** (A, M; endgültig entfernen nur A)

| Action | Eingabe | Ausgabe | Fehler |
|---|---|---|---|
| `addRestockItemAction` | `{ lebensmittelartId? , warengruppeId?, bezeichnung?, menge?, einheit? }` (mind. eins der ersten drei) | `{ id }` | `validation` |
| `setRestockStatusAction` | `{ ziel: { eintragId } \| { zielLuecke: { warengruppeId, menge, einheit } }, status: 'offen' \| 'erledigt' \| 'ausgeblendet' }` – speichert eine Ziel-Lücke erst hier | `{ eintragId }` | `not-found` |
| `deleteRestockItemAction` | `{ eintragId }` | – | Rechte A |
| „Gekauft und erfassen“ | keine Action: Link ins Erfassen mit `?art=…` bzw. `?produkt=…` | – | – |

**Daten und System**

| Route / Action | Eingabe | Ausgabe | Rechte |
|---|---|---|---|
| `GET /api/export?format=json` | – | Datei `preposaurus-export-JJJJ-MM-TT.json` (§8.4) | A |
| `GET /api/export?format=csv` | – | eine Zeile je Packung | A, später |
| `importDataAction` | Datei | Bericht | A, später |
| `GET /api/photos/[id]?groesse=vorschau\|voll` | – | Bild, `Cache-Control: private` | A, M, eigener Haushalt |
| `GET /api/health` | – | `200 { status: 'ok' }` bzw. `503 { status: 'db-unavailable' }` | öff., keine Daten, keine Version |

**Lesen je Screen** (Query-Services, keine Actions): Übersicht `getOverview` (A1–A5, A9, A11, A13) · Bald fällig `getDueUnits(gruppe?, sortierung)` · Vorrat `getGroupLevel`, `getFoodTypeLevel(warengruppe)`, `searchStock(filter)` · Detail `getFoodTypeDetail(id)` · Verlauf `getHistory(zeitraum, art?)` · Nachkaufen `getRestockList` · Statistik `getStatistics(zeitraum)` · Einstellungen je Bereich. Filter stehen in der URL (P14).

### 8.3 KI-Adapter

Eine Schnittstelle, ein Adapter je Anbieter (`server/adapters/ai/anthropic.ts`). Eingabe `{ rolle, bild?, kontext }`, Ausgabe nach Zod-Schema. Der Adapter liest Verbindung und Modell über einen zentralen Service aus `ki_rollen_zuweisung` (Vorrang `.env`). Gemeinsamer Prompt-Kopf: „Wenn ein Wert nicht sicher lesbar ist, setze null – schätze und erfinde nichts.“ (außer Rolle `naehrwerte_schaetzen`). Alle Felder Pflicht, Unlesbares ist `null` bzw. `unbekannt`. Lockeres KI-Schema ohne Grenzen, danach strenges Fach-Schema.

**A · Verpackung** (`verpackung`)
```
lebensmittelart   enum(Schlüssel der sichtbaren Arten des Haushalts) | null   ← ersetzt kategorie (#110)
bezeichnung       text | null   generisch, deutsch, ohne Marke; füllt bei null die Suche vor
behaelter         enum(behaelter.schluessel) | null
inhalt.wert       number | null
inhalt.einheit    g | ml | null
abtropfgewicht_g  number | null
sicherheit        hoch | mittel | niedrig
```
Die Liste wird je Aufruf gebaut (ausgeblendete Arten fehlen). Kategorie und Warengruppe leitet die App ab.

**B · Nährwerttabelle** (`naehrwerte`)
```
bezug             100g | 100ml | portion
portion_g         number | null      [neu] für toPer100
kcal              number | null
kj                number | null      [neu] für resolveKcal (nur kJ aufgedruckt)
eiweiss_g         number | null
kohlenhydrate_g   number | null
fett_g            number | null
sicherheit        hoch | mittel | niedrig
```

**B′ · Nährwerte schätzen** (`naehrwerte_schaetzen`, neu, nur nach Wahl „Keine Nährwerttabelle“ und nur, wenn die Art keinen Richtwert hat, siehe Frage 2)
```
Eingabe: Name der Lebensmittelart, Kategorie, optional Verpackungsfoto
kcal_100, eiweiss_100, kohlenhydrate_100, fett_100   number | null
begruendung       text (kurz, wird angezeigt)
```
Ergebnis immer „ca.“, `naehrwerte_quelle = ki_schaetzung`, gesondert zu bestätigen.

**C · MHD** (`mhd`, Zweitversuch `mhd_zweitversuch`)
```
roh_text      text | null
datum         JJJJ-MM-TT | null
genauigkeit   tag | monat | jahr | unbekannt
art           mhd | verbrauchen_bis | unbekannt
sicherheit    hoch | mittel | niedrig
```
Prompt: „ERFINDE NIEMALS EIN DATUM.“ Chargennummern und Uhrzeiten sind kein Datum.

**Zweitversuch Haiku → Sonnet** (#114, reine Funktion, §5 Nr. 21):
1. Versuch 1 mit Rolle `mhd`. Ist `datum = null` oder `sicherheit = niedrig` **und** `mhd_zweitversuch` aktiv, folgt Versuch 2 mit demselben Foto und dem Modell der Rolle `mhd_zweitversuch`.
2. Ergebnis: Hat Versuch 2 ein Datum → es gilt Versuch 2, dann `assessBestBefore` (Plausibilität). Hat nur Versuch 1 ein (unsicheres) Datum → Versuch 1 als „bitte prüfen“. Keiner → Chip „nicht lesbar“ mit „nochmal · eintippen · Datum fehlt“.
3. Widersprechen sich zwei Daten, gilt Versuch 2 mit „bitte prüfen“.
4. Beide Aufrufe stehen in `ki_aufruf` (`versuch` 1 und 2). Fehler oder Zeitüberschreitung bei 1 lösen Versuch 2 nicht aus (sonst doppelte Kosten bei Ausfall), es gilt die Wiederholregel aus `technik.html` (höchstens ein Retry bei 429/5xx).

### 8.4 Export und Import

```
{
  "format": "preposaurus-export",
  "formatVersion": 1,            // ändert sich nur bei inkompatiblem Aufbau
  "schemaVersion": "<letzte Migration>",
  "appVersion": "x.y.z",
  "exportiertAm": "ISO-8601",
  "haushalt": {…}, "einstellungen": {…}, "ziel": {…},
  "quelle": { "schluessel": "bbk-ble", "stand": "…" },
  "mitglieder": [], "nutzer": [], "lagerorte": [],
  "kategorien": [ eigene vollständig ], "lebensmittelarten": [ eigene vollständig ],
  "produkte": [ { …, "lebensmittelart": "spaghetti" | "<uuid eigener Art>", "behaelter": "dose" } ],
  "einheiten": [ { …, "created_at", "entnommen_am", "entnommen_von": "<benutzername>" } ],
  "erfassungen": [], "nachkaufen": [], "fotos": [ Metadaten ohne Pfad ],
  "ki": { "verbindungen": [ { "name", "anbieter" } ], "rollen": [ … ] }
}
```
- UUIDs bleiben erhalten, System-Stammdaten nur als `schluessel`. Datumswerte als ISO-Text, Mengen als Zahl mit Einheit.
- Was nicht hinein darf: §7 („nie“-Zeilen). Ein Test prüft, dass weder `password`, `token`, `schluessel_*`, `endpoint` noch die technische `email` im Export vorkommen.
- **Import (SYS-03, später):** zuerst nur in eine leere Installation (nach der Ersteinrichtung des Admins). Nutzer werden deaktiviert angelegt und brauchen „Passwort zurücksetzen“. `formatVersion` höher als bekannt → Abbruch mit Hinweis. Fotos nicht enthalten. Idempotent über UUIDs.

### 8.5 Externe Schnittstellen

| Schnittstelle | Richtung | Daten | Stand | Hinweise |
|---|---|---|---|---|
| Anthropic API | NAS → USA | verkleinertes Foto ohne EXIF, Prompt, Schema, Liste der Lebensmittelart-Schlüssel des Haushalts | MVP | nur über den Adapter, nur bei `ki_aktiv` und bestätigtem Hinweis. Keine Haushalts- oder Personendaten |
| Web-Push (VAPID, `web-push`) | NAS → Push-Dienst von Apple/Google/Mozilla → Gerät | Titel, kurzer Text, Ziel-URL. Verschlüsselt nach Web-Push-Standard, der Dienst sieht nur Metadaten | MVP | Inhalt sparsam halten: Zahlen und Gruppen, keine Namen von Personen. 404/410 → Abo löschen |
| SMTP (`nodemailer`) | NAS → Mailserver | – | **später** | Ohne E-Mail-Adresse am Konto gibt es im MVP keine Check-in-Mail (Einstellungen-Frage 2). SMTP-Konfiguration im MVP weglassen, damit keine leere Einstellung entsteht |
| `/api/health` | Docker/Monitor → NAS | nur Status | MVP | prüft DB-Verbindung. Für Uptime Kuma o. ä. geeignet |
| Offene API für Dritte (Home Assistant u. a.) | Dritte → NAS | – | **später** | siehe §8.6 |

### 8.6 Offene API (Empfehlung: später, nichts verbauen)

Nutzen: Home Assistant könnte „versorgt: 6 Tage“ und „3 bald fällig“ als Sensor zeigen oder eine Automation auslösen. Für das MVP nicht nötig.

Damit es später nur eine Ergänzung ist:
1. Fachregeln und Abfragen liegen in Use-Cases und Query-Services, nie in Actions oder Komponenten (gilt ohnehin, CP §2).
2. Später `GET /api/v1/summary` (versorgt, Ziel, Zähler je Zeitgruppe, größte Lücke) und `GET /api/v1/due` – zuerst **nur lesend**.
3. Anmeldung über **API-Token je Nutzer** (Tabelle `api_token`: `nutzer_id`, `name`, `token_hash`, `rechte` = `lesen`, `zuletzt_genutzt_am`, `widerrufen_am`). Token einmal anzeigen, nur Hash speichern (wie Passwörter). Wirkt nur im Tailnet.
4. Antworten mit Version im Pfad (`/v1/`), Schemas aus denselben Zod-Definitionen, daraus später OpenAPI erzeugen.
5. Kein Schreiben über die API, bevor Rechte und Rückgängig dafür geklärt sind.

---

## 9. Offene Fragen an den Maintainer

| Nr. | Frage | Empfehlung |
|---|---|---|
| 1 | **Lebensmittelart Pflicht am Produkt?** Dann entfällt `produkt.kategorie_id` (abgeleitet). | Ja. Das UX-Konzept verlangt sie ohnehin. Ohne Treffer führt „+ Neue Lebensmittelart“ (mit Kategorie) weiter |
| 2 | **Nährwert-Schätzung:** #115 sagt „KI schätzt bzw. Richtwert der Lebensmittelart“ und „gesondert bestätigen“ (`naehrwerte_bestaetigt_am`). Darf eine **unbestätigte** Schätzung gespeichert werden? | Nein. Bestätigen ist Teil des Speicherns (Pflicht-Haken im Schritt), dadurch entfällt `naehrwerte_bestaetigt_am`. Reihenfolge: Richtwert der Art (kostenlos, gleichbleibend), KI-Schätzung (`naehrwerte_schaetzen`) nur bei Arten ohne Richtwert. Richtwerte werden nicht ins Produkt kopiert, sondern live gelesen |
| 3 | **MHD-Schätzung:** 05 und #116 erlauben „Von der KI schätzen lassen“, #110 verbietet die übliche Haltbarkeit als MHD, und für das Schätzen gibt es keine KI-Rolle. Was ist gemeint? | Ohne aufgedrucktes Datum weiß auch die KI nur die übliche Haltbarkeit. Vorschlag: Schätzung = heute + übliche Haltbarkeit der Lebensmittelart, ausdrücklich gewählt, als „geschätzt“ markiert, ohne KI-Aufruf. #110 entsprechend lesen: „nie **automatisch** als MHD“ |
| 4 | **Mitglieder-Details** (Geburtsdatum, Geschlecht, Aktivität, Gewicht, schwanger/stillend) und **Allergien** im MVP-Schema? Einstellungen-Strang sagt „Felder bleiben“. | Nicht anlegen. Es sind Gesundheitsdaten ohne Verwendung im MVP. ZIEL-02 bzw. NK-06 bringen sie mit einer Migration zurück |
| 5 | **„Noch gut“ mit Schalter an:** Wie lange zählt eine geprüfte Packung heute mit? | Ohne Ablauf im MVP, aber nur für „heute“. Erklär-Blatt nennt die Zahl geprüfter Packungen. Später ggf. Konstante (30 Tage, UX-Frage 10) |
| 6 | **Nachkaufen:** Abgehakte und ausgeblendete Ziel-Lücken werden gespeichert. Wann verschwindet „Erledigt“, wann kommt eine ausgeblendete Lücke zurück? | „Erledigt“ 14 Tage sichtbar. Ausgeblendete Lücke kommt zurück, wenn sie sich um mehr als 10 % ändert oder nach 30 Tagen |
| 7 | **FIFO bei „Datum fehlt“:** zuerst oder zuletzt entnehmen? | Zuletzt, nach allen datierten Packungen. Der Filter „Unvollständig“ erinnert ans Nachtragen |
| 8 | **Ernährungsform-Daten:** Zielmengen je Form als fertige Zeilen (`quelle_wert` je Form, heute im Schema) oder als Verschiebungsregeln (heute in der Fachlogik)? | Fertige Zeilen je Form. Geprüfte Quelle, keine Rechnung zur Laufzeit. `diet-shifts` nur noch als Werkzeug zum Erzeugen der Seed-Zeilen |
| 9 | **Darf ein Mitglied beim Erfassen eine neue Lebensmittelart anlegen?** (Gegenstück zu Einstellungen-Frage 9 für Lagerorte) | Ja, mit Pflicht-Kategorie. Umbenennen, Ausblenden und Richtwerte bleiben beim Admin |
| 10 | **„Dringend“-Push:** Schwelle 7 Tage („Diese Woche“) oder Orange-Schwelle (28 Tage)? | 7 Tage. Orange ist „einplanen“, nicht dringend. Meldet nur Packungen, die seit dem letzten Versand in die Gruppe gerutscht sind |
| 11 | **Export ohne Fotos** im MVP? | Ja. Fotos sichert das Backup. Später eine ZIP-Variante „mit Fotos“ |
| 12 | **MHD-Fotos nach dem Bestätigen** behalten (ERF-15 sagt „Fotos speichern“)? | Behalten, zeigen bei „Datum ändern“. Speicher ist klein (≈ 150 kB je Foto) |
| 13 | **Offene API** für Home Assistant | Später, nur lesend, mit API-Token je Nutzer (§8.6). Im MVP nichts bauen, aber Use-Cases strikt von Actions trennen |
