# Preposaurus – Daten-, Auswertungs- und UX-Konzept

> Stand 2026-11-22 · Entwurf zur Freigabe · Schritte 1 und 2 aus Issue #111.
> Grundlage: Issues #110 und #111, `05_STATUS_ENTSCHEIDUNGEN.md`, `00`–`04`, `docs/konzept/features.html` (Kennungen wie UEB-01), `technik.html`, `design.html`, `dashboard-mockup.html`, `research/03`, `05`, `06`, `21`.
> Dieses Dokument legt **nichts Visuelles** fest (Farbe, Schrift, Flächenstil). Das folgt in Schritt 3. Alle Zahlen in Beispielen sind erfunden und keine Empfehlungswerte.

**Inhalt:** Teil 1 Daten und Auswertungen (§1–§5) · Teil 2 UX (§6–§12) · Abweichungen von `design.html` (§13) · Offene Fragen (§14)

## Kurzfassung

- **Eine Währung: Tage.** Jede Ebene des Baums und jeder Screen zeigt neben kg und kcal, wie viele Tage der Posten für diesen Haushalt beiträgt. So bleiben alle Zahlen vergleichbar.
- **Übersicht:** „Heute versorgt“ wird ein Satz mit zwei Balken (Essen, Wasser) auf einer Tages-Skala mit Zielmarke. Die Kachel nennt, was begrenzt, und den einen nächsten Schritt. Der Baum fliegt aus der Übersicht.
- **Bald fällig:** eigene Seite mit vier Zeitgruppen, die an den Ampel-Schwellen hängen. Jede Zeile hat „Verbraucht“ als sichtbaren Knopf. Rückgängig statt Rückfrage.
- **Vorrat:** Drilldown in zwei Tipps (Warengruppe → Lebensmittelart), Kategorien sind Zwischenüberschriften und keine eigene Ebene zum Aufklappen. Suche und Filter schalten auf eine flache Trefferliste um. Nirgends verschachtelte Dropdowns.
- **Erfassen:** ein Chip je Datum mit Anzahl ersetzt die Wahl zwischen „MHD-Serie“ und „alle gleich“. Ziel: neues Produkt per Foto in höchstens 8 Tipps, Nachschub in höchstens 5.

---

# Teil 1 · Daten- und Auswertungskonzept

## 1. Was der Nutzer erfasst und was die App ableitet

Grundregel: Der Nutzer liefert nur, was auf der Packung steht. Alles andere rechnet die App.

| Angabe | Woher | Pflicht | Gespeichert an | Daraus leitet die App ab |
|---|---|---|---|---|
| Lebensmittelart (z. B. Spaghetti) | Verpackungsfoto (KI wählt aus der Liste des Haushalts) oder Auswahl mit Suche | ja | Produkt → Lebensmittelart | Kategorie und Warengruppe (nie von der KI geraten, #110), Piktogramm, Richtwerte als Hinweis |
| Menge je Packung (g oder ml) | Verpackungsfoto oder Eingabe | ja | Produkt | Gesamtmenge, kcal je Packung |
| Behälter (Dose, Glas …) | Verpackungsfoto oder Auswahl | nein | Produkt | Filter „Alle Dosen“ |
| Nährwerte je 100 g/ml: kcal, Eiweiß, Kohlenhydrate, Fett | Foto der Nährwerttabelle oder Eingabe | nein | Produkt | kcal und Makros je Packung und je Ebene, Tage |
| MHD je Packung, mit Genauigkeit und Art | MHD-Foto oder Eingabe | ja, siehe Frage 4 | Einheit | Zustand (gut, bald fällig, dringend, abgelaufen), Zählung am Zieldatum |
| Anzahl | Zähler am Datum | ja | Anzahl der Einheiten | Bestand |
| Lagerort | Auswahl, vorbelegt mit dem zuletzt genutzten | nein | Produkt | Filter, Sortierung beim Abarbeiten |
| Verbraucht, Entsorgt, Noch gut | ein Tipp an der Einheit | – | Einheit (Status, Datum, Nutzer, `geprueft_am`) | Historie, Statistik, Nachkauf-Vorschlag |
| Haushalt, Ziel, Quelle | Ersteinrichtung, Einstellungen | ja | Haushalt, Ziel | Tagesbedarf, Zielmengen je Warengruppe |

**Nie vom Nutzer verlangt:** Warengruppe, Kategorie, kcal je Packung, Summen, Tage, Ampel, Nachkauf-Mengen.

**Zwei Wege, ein Ergebnis.** Foto und manuelle Eingabe füllen dieselben Felder und nutzen denselben Speichervorgang. KI-Werte sind Vorschläge und werden erst nach Bestätigung zum Vorrat. Ist ein Wert nicht lesbar, bleibt das Feld leer. Ein Datum wird nie erfunden.

**Wiedererkennen statt doppelt anlegen.** Passen Lebensmittelart, Menge und Behälter zu einem vorhandenen Produkt, schlägt die App vor: „Zu Spaghetti 500 g hinzufügen?“ Dann entfallen Verpackungs- und Nährwertschritt, es fehlen nur noch Datum und Anzahl.

## 2. Der Baum und wo jede Ebene auftaucht

`Warengruppe → Kategorie → Lebensmittelart → Produkt → Einheit`
Beispiel: Getreide, Kartoffeln → Nudeln → Spaghetti → Spaghetti 500 g Packung → Packung mit MHD 03/2028

| Ebene | Wofür sie da ist | Wer pflegt | Wo sie in der UI auftaucht | Wo bewusst nicht |
|---|---|---|---|---|
| **Warengruppe** | Rechenebene der Quelle (BBK/BLE): Zielmenge und Abdeckung | System | Übersicht (Abdeckung), Vorrat Ebene 1, Nachkaufen (Lücke), Statistik | Erfassen: wird nur als abgeleiteter Pfad angezeigt |
| **Kategorie** | Ordnung innerhalb der Warengruppe, Zwischensumme | System, eigene möglich | Vorrat als Zwischenüberschrift und Sprungchip, Pfadzeile, Filter | kein eigener Screen, keine Kachel in der Übersicht |
| **Lebensmittelart** | Das, was man im Kopf hat („Spaghetti“). Ebene für Suche, KI-Zuordnung, Nachkaufen, Richtwerte | Startliste, eigene möglich | Zeile im Vorrat, Detailseite, Bald fällig, Nachkaufen, Erfassen | – |
| **Produkt** | Konkrete Packung: Menge, Behälter, Nährwerte, Fotos, Lagerort | Nutzer beim Erfassen | Abschnitt auf der Detailseite der Lebensmittelart. Gibt es nur ein Produkt, wird die Ebene nicht als eigene Stufe gezeigt | keine eigene Listenebene im Vorrat |
| **Einheit** | Eine Packung mit eigenem MHD und Status | Nutzer | Detailseite (gebündelt nach Datum: „03/2028 · 2×“), Bald fällig, Verlauf | nie einzeln in Summenansichten |

Regeln für die Anzeige:
- **Pfadzeile** statt Baum: Wo der Zusammenhang nötig ist, steht eine Zeile „Getreide › Nudeln › Spaghetti“. Jeder Teil ist antippbar.
- **Jede Ebene zeigt dieselben Kennwerte** in derselben Reihenfolge: Packungen · Menge (kg bzw. l) · kcal · Beitrag in Tagen · nächstes MHD. Makros stehen eine Stufe tiefer (Tipp auf kcal).
- **Merkmale liegen quer zum Baum:** Behälter, Lagerort und Zustand sind Filter, keine Ebenen.

## 3. Auswertungen

Gemeinsame Regeln für alle Rechnungen:
- Gezählt werden nur Einheiten mit Status `vorrat`, die am Stichtag haltbar sind. Stichtag ist heute oder das Zieldatum.
- kcal einer Einheit = Menge × kcal je 100 ÷ 100. Makros genauso.
- Beitrag in Tagen = kcal ÷ Tagesbedarf des Haushalts.
- Alle Rechnungen sind reine Funktionen (M2), die Screens rechnen nichts selbst.

| Nr. | Frage des Nutzers | Rechnung | Datenquelle | Wo angezeigt | Stand |
|---|---|---|---|---|---|
| A1 | Wie lange reicht unser Vorrat heute? | min(Σ kcal ÷ kcal-Bedarf, Σ Liter Wasser ÷ Wasserbedarf), Stichtag heute | Einheit, Produkt, Mitglieder, `quelle_bedarf` | Übersicht Kopfkachel, Wochenübersicht, Statistik | MVP (UEB-01) |
| A2 | Was begrenzt uns? | Der kleinere der beiden Werte aus A1, dazu der Abstand zum anderen | wie A1 | Kopfkachel („begrenzt durch Wasser“), Erklär-Blatt | MVP |
| A3 | Schaffen wir das Ziel am Zieldatum? | wie A1 mit Stichtag Zieldatum, dazu Liste der Einheiten, die vorher ablaufen | wie A1, `ziel` | Kopfkachel zweite Zeile, Bald fällig (Gruppe „bis zum Ziel“) | MVP (UEB-02) |
| A4 | Was bringt mich am schnellsten weiter? | Fehlmenge des Engpasses bis zum Ziel: (Zieltage − Ist-Tage) × Tagesbedarf, als Liter bzw. kcal | A1, A3 | Kopfkachel „Nächster Schritt“, erster Eintrag in Nachkaufen | MVP, neu |
| A5 | Wie viel Energie lagert insgesamt? | Σ kcal, dazu Tagesbedarf | Einheit, Produkt | Übersicht Kachel Nährwerte, Erklär-Blatt | MVP |
| A6 | Wie viel Eiweiß, Kohlenhydrate, Fett? | Σ Gramm je Makro und Anteil an den kcal (Eiweiß und Kohlenhydrate × 4, Fett × 9) | Produkt-Nährwerte | Übersicht Kachel Nährwerte, jede Baumebene | MVP als Summe, siehe Frage 2 |
| A7 | Reicht ein Makro kürzer als die Energie? | Σ Gramm ÷ Tagesbedarf je Makro, Hinweis bei Abstand | A6, DGE-Bedarfswerte | Kachel Nährwerte als Hinweiszeile | später (UEB-07, Bedarfswerte ungeprüft) |
| A8 | kcal, Makros, Menge je Warengruppe, Kategorie, Lebensmittelart, Produkt | A5 und A6 je Knoten, dazu Packungen, kg bzw. l, Beitrag in Tagen, nächstes MHD | wie A5 | Vorrat auf jeder Ebene, Detailseite | MVP |
| A9 | Sind wir gegenüber der BBK-Empfehlung ausgewogen? | je Warengruppe: Bestand (kg bzw. l) ÷ (Menge je Person und Tag × Personen × Zieltage), als Prozent und „X von Y Tagen“. Knappste Gruppe wird benannt | Einheit, `quelle_wert`, Ernährungsform | Übersicht Kachel Warengruppen, Vorrat Ebene 1, Statistik | MVP (UEB-03, STA-01) |
| A10 | Haben wir genug Wasser? | Liter ÷ Wasserbedarf je Tag, Fehlmenge bis zum Ziel in Litern. Andere Getränke stehen daneben, zählen aber nicht in die Wasser-Tage | Einheiten der Warengruppe Wasser | Kopfkachel (zweiter Balken), Erklär-Blatt, Nachkaufen | MVP (UEB-04) |
| A11 | Was muss bald weg? | Zustand je Einheit aus MHD und Schwellen, gezählt je Zeitgruppe | Einheit, `haushalt_einstellung` | Übersicht Kachel Bald fällig, Seite Bald fällig, Push „Dringend“ | MVP (UEB-05, ROT-01) |
| A12 | Was ist abgelaufen und noch nicht entschieden? | MHD vor heute und Status `vorrat` | Einheit | Seite Bald fällig, erste Gruppe | MVP |
| A13 | Was fehlt bis zum Ziel? | je Warengruppe: Zielmenge − Bestand am Zieldatum, in kg bzw. l. Wasser zuerst | A9, A3 | Nachkaufen, Übersicht Kachel Nachkaufen | MVP (NK-01) |
| A14 | Was muss ich ersetzen? | Einheiten, die vor dem Zieldatum ablaufen, und zuletzt verbrauchte Lebensmittelarten ohne Restbestand | Einheit, Historie | Nachkaufen Abschnitt „Ersetzen“ | MVP, Teil von NK-02 |
| A15 | Wie viel haben wir verbraucht und entsorgt? | Σ Einheiten, kg und kcal je Status und Monat, Anteil entsorgt | Einheit (`status`, `entnommen_am`) | Statistik | MVP (STA-03) |
| A16 | Wie hat sich „Tage versorgt“ entwickelt? | A1 für vergangene Stichtage, zurückgerechnet aus Anlagedatum, Entnahmedatum und MHD | Einheit mit Zeitstempeln | Statistik als Verlaufslinie | später. Braucht keine eigene Tabelle, solange jede Einheit ihr Anlagedatum behält |
| A17 | Was entsorgen wir immer wieder? | Entsorgte Einheiten je Lebensmittelart über 12 Monate | Historie | Statistik, Hinweis in Nachkaufen („zuletzt 3× entsorgt“) | später |
| A18 | Wie verlässlich sind die Zahlen? | Anteil der kcal aus Richtwerten, Zahl der Produkte ohne Nährwerttabelle, Einheiten ohne genaues Datum | Produkt, Einheit | Erklär-Blatt, Filter „Unvollständig“ | MVP (UEB-01, drittes Kriterium) |
| A19 | Was liegt wo? | Bestand je Lagerort | Produkt | Filter und Gruppierung im Vorrat | MVP (VOR-05) |

**Nicht als Auswertung:** Punkte, Serien, Ranglisten, Kosten. Die Recherche rät von täglichen Serien ab (`research/21`), STA-04 bleibt „später“.

## 4. Datenqualität: fehlende und geschätzte Werte

Jede Zahl hat eine von drei Herkünften: **vom Etikett** (Foto bestätigt oder eingetippt), **Richtwert** (kcal der Lebensmittelart, weil die Nährwerttabelle fehlt) oder **fehlt**.

| Fall | Was die App rechnet | Wie es sichtbar wird |
|---|---|---|
| Nährwerte fehlen | kcal und Makros mit dem Richtwert der Lebensmittelart | Am Produkt steht „Nährwerte: Richtwert“. Summen mit Richtwert-Anteil tragen ein „ca.“ |
| Lebensmittelart hat keinen Richtwert (eigene Art) | Posten zählt mit 0 kcal | Am Produkt „Nährwerte fehlen“, im Erklär-Blatt „zählt noch nicht mit“ |
| Menge fehlt | Speichern nicht möglich | Hinweis am Feld |
| MHD nur als Monat oder Jahr | Monatsende bzw. 31.12. | Anzeige als „09/2027“ bzw. „2027“, nie als erfundener Tag |
| MHD fehlt | siehe Frage 4. Empfehlung: zählt heute, nicht am Zieldatum | Chip „Datum fehlt“, Filter „Unvollständig“ |
| KI unsicher | nichts, es ist ein Vorschlag | „bitte prüfen“ nur in der Erfassung, nicht danach |

So bleibt es ruhig:
1. **Ein Zeichen, überall gleich:** „ca.“ vor einer Zahl heißt „enthält Richtwerte“. Kein Symbol, keine Farbe.
2. **Schwelle an der Kernzahl:** „Heute versorgt“ bekommt das „ca.“ erst, wenn mehr als 10 % der kcal aus Richtwerten stammen. Darunter steht der Anteil nur im Erklär-Blatt.
3. **Erklärung per Tipp:** „8 von 31 Produkten haben keine Nährwerttabelle. Das betrifft etwa 12 % der kcal.“ Darunter ein Knopf „Angaben ergänzen“.
4. **Ein Sammelort:** Filter „Unvollständig“ im Vorrat. Jede Zeile hat genau eine Aktion, etwa „Nährwerttabelle fotografieren“.
5. **Keine Mahnung:** kein Zähler am Dock, kein Push, keine Sperre. Die Wochenübersicht nennt es höchstens in einer Zeile.
6. **Richtwert zur Haltbarkeit:** nur als Hinweistext auf der Detailseite („üblich etwa 2 Jahre haltbar, Richtwert“). Er wird nie als MHD gespeichert (#110).

## 5. Folgen für Datenmodell und Fachlogik

Für die laufenden Pakete M1 und M2, soweit dieses Konzept etwas Neues verlangt:
- **Summen je Knoten** (A8): eine Funktion, die für einen beliebigen Knoten des Baums Packungen, Menge, kcal, Makros, Tage, nächstes MHD und Richtwert-Anteil liefert.
- **Herkunft der Nährwerte:** `naehrwerte_geschaetzt` genügt. Für „fehlen ganz“ reicht die Kombination aus leerem Produktwert und leerem Richtwert.
- **Zeitgruppen** (A11): Funktion „Einheit → abgelaufen, bis 7 Tage, bis Orange-Schwelle, bis Gelb-Schwelle, später“. Die 7 Tage sind neu und fest.
- **Nächster Schritt** (A4): Funktion, die den Engpass und die Fehlmenge bis zum Ziel liefert.
- **Nachkauf-Eintrag** verweist auf Warengruppe oder Lebensmittelart, nicht auf ein Produkt.
- **Verlauf** (A16) ohne Schnappschuss-Tabelle, wenn `created_at`, `entnommen_am` und `mhd` an der Einheit erhalten bleiben.
- **Vorbelegungen:** zuletzt genutzter Lagerort und Erfassungsweg (Foto oder manuell) je Nutzer in `nutzer_einstellung`.

---

# Teil 2 · UX-Konzept

## 6. Informationsarchitektur und Navigation

Vier Bereiche plus eine Handlung. Die Tabs bleiben wie beschlossen, „Neu“ heißt hier „Erfassen“ und ist ein Knopf, kein Tab.

| Ziel | Frage | Häufigkeit |
|---|---|---|
| **Übersicht** | Wie stehen wir da, was ist als Nächstes dran? | bei jedem Öffnen |
| **Vorrat** | Was haben wir, wo ist es, was nehme ich raus? | beim Kochen, beim Einräumen |
| **Erfassen** (Knopf) | Neues eintragen | nach dem Einkauf |
| **Nachkaufen** | Was fehlt? | vor dem Einkauf |
| **Statistik** | Wie lief es über die Zeit? | selten |
| Einstellungen (Zahnrad bzw. unten in der Seitenleiste) | Haushalt, Ziel, Konto | sehr selten |

### Je Gerät

| Gerät | Stufe | Navigation | Inhalt |
|---|---|---|---|
| iPhone, Duo zugeklappt | kompakt | Dock unten: Übersicht · Vorrat · **Erfassen** (Mitte, betont) · Nachkaufen · Statistik. Zahnrad oben rechts. Unterseiten haben oben links „Zurück“ mit dem Namen des Ziels | eine Spalte. Details sind eigene Seiten, kurze Aktionen ein Blatt von unten |
| Duo aufgeklappt hochkant | mittel | Dock unten wie kompakt | Liste oben, Detail unten. Nichts Antippbares auf der Falz |
| Duo aufgeklappt quer, schmales PC-Fenster | breit | schmale Leiste links mit denselben fünf Zielen, Einstellungen unten | Liste links, Detail rechts. Die Falz liegt zwischen den beiden Hälften |
| PC | weit | Seitenleiste links mit Beschriftung. „Bald fällig“ steht eingerückt unter Übersicht, weil Platz da ist. „Erfassen“ als Knopf oben in der Leiste | Vorrat dreispaltig: Warengruppen, Liste, Detail. Tabellen statt Karten, Mehrfachauswahl |

Regeln:
- **Gleiche Namen, gleiche Reihenfolge** auf allen Geräten. Nur die Anordnung wechselt.
- **Höchstens zwei Ebenen unter einem Tab.** Tiefer geht es nur über die Pfadzeile im Vorrat.
- **Jeder Screen hat eine Adresse.** Push, Mail und Zurück-Taste landen genau dort, auch Filter stehen in der Adresse. Auf- und Zuklappen ändert nur das Layout.
- **Erfassen läuft im Vollbild** ohne Dock, mit „Abbrechen“ oben links. Ab „breit“ bleibt die Seitenleiste, „Abbrechen“ steht trotzdem da (#285). Gehen dabei Eingaben verloren, fragt die App vorher ruhig nach.

### Sitemap

```
Anmelden
Ersteinrichtung (Konto · Haushalt · Ziel · Home-Bildschirm)

Übersicht
├─ Erklär-Blatt „So wird gerechnet“ (Essen · Wasser · Ziel · Datenqualität)
├─ Bald fällig
│   └─ Blatt „Einheit“ (Verbraucht · Entsorgt · Noch gut · Datum ändern)
├─ Nährwerte (kcal und Makros je Warengruppe)
└─ Abdeckung je Warengruppe → führt in den Vorrat

Vorrat
├─ Ebene 1: Warengruppen
├─ Ebene 2: Lebensmittelarten einer Warengruppe, gegliedert nach Kategorie
├─ Trefferliste (Suche oder Filter aktiv)
├─ Detail Lebensmittelart
│   ├─ Produkt bearbeiten (Menge, Behälter, Nährwerte, Lagerort, Fotos)
│   └─ Blatt „Einheit“
├─ Filter-Blatt (Behälter · Lagerort · Zustand · Unvollständig)
└─ Verlauf (Verbraucht · Entsorgt, nach Zeitraum)

Erfassen (Vollbild)
├─ Foto: Verpackung → Nährwerte → Datum und Anzahl → Prüfen
├─ Manuell: ein Formular → Prüfen
├─ Lebensmittelart wählen (Suche, zuletzt genutzt, + Neue Lebensmittelart)
└─ Entwurf fortsetzen oder verwerfen

Nachkaufen
├─ Offen (Fehlt bis zum Ziel · Ersetzen · Eigene)
├─ Erledigt
└─ Eintrag ergänzen

Statistik
├─ Abdeckung je Warengruppe
├─ Verbraucht und entsorgt
└─ Verlauf „Tage versorgt“ (später)

Einstellungen
├─ Mein Konto (Profil · Benachrichtigungen · Darstellung)
├─ Haushalt (Mitglieder · Ernährung · Ziel & Empfehlung · Stammdaten · Ampel & Regeln · Foto-Erkennung)
├─ Nutzerverwaltung
└─ Daten & System
```

## 7. Zustände, die für alle Screens gelten

| Zustand | Regel |
|---|---|
| Laden | Der Rahmen steht sofort, Inhalte erscheinen als graue Platzhalter in der späteren Form. Kein Vollbild-Kreisel. Dauert es länger als 3 Sekunden, kommt eine Zeile „Das NAS antwortet langsam“ |
| Keine Verbindung | Schmale Zeile oben: „Keine Verbindung zum NAS. Stand von Mi., 07:42. Ist Tailscale an?“ Lesen geht, Aktionen sind ausgegraut und sagen beim Antippen, warum |
| Aktion schlägt fehl | Der Eintrag springt zurück. Meldung am Ort der Aktion mit „Nochmal versuchen“. Nichts geht still verloren |
| Erfolg | Kurze Zeile unten mit „Rückgängig“ (5 Sekunden). Keine Rückfrage vor umkehrbaren Aktionen |
| Rückfrage | nur bei endgültigem Löschen (Admin) und beim Verwerfen eines Entwurfs |
| Leer | ein Satz, was hier stehen wird, und genau ein Knopf für den nächsten Schritt |
| Keine Berechtigung | Admin-Bereiche sind für Mitglieder lesbar, die Felder sind gesperrt, mit dem Satz „Das ändert ein Admin“ |

Die Screens unten nennen nur noch, was davon abweicht.

## 8. Screens

### 8.1 Übersicht

**Zweck:** Lage und nächster Schritt in fünf Sekunden. **Hauptfrage:** „Sind wir versorgt, und muss ich etwas tun?“

**Inhalte nach Priorität**
1. **Heute versorgt** mit Zielzeile und nächstem Schritt
2. **Bald fällig:** Zähler je Zeitgruppe, darunter die drei dringendsten Einträge, „Alle 18 ansehen“
3. **Nachkaufen:** die drei größten Lücken, „Zur Liste“
4. **Abdeckung je Warengruppe:** Balken „X von Y Tagen“, knappste Gruppe mit Wort markiert
5. **Nährwerte:** kcal gesamt, Makros als Gramm und Anteil
6. **Haushalt:** eine Zeile „3 Personen · Ziel 10 Tage bis 01.03.“ mit „Bearbeiten“

Nicht mehr in der Übersicht: der Baum „Vorrat nach Lebensmitteln“ (gehört in den Vorrat), die Kachel „Foto aufnehmen“ (der Knopf sitzt im Dock), eine eigene Wasser-Kachel (Wasser ist der zweite Balken der Kopfkachel).

**Warum die Kachel im Mockup nicht trägt:** Sie zeigt „9,4 von 10 Tagen“, während die Warengruppe Wasser bei 6 von 10 steht. Nach der Engpass-Regel müsste die Kernzahl 6 sein. Der Ring zeigt nicht, woraus die Zahl entsteht, kappt Übererfüllung bei 10 und sagt nicht, was zu tun ist. Die Zielzeile steht ohne Bezug daneben.

**Drei Vorschläge für „Heute versorgt“**

| | V1 „Satz und zwei Balken“ | V2 „Tagesleiste“ | V3 „Stichtag umschalten“ |
|---|---|---|---|
| Idee | Ein Satz als Kernaussage, darunter Essen und Wasser als zwei Balken auf derselben Tages-Skala mit Zielmarke | Die Zieltage als einzelne Felder, gefüllt bis zum Engpass. Darunter „reicht bis Sa., 28.11.“ | Umschalter „Heute · Am 01.03.“ über der Übersicht. Alle Kacheln rechnen für den gewählten Stichtag |
| Beispiel | „Euer Vorrat reicht für **6 Tage**.“ Essen 9,4 · Wasser 6,0 ← begrenzt. Zielmarke bei 10 | ■■■■■■□□□□ 6 von 10, Essen und Wasser als zwei Reihen | „Heute 6,0 Tage“ ↔ „Am 01.03. 5,2 Tage“ |
| Stärke | Erklärt sich selbst: Man sieht, woraus die Zahl entsteht und was begrenzt. Übererfüllung läuft sichtbar über die Marke | Sehr anschaulich und zählbar, gut für kleine Ziele (3, 10, 14 Tage) | Beantwortet „Was wäre am Zieldatum?“ für alle Kacheln zugleich |
| Schwäche | Zwei Balken brauchen Beschriftung, sonst wirken sie wie Warengruppen | Bei 28 Tagen oder mehr werden die Felder zu klein. Ein Datum „reicht bis“ kann mit dem Zieldatum verwechselt werden | Ein Modus mehr. Wer umschaltet und es vergisst, liest falsche Zahlen |
| Urteil | **Empfohlen als Grundlage** | Die Felder-Skala in V1 übernehmen, solange das Ziel höchstens 14 Tage hat | später prüfen, nicht im MVP |

**Empfohlener Aufbau der Kachel** (V1 mit Skala aus V2), von oben nach unten:
1. Satz: „Euer Vorrat reicht für **6 Tage**.“ Ganze Tage, abgerundet. Die Nachkommastelle steht an den Balken.
2. Zwei Balken auf einer Skala: **Essen 9,4 Tage** · **Wasser 6,0 Tage**, am kürzeren das Wort „begrenzt“. Zielmarke „Ziel 10“.
3. Zielzeile: „Am 01.03. wären es 5 von 10 Tagen. 6 Packungen laufen vorher ab.“ Tipp öffnet Bald fällig mit der Gruppe „bis zum Ziel“.
4. Nächster Schritt: „20 l Wasser bringen euch ans Ziel.“ Liegt auch der andere Wert unter dem Ziel, stehen beide Mengen im Satz: „Bis zum Ziel fehlen noch 20 l Wasser und etwa 3.400 kcal Essen.“ (geändert im Review von #183, vorher „… bringen euch auf 9 Tage“). Tipp öffnet Nachkaufen.
5. Tipp auf Satz oder Balken öffnet das **Erklär-Blatt**: Rechnung in Worten und Zahlen (52.600 kcal ÷ 5.600 kcal am Tag = 9,4 Tage), Bedarf je Person, Quelle mit Stand und Link, Anteil Richtwerte.

Sonderfälle der Kachel:
- Ziel erreicht: „Ziel erreicht: 10 von 10 Tagen, auch am 01.03.“ Der nächste Schritt entfällt oder nennt das nächste fällige Produkt.
- Kein Zieldatum: Zeile 3 entfällt.
- Mehr als 10 % Richtwerte: „Euer Vorrat reicht für ca. 6 Tage.“
- Leerer Vorrat: siehe Zustände.

**Aktionen:** keine ändernden. Jede Kachel führt genau an einen Ort.
**Zustände:** *Leer:* „Noch nichts im Vorrat. Fang mit einem Produkt an, das schon im Schrank steht.“ Knöpfe „Foto aufnehmen“ und „Von Hand eintragen“. Bald fällig und Nachkaufen sind ausgeblendet, das Ziel bleibt sichtbar. *Bald fällig leer:* Die Kachel schrumpft auf eine Zeile „Nichts fällig bis Februar“.
**Übergänge:** Kopfkachel → Erklär-Blatt · Zielzeile → Bald fällig · nächster Schritt → Nachkaufen · Warengruppe → Vorrat Ebene 2 · Nährwerte → Unterseite Nährwerte · Haushalt → Einstellungen.

### 8.2 Bald fällig

**Zweck:** Alles abarbeiten, was abgelaufen ist oder bald abläuft. **Hauptfrage:** „Was muss zuerst weg, und was mache ich damit?“

**Inhalte nach Priorität**
1. **Kopfzeile mit Zählern** als Sprungmarken: „2 abgelaufen · 3 diese Woche · 4 diesen Monat · 9 in 3 Monaten“
2. **Gruppen**, jeweils nach Datum sortiert:

| Gruppe | Regel | Zustand | Ton |
|---|---|---|---|
| Abgelaufen | MHD vor heute, noch nicht entschieden | abgelaufen | „Bitte kurz anschauen“, dazu einmal je Gruppe: „MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.“ |
| Diese Woche | bis 7 Tage | dringend | „Diese Woche verbrauchen“ |
| Diesen Monat | bis zur Orange-Schwelle (Standard 28 Tage) | dringend | „Einplanen“ |
| In 3 Monaten | bis zur Gelb-Schwelle (Standard 90 Tage) | bald fällig | „Im Blick behalten“ |
| Bis zum Ziel (nur über die Zielzeile) | läuft vor dem Zieldatum ab | gemischt | „Zählt am 01.03. nicht mehr mit“ |

Die Gruppen folgen den Schwellen aus den Einstellungen. Ändert der Admin sie, ändern sich die Überschriften mit.

3. **Eintrag** = alle Packungen einer Lebensmittelart mit demselben Datum: Piktogramm · „4 × Haferdrink 1 l“ · „04.12. · in 12 Tagen“ · Lagerort.
4. Platz für einen **Verbrauchs-Hinweis** je Gruppe („Ideen zum Verbrauchen“). Im Katalog ist das ROT-09 und „später“. Im MVP bleibt die Stelle leer und wird nicht angedeutet.

**Aktionen je Eintrag**

| Aktion | Wann sichtbar | Verhalten |
|---|---|---|
| **Verbraucht** | immer, als sichtbarer Knopf in der Zeile | nimmt 1 Packung. Bei mehreren erscheint in der Rückgängig-Zeile „Alle 4“ |
| Entsorgt | hinter „Mehr“ in der Zeile, bei „Abgelaufen“ sichtbar | wie Verbraucht, Status entsorgt |
| Noch gut | nur bei „Abgelaufen“ und nur bei MHD, nicht beim Verbrauchsdatum | setzt „geprüft am“, der Eintrag verlässt die Gruppe und zeigt im Vorrat „geprüft am 22.11.“ |
| Datum ändern | hinter „Mehr“ | für falsch erkannte Daten |
| Nachkaufen | in der Rückgängig-Zeile nach Verbraucht oder Entsorgt | ein Tipp, kein Dialog |
| Zur Lebensmittelart | Tipp auf den Text der Zeile | öffnet die Detailseite |

Wischen nach links oder rechts ist eine Abkürzung für Verbraucht und Entsorgt, aber nie der einzige Weg. Am PC ist die Seite eine Tabelle mit Mehrfachauswahl und denselben Aktionen über der Liste.

**Weitere Bedienung:** Sortierung „nach Datum“ (Standard) oder „nach Lagerort“, für den Gang durch den Keller.
**Zustände:** *Leer:* „Nichts fällig in den nächsten 3 Monaten. Als Nächstes: Knäckebrot, 14.03.2027.“ *Gruppe leer:* Die Gruppe wird ausgeblendet. *Verbrauchsdatum überschritten:* Hinweis „Verbrauchsdatum überschritten, bitte nicht mehr essen“, nur „Entsorgt“ und „Verbraucht“.
**Übergänge:** von Übersicht (Kachel, Zielzeile), Push „Dringend“, Wochenübersicht, Seitenleiste am PC. Zurück führt zur Übersicht. Derselbe Bestand erscheint im Vorrat über den Zustands-Chip, die Zeilen und Aktionen sind derselbe Baustein.

### 8.3 Vorrat

**Zweck:** Bestand finden, verstehen, entnehmen. **Hauptfrage:** „Was haben wir, und wie viel davon?“

**Drei Muster im Vergleich**

| | A · Drilldown mit Pfadzeile | B · Flache Liste mit Filterchips | C · Suche zuerst |
|---|---|---|---|
| Aufbau | Warengruppen → Kategorien → Lebensmittelarten → Packungen, je Ebene ein Screen | Eine Liste aller Lebensmittelarten, gruppiert nach Warengruppe. Chip-Reihen für Zustand, Warengruppe, Kategorie | Suchfeld oben, darunter „Zuletzt“ und Schnellfilter. Der Baum ist nur Trefferhilfe |
| Handy: gut | Große Ziele, klare Orientierung, jede Ebene zeigt ihre Summen | Alles auf einem Screen, Querschnitte wie „alle Dosen“ passen | Schnellster Weg, wenn man den Namen kennt |
| Handy: schlecht | Bis zu vier Tipps bis zur Packung. Dünn besetzte Ebenen wirken leer | Drei Chip-Reihen fressen Höhe (Duo außen: 580 px). Hierarchie und Summen gehen unter | Kein Überblick, Tippen im Keller ist mühsam, Summen je Ebene fehlen |
| PC: gut | Als Spalten nebeneinander sehr übersichtlich | Tabelle mit Sortierung und Mehrfachauswahl ist die stärkste PC-Form | Mit Tastatur sehr schnell |
| PC: schlecht | Ohne Spalten viel Klickerei | Lange Tabelle ohne Zwischensummen | Leerer Bildschirm vor der Eingabe |
| Passt zu | Stöbern, Verstehen, Abdeckung prüfen | Pflege, Inventur, Querschnitte | Entnehmen, Nachschauen |

**Empfehlung: A als Rückgrat, auf zwei Tipps verkürzt, mit B als Treffermodus und dem Suchfeld aus C.**

- **Ebene 1 · Warengruppen:** eine Zeile je Warengruppe mit Piktogramm, Name, Menge, kcal und dem Abdeckungsbalken „X von Y Tagen“. Darüber Suchfeld und eine einzige Chip-Reihe für den Zustand.
- **Ebene 2 · Lebensmittelarten einer Warengruppe:** Die Kategorien sind **Zwischenüberschriften mit Summe**, darunter stehen direkt die Lebensmittelarten. Oben eine Sprungchip-Reihe der Kategorien (Nudeln · Reis · Brot & Knäcke), die nur scrollt und nichts ausblendet. Zeile: Piktogramm · „Spaghetti“ · „8 Packungen · 4 kg“ · nächstes MHD mit Zustandswort · Knopf „−1“.
- **Detail:** Tipp auf die Zeile, siehe 8.4.
- **Treffermodus (B):** Sobald Suche oder Filter aktiv ist, erscheint statt der Warengruppen eine flache Liste der Lebensmittelarten, gegliedert nach Warengruppe, mit derselben Zeile. Ein Tipp auf „Alle anzeigen“ führt zurück.
- **Filter:** Zustand als Chip-Reihe (Im Vorrat · Bald fällig · Abgelaufen · Unvollständig). Behälter und Lagerort liegen in einem Filter-Blatt hinter einem Knopf „Filter“, aktive Filter stehen als entfernbare Chips darunter.
- **Verlauf:** Verbraucht und Entsorgt sind keine Filter des Bestands mehr, sondern eine eigene Unterseite „Verlauf“.

Warum so: Die Ordnung, die dem Maintainer gefällt, bleibt als Weg erhalten. Kategorien als Überschriften sparen eine Ebene und vermeiden jedes Aufklappen. Für den schnellen Griff gibt es Suche und „−1“.

**Je Gerät**
- *kompakt:* Ebene 1, Ebene 2 und Detail sind je eine Seite, oben die Pfadzeile.
- *mittel und breit:* links Ebene 1 oder 2, rechts das Detail.
- *weit:* drei Spalten: Warengruppen (schmal, mit Balken) · Tabelle der Lebensmittelarten mit Kategorie-Zwischenzeilen, sortierbar, Mehrfachauswahl · Detail.

**Aktionen:** Suchen · Filtern · „−1“ (nimmt die Packung mit dem frühesten MHD, Rückgängig-Zeile mit „Nachkaufen“) · Öffnen · „Packungen hinzufügen“ (im Detail).
**Zustände:** *Leer:* wie Übersicht, mit den zwei Erfassen-Knöpfen. *Warengruppe leer:* Die Zeile bleibt sichtbar mit „noch nichts“ und dem Balken bei 0, denn die Lücke ist eine Information. *Keine Treffer:* „Nichts gefunden für ‚spagetti‘.“ mit Knopf „Filter zurücksetzen“ und „Als neu erfassen“. *Eine Kategorie in der Warengruppe:* Die Sprungchips entfallen.
**Übergänge:** Übersicht (Warengruppe) → Ebene 2 mit dieser Gruppe · Zeile → Detail · „Verlauf“ → Unterseite · Zustand-Chip „Bald fällig“ zeigt dieselben Zeilen wie 8.2.

### 8.4 Detail Lebensmittelart mit Produkten und Einheiten

**Zweck:** Alles zu einer Lebensmittelart und ihren Packungen. **Hauptfrage:** „Wie viel haben wir, wie lange hält es, was nehme ich zuerst?“

**Inhalte nach Priorität**
1. Pfadzeile „Getreide › Nudeln“, Titel „Spaghetti“
2. Kennwerte: „8 Packungen · 4 kg · 14.360 kcal · etwa 2,6 Tage Essen für euch“ · nächstes MHD mit Zustandswort
3. **Packungen nach Datum**, frühestes oben: „11/2027 · 5 × · gut“, „03/2028 · 2 ×“, „07/2028 · 1 ×“. Gibt es mehrere Produkte (500 g und 1 kg), steht je Produkt ein Abschnitt mit eigener Überschrift. Bei nur einem Produkt entfällt die Überschrift.
4. Nährwerte je 100 g und je Packung, mit Herkunft („vom Etikett“ oder „Richtwert“), Makros als Gramm
5. Angaben zum Produkt: Menge, Behälter, Lagerort, Fotos
6. Hinweise: Richtwert zur Haltbarkeit, Hinweis zur Ernährungsform (später), „geprüft am“
7. Verlauf dieser Lebensmittelart (zuletzt verbraucht und entsorgt)

**Aktionen**
- **„1 entnehmen“** als fester Knopf unten. Nimmt das früheste MHD, die betroffene Zeile ist markiert.
- **Tipp auf eine Datumszeile** öffnet das Blatt „Einheit“: Anzahl wählen, dann Verbraucht · Entsorgt · Noch gut (nur abgelaufen, nur MHD) · Datum ändern.
- **„Packungen hinzufügen“**: springt in die Erfassung, direkt zum Schritt Datum und Anzahl.
- **Bearbeiten** der Produktangaben. Bei „Richtwert“ steht der Knopf „Nährwerttabelle fotografieren“ direkt an den Nährwerten.
- **Auf Nachkaufen setzen.**
- Löschen einer Fehlerfassung: nur Admin, hinter „Mehr“, mit Rückfrage.

**Zustände:** *Keine Packung mehr im Vorrat:* Die Seite bleibt erreichbar (aus Verlauf und Nachkaufen) und zeigt „Aktuell nichts im Vorrat“ mit „Packungen hinzufügen“ und „Auf Nachkaufen setzen“. *Nährwerte fehlen:* Abschnitt 4 zeigt den einen Knopf zum Nachtragen.
**Übergänge:** aus Vorrat, Bald fällig, Nachkaufen, Suche. Zurück führt dorthin, woher man kam. Auf breiten Stufen steht das Detail neben der Liste.

### 8.5 Erfassen

**Zweck:** Neues in den Vorrat bringen, so schnell wie möglich. **Hauptfrage:** „Wie bekomme ich den Einkauf in zwei Minuten rein?“

**Einstieg:** Der Erfassen-Knopf öffnet den zuletzt genutzten Weg (beim ersten Mal Foto, wenn die Erkennung an und die Kamera erlaubt ist). Oben bleibt der Umschalter **Foto · Manuell** immer sichtbar. Liegt ein Entwurf vor, fragt die App zuerst: „Erfassung von gestern fortsetzen oder verwerfen?“

**Weg per Foto**

| Schritt | Was der Nutzer tut | Was die App zeigt | Ohne Foto |
|---|---|---|---|
| 1 Verpackung | Vorderseite fotografieren | Karte: Lebensmittelart mit Pfad („Getreide › Nudeln › Spaghetti“), Menge, Behälter. Jedes Feld antippbar. Bei `null`: „Bitte auswählen“ mit Suche und „+ Neue Lebensmittelart“. Bei Treffer im Bestand: „Zu Spaghetti 500 g hinzufügen?“ → weiter bei Schritt 3 | „Von Hand“ öffnet dieselbe Karte leer |
| 2 Nährwerte | Tabelle fotografieren oder „Überspringen“ | „359 kcal je 100 g → 1.795 kcal je Packung“, Makros darunter. Bei Überspringen: „Es gilt der Richtwert für Spaghetti, du kannst das später nachtragen.“ | vier Zahlenfelder |
| 3 Datum und Anzahl | Datum fotografieren | **Ein Chip je Datum mit Anzahl:** „09/2027 × 1“ mit − und + und Schnellzahlen (2 · 3 · 4 · 6 · 12). Ein weiteres Foto mit anderem Datum ergibt einen zweiten Chip, dasselbe Datum erhöht die Anzahl. Nicht lesbar: Chip „nicht lesbar: nochmal oder eintippen“ | Monat/Jahr-Wähler mit „+6 Mon. · +1 J. · +2 J.“ |
| 4 Prüfen | „Speichern“ | „6 × Spaghetti 500 g = 3 kg · 10.770 kcal · 09/2027 (4×), 11/2027 (2×)“ · Lagerort vorbelegt · alles antippbar | gleich |
| Danach | „Nächstes Produkt“ oder „Fertig“ | „Gespeichert. Euer Essen reicht jetzt 11,3 statt 9,4 Tage.“ | gleich |

Der Chip mit Anzahl ersetzt die Wahl zwischen „MHD-Serie“ und „Alle gleiches Datum“ (ERF-05, ERF-07). Wer jede Packung einzeln fotografieren will, kann das weiter tun. Wer zehn gleiche hat, macht ein Foto und tippt „12“ oder zählt hoch.

Ist die Erkennung sicher und sind alle Felder gefüllt, geht die App nach Schritt 1 und 2 **von selbst weiter**. Die erkannten Werte bleiben als schmale Karte am oberen Rand stehen und sind dort und im Schritt Prüfen änderbar. So wird nichts ungesehen gespeichert, aber es braucht kein „Weiter“.

**Weg manuell:** ein Formular auf einer Seite, in dieser Reihenfolge: Lebensmittelart (Feld hat sofort den Fokus, darunter „Zuletzt genutzt“) · Menge je Packung · Anzahl · MHD · „Weitere Angaben“ (Behälter, Lagerort, Nährwerte) · „Prüfen und speichern“. Pflicht sind nur die ersten vier.

**Lebensmittelart wählen** (eigenes Blatt, in beiden Wegen gleich): Suchfeld, darunter zuletzt genutzte, dann die Liste nach Warengruppe gegliedert. Kein Treffer: „+ ‚Dinkelspaghetti‘ als neue Lebensmittelart anlegen“ mit Pflichtangabe der Kategorie.

**Zustände**
- *Kamera nicht erlaubt:* „Kein Zugriff auf die Kamera. Du kannst ihn in den iPhone-Einstellungen erlauben. Bis dahin geht alles von Hand.“ Hauptknopf „Von Hand eintragen“.
- *Erkennung aus oder nicht erreichbar:* „Die Erkennung antwortet gerade nicht. Es wird nichts geraten.“ Knöpfe „Nochmal“ und „Von Hand weiter“. Das Foto bleibt als Produktbild.
- *Erkennung läuft:* Das Feld zeigt „wird gelesen“, der nächste Schritt ist schon bedienbar.
- *Foto nicht hochgeladen:* Chip „nicht hochgeladen: nochmal“.
- *Speichern gesperrt:* Der Knopf nennt den Grund („Ein Datum fehlt noch“) und springt beim Antippen zum Feld.
- *Am PC:* Dateiauswahl statt Kamera, das Formular steht daneben.

**Übergänge:** aus Dock, Nachkaufen („Gekauft“), Detailseite („Packungen hinzufügen“), Leerzuständen. Nach „Fertig“ zurück zum Ausgangsort.

### 8.6 Weitere Screens, kurz

| Screen | Zweck und Hauptfrage | Inhalte nach Priorität | Aktionen | Besondere Zustände |
|---|---|---|---|---|
| **Nachkaufen** | „Was nehme ich beim Einkauf mit?“ | 1 Fehlt bis zum Ziel (je Warengruppe in kg bzw. l, Wasser zuerst, mit Beispielen aus den Lebensmittelarten des Haushalts) · 2 Ersetzen (läuft vor dem Ziel ab, zuletzt verbraucht) · 3 Eigene Einträge · 4 Erledigt · 5 Ausgeblendet (Lücken, mit „Wieder zeigen“, #201) | Abhaken · „Gekauft und erfassen“ (öffnet Erfassen vorbelegt) · Eintrag ergänzen · Lücke ausblenden (kommt zurück, wenn sie um mehr als 10 % wächst, spätestens nach 30 Tagen) | *Leer:* „Nichts offen. Euer Ziel ist erreicht.“ bzw. „Setzt ein Ziel, dann rechnet die App die Lücken aus.“ |
| **Statistik** | „Wie lief es über die Zeit?“ | 1 Abdeckung je Warengruppe in Prozent, auch über 100 % · 2 Verbraucht und entsorgt je Monat, mit Zeitraumwahl · 3 Verlauf „Tage versorgt“ (später) | Zeitraum wählen · Tipp auf einen Balken öffnet den Verlauf gefiltert | *Leer:* „Hier erscheint euer Verlauf, sobald ihr etwas verbraucht habt.“ *Nichts entsorgt:* „Nichts entsorgt. Schön so.“ |
| **Einstellungen** | „Wo ändere ich das?“ | Liste der Bereiche mit aktuellem Wert rechts (z. B. „Ziel & Empfehlung · 10 Tage bis 01.03.“). Reihenfolge: Mein Konto, Haushalt, Nutzerverwaltung, Daten & System | Jede Zeile öffnet eine Unterseite, gespeichert wird je Feld sofort mit Rückgängig | Mitglied: Admin-Bereiche lesbar und gesperrt. Auf breit: Liste links, Bereich rechts |
| **Ersteinrichtung** | „Wie komme ich in zwei Minuten zur ersten Zahl?“ | 1 Konto des Admins · 2 Haushalt (Personen mit Zählern, Details später) · 3 Ziel (10 Tage vorbelegt, Datum optional) · 4 Home-Bildschirm und Hinweis zu Push, überspringbar | Weiter · Zurück · Überspringen ab Schritt 3 | Bricht jemand ab, geht es beim nächsten Öffnen am selben Schritt weiter. Push wird hier nicht abgefragt, erst nach der ersten Erfassung mit MHD |
| **Anmelden** | „Rein, ohne Hürde“ | E-Mail, Passwort, „Angemeldet bleiben“ ist Standard | Anmelden · „Passwort vergessen?“ zeigt „Ein Admin kann es zurücksetzen“ | Falsche Angaben: ein neutraler Satz, ohne zu verraten, welches Feld falsch war. NAS nicht erreichbar: Hinweis auf Tailscale |

## 9. Nutzerflüsse mit Tipp-Zählung

Gezählt wird jeder Tipp ab der Übersicht. Buchstaben tippen zählt nicht mit, ein Auslöser zählt als Tipp.

### F1 · Neues Produkt per Foto, 6 Packungen, ein Datum
| # | Schritt | Tipps |
|---|---|---|
| 1 | Erfassen-Knopf, die Kamera öffnet sich | 1 |
| 2 | Verpackung fotografieren | 1 |
| 3 | Karte bestätigen | 1 |
| 4 | Nährwerttabelle fotografieren | 1 |
| 5 | Werte bestätigen | 1 |
| 6 | Datum fotografieren | 1 |
| 7 | Anzahl von 1 auf 6 hochzählen | 5 |
| 8 | Weiter zur Prüfung | 1 |
| 9 | Speichern | 1 |
| | **Summe wie im bisherigen Konzept** | **13** |

**Mit weniger:** selbst weitergehen bei sicherer Erkennung (Schritte 3, 5, 8 entfallen) und Schnellzahl „6“ (Schritt 7 wird 1 Tipp). **Ergebnis: 6 Tipps.**

### F2 · Nachschub eines bekannten Produkts, manuell
| # | Schritt | Tipps |
|---|---|---|
| 1 | Erfassen-Knopf | 1 |
| 2 | Umschalten auf Manuell | 1 |
| 3 | Lebensmittelart antippen, „spa“ tippen, Treffer wählen | 2 |
| 4 | Menge antippen und tippen | 1 |
| 5 | Anzahl | 1 |
| 6 | MHD: Feld, Monat, Jahr | 3 |
| 7 | Prüfen | 1 |
| 8 | Speichern | 1 |
| | **Summe** | **11** |

**Mit weniger:** letzter Weg wird gemerkt (−1), Suchfeld hat sofort den Fokus (−1), bekanntes Produkt füllt die Menge vor (−1), Schnellknopf „+2 J.“ statt Wähler (−2), Prüfen und Speichern in einem Knopf, wenn nichts geschätzt ist (−1). **Ergebnis: 5 Tipps.** Über „Packungen hinzufügen“ auf der Detailseite sind es ab dort 3.

### F3 · Etwas finden und eine Packung entnehmen
| # | Schritt | Tipps |
|---|---|---|
| 1 | Vorrat | 1 |
| 2 | Warengruppe Getreide | 1 |
| 3 | „−1“ in der Zeile Spaghetti | 1 |
| | **Summe** | **3** |

Im Mockup mit Baum: Vorrat, Warengruppe aufklappen, Kategorie aufklappen, Produkt öffnen, Entnehmen = 5. **Noch weniger:** Auf Ebene 1 eine Zeile „Zuletzt entnommen“ mit den drei häufigsten Lebensmittelarten und „−1“: 2 Tipps. Rückgängig ersetzt jede Rückfrage.

### F4 · Bald fällig abarbeiten, 3 Einträge
| # | Schritt | Tipps |
|---|---|---|
| 1 | Kachel Bald fällig | 1 |
| 2 | „Verbraucht“ am ersten Eintrag | 1 |
| 3 | „Nachkaufen“ in der Rückgängig-Zeile | 1 |
| 4 | „Entsorgt“ am zweiten (hinter „Mehr“) | 2 |
| 5 | „Noch gut“ am dritten | 1 |
| | **Summe** | **6** |

Im Mockup: Kachel zeigt nur 3 Einträge ohne Aktion, der Weg führt über Vorrat, Filter, Produkt, Blatt: je Eintrag 4 Tipps, zusammen etwa 12. **Noch weniger:** In der Gruppe „Abgelaufen“ ist „Entsorgt“ sichtbar statt hinter „Mehr“ (−1). Aus dem Push „Dringend“ landet man direkt auf der Seite (Schritt 1 entfällt).

### F5 · Lücke nachkaufen und einräumen
| # | Schritt | Tipps |
|---|---|---|
| 1 | Nachkaufen | 1 |
| 2 | Im Laden: Eintrag „Wasser 20 l“ abhaken | 1 |
| 3 | Zu Hause: „Gekauft und erfassen“ am erledigten Eintrag | 1 |
| 4 | Verpackung fotografieren, bekanntes Produkt wird vorgeschlagen | 1 |
| 5 | Datum fotografieren | 1 |
| 6 | Schnellzahl „12“ | 1 |
| 7 | Speichern | 1 |
| | **Summe** | **7** |

**Mit weniger:** Hängt am Eintrag schon eine Lebensmittelart mit genau einem Produkt, entfällt Schritt 4. **Ergebnis: 6 Tipps**, davon 4 fürs Einräumen.

## 10. Usability-Prinzipien, prüfbar

| Nr. | Prinzip | Woran man es prüft |
|---|---|---|
| P1 | **Fünf-Sekunden-Lage** | Nach 5 Sekunden auf der Übersicht können Testpersonen sagen, für wie viele Tage es reicht und was begrenzt |
| P2 | **Jede Zahl erklärt sich per Tipp** | Jede Kennzahl öffnet eine Erklärung mit Rechnung, Quelle und Stand. Keine Zahl ohne Einheit |
| P3 | **Eine Währung** | Jede Ebene zeigt ihren Beitrag in Tagen. Tage, kg und kcal stehen überall in derselben Reihenfolge |
| P4 | **Erfassen in wenigen Tipps** | Neues Produkt per Foto ≤ 8 Tipps, Nachschub ≤ 5, Entnehmen ≤ 3, Eintrag in Bald fällig entscheiden ≤ 2 |
| P5 | **Foto ist nie Pflicht** | Jeder Erfassungsschritt hat einen sichtbaren Weg von Hand, ohne Umweg über ein Menü |
| P6 | **Nichts wird geraten** | Unlesbares bleibt leer und wird benannt. Richtwerte sind als solche gekennzeichnet. Ein Datum entsteht nie ohne Etikett oder Eingabe |
| P7 | **Rückgängig statt Rückfrage** | Verbraucht, Entsorgt, Noch gut, Abhaken und Speichern sind 5 Sekunden lang umkehrbar. Rückfragen gibt es nur bei endgültigem Löschen |
| P8 | **Kein Aufklappen in Listen** | Keine verschachtelten Dropdowns, keine Baum-Pfeile. Hierarchie zeigt sich als Seite, Überschrift oder Pfadzeile |
| P9 | **Höchstens eine Chip-Reihe über einer Liste** | Weitere Filter liegen im Filter-Blatt, aktive stehen als entfernbare Chips |
| P10 | **Wort vor Farbe** | Jeder Zustand steht als Wort da (gut, bald fällig, dringend, abgelaufen). Die App ist ohne Farbe vollständig bedienbar |
| P11 | **Daumen reicht** | Auf dem Handy liegen alle häufigen Aktionen in der unteren Bildschirmhälfte, Tippflächen mindestens 44 pt |
| P12 | **Ruhiger Ton** | Kein Ausrufezeichen, kein „Achtung“, keine roten Zähler am Dock. Abgelaufenes heißt „bitte kurz anschauen“ |
| P13 | **Leer ist nie leer** | Jeder leere Zustand hat einen Satz und genau einen nächsten Schritt |
| P14 | **Der Ort bleibt** | Zurück, Neuladen, Auf- und Zuklappen und Gerätewechsel führen zum selben Screen mit demselben Filter. Ein begonnener Entwurf geht nie verloren |
| P15 | **Anzeigen und Ändern getrennt** | Übersicht und Statistik ändern nichts. Geändert wird im Vorrat, in Bald fällig, Nachkaufen und Einstellungen |
| P16 | **Gebündelt statt einzeln** | Höchstens eine Benachrichtigung am Tag, jede führt direkt auf den passenden Screen |

### Prüffragen für einen Usability-Test

Aufgaben, die die Testperson ohne Hilfe löst. Gemessen werden Zeit, Tipps und Irrwege.
1. „Für wie viele Tage reicht euer Vorrat heute? Woran liegt es, dass es nicht mehr sind?“ (P1, P2)
2. „Was bedeutet die Zeile mit dem Datum darunter?“ Erwartet: der Unterschied zwischen heute und Zieldatum in eigenen Worten.
3. „Was solltet ihr diese Woche verbrauchen? Trag ein, dass du eine Packung davon gegessen hast.“ (F4)
4. „Der Mais ist abgelaufen, sieht aber gut aus. Was machst du?“ Erwartet: „Noch gut“, ohne zu zögern.
5. „Wie viele Packungen Reis habt ihr, und bis wann halten sie?“ (F3, Vorrat)
6. „Du hast sechs Packungen Nudeln gekauft. Trag sie ein.“ Einmal mit Foto, einmal von Hand. (F1, F2)
7. „Wie viel Eiweiß lagert insgesamt, und wie viel davon in Fischkonserven?“ (A6, A8)
8. „Hier steht ‚ca.‘ vor der Zahl. Was heißt das, und wie wirst du es los?“ (§4)
9. „Was fehlt euch noch bis zum Ziel? Setz Knäckebrot zusätzlich auf die Liste.“ (F5)
10. „Du hast dich vertippt und die falsche Packung als entsorgt markiert. Mach es rückgängig.“ (P7)
11. Am Duo: mitten in der Erfassung aufklappen. „Wo bist du jetzt, ist noch alles da?“ (P14)
12. Nachfrage am Ende: „Welche Zahl hast du nicht verstanden? Was hat genervt?“

Erfolgsmaß je Aufgabe: ohne Hilfe gelöst, innerhalb der Tipp-Grenzen aus P4, höchstens ein Irrweg.

## 11. Texte und Ton

- Die App sagt „ihr“ und „euer Vorrat“ zum Haushalt, „du“ bei persönlichen Dingen (Konto, Kamera).
- Knöpfe sind Verben oder Ergebnisse: „Verbraucht“, „Speichern“, „Packungen hinzufügen“.
- Begriffe sind fest und überall gleich: Vorrat, Packung (für Einheit), Lebensmittelart, bald fällig, dringend, abgelaufen, Nachkaufen, Richtwert, „ca.“. Das Wort „Einheit“ erscheint in der UI nicht, weil es mit Maßeinheit verwechselt wird.
- „Essen“ und „Wasser“ in der Kopfkachel, nicht „Energie“ und „Engpass“. Im Erklär-Blatt stehen die Fachwörter mit Erklärung.

## 12. Was dieses Konzept für die Umsetzung bedeutet

| Bereich | Folge |
|---|---|
| Wiederverwendbare Bausteine | Kennwert-Zeile (Packungen · Menge · kcal · Tage · MHD), Zeile „Lebensmittelart“, Zeile „Fällig“, Pfadzeile, Balken auf Tages-Skala, Erklär-Blatt, Rückgängig-Zeile, Blatt „Einheit“, Datums-Chip mit Anzahl, Leerzustand. Jeder genau einmal gebaut |
| Katalog | Neue oder geänderte Funktionen stehen in §13 und brauchen einen Nachtrag in `features.html` |
| Pakete | M7 (Übersicht) und M4 (Vorrat) ändern ihren Zuschnitt, M6 und M5 (Erfassen) bekommen den Datums-Chip. M2 braucht die Funktionen aus §5 |

## 13. Abweichungen vom bisherigen Design-Konzept (`design.html`) und Katalog

| Nr. | Bisher | Hier | Warum |
|---|---|---|---|
| D1 | Bento-Raster mit vielen gleichrangigen Kacheln, lange Übersicht (Variante A) | Feste Reihenfolge mit einer klaren Hauptkachel, sechs Blöcke | #111: Aufteilung der Übersicht gefiel nicht. Gleichrangige Kacheln zeigen keine Priorität |
| D2 | Runder Zeiger für „Heute versorgt“ | Satz und zwei Balken auf einer Tages-Skala mit Zielmarke | Der Ring erklärt nicht, woraus die Zahl entsteht, und kappt Übererfüllung |
| D3 | Eigene Wasser-Kachel (UEB-04) | Wasser ist der zweite Balken der Hauptkachel, Liter im Erklär-Blatt | Wasser ist die Hälfte der Kernzahl und gehört dorthin, wo sie entsteht |
| D4 | Kachel „Foto aufnehmen“ (UEB-09) | entfällt, außer im Leerzustand | Der Erfassen-Knopf sitzt im Dock. Der Katalog schlägt das Zusammenlegen selbst vor |
| D5 | Bald fällig tippt in den Vorrat mit Filter (UEB-05) | Eigene Seite mit Zeitgruppen und Aktionen je Zeile | #111. Die Aktion muss dort möglich sein, wo die Liste steht |
| D6 | Vorrat mit drei Chip-Reihen (Status, Kategorie, Behälter) und Produkt-Kacheln (VOR-01 bis VOR-03) | Zwei-Tipp-Drilldown, eine Chip-Reihe, Filter-Blatt, Zeile je Lebensmittelart | #110 und #111. Drei Reihen passen nicht auf niedrige Bildschirme und bilden den Baum nicht ab |
| D7 | Sechs Status-Filter, darunter Nachkaufen, Verbraucht, Entsorgt (VOR-02) | Zustand-Chips nur für den Bestand, Verlauf als Unterseite, Nachkaufen nur als Tab. Neu: „Unvollständig“ | Bestand und Geschichte sind verschiedene Fragen. Nachkaufen war doppelt |
| D8 | Liste zeigt Produkte | Liste zeigt Lebensmittelarten, Produkte erst im Detail | #110. Eine Stufe weniger für den Normalfall „ein Produkt je Art“ |
| D9 | Einheiten als Blatt über der Liste | Detailseite der Lebensmittelart, Blatt nur für die Aktion an einem Datum | Kennwerte, Nährwerte und Verlauf brauchen Platz und eine eigene Adresse |
| D10 | Vier Schritte mit „Weiter“, Wahl zwischen MHD-Serie und „alle gleich“ (ERF-05, ERF-07) | Selbst weitergehen bei sicherer Erkennung, ein Chip je Datum mit Anzahl | Halbiert die Tipps (F1: 13 → 6) |
| D11 | Manuell in denselben vier Schritten | Ein Formular auf einer Seite | Ohne Kamera sind Schritte nur Umwege |
| D12 | KI liefert Kategorie, „+ Neue Kategorie“ (ERF-13) | KI liefert Lebensmittelart, „+ Neue Lebensmittelart“ | #110 |
| D13 | Feste rechte Spalte „Bald fällig“ ab 1280 px auf allen Screens (Variante H) | Keine feste Spalte. Am PC steht Bald fällig in der Seitenleiste, die Breite gehört dem Vorrat-Detail | Die Spalte würde die neue Seite doppeln und dem Detail den Platz nehmen |
| D14 | „1 entnehmen“ nur im Blatt | „−1“ direkt in der Listenzeile, „1 entnehmen“ im Detail | F3: 5 → 3 Tipps |
| D15 | Rückfrage „Auf die Einkaufsliste setzen?“ nach Entnahme (NK-02) | Angebot in der Rückgängig-Zeile | Kein Dialog für eine Nebensache |
| D16 | Bildsprache d6 (Glas, Verlauf, Instrumente), Schriften | hier offen gelassen | #111: abgelehnt, Schritt 3 entscheidet |

**Bleibt wie beschlossen:** fünf Ziele mit denselben Namen, betonter Erfassen-Knopf in der Mitte, Vollbild-Kamera, Zahnrad statt Tab, Stufen kompakt, mittel, breit, weit mit 640, 900, 1280 px, Liste und Detail nebeneinander ab „breit“, nichts Antippbares auf der Falz, Zustand immer mit Wort, Entwurf auf dem NAS, „Übersicht zeigt an, Einstellungen ändern“.

## 14. Offene Fragen an den Maintainer

| Nr. | Frage | Empfehlung |
|---|---|---|
| 1 | **Kernzahl:** ganze Tage im Satz („6 Tage“) und die Nachkommastelle nur an den Balken? Bisher gilt „abrunden auf eine Nachkommastelle“ | Ja. Ganze Tage sind schneller erfasst und versprechen keine Genauigkeit, die die Daten nicht haben |
| 2 | **Makros im MVP:** UEB-07 wurde mit dem MVP-Zuschnitt nach „später“ geschoben. #110 und #111 wollen Makros je Ebene | Summen in Gramm und Anteil an den kcal ins MVP (A6, A8), weil sie keine Bedarfswerte brauchen. „Eiweiß reicht X Tage“ (A7) erst nach Prüfung der DGE-Werte |
| 3 | **Schätzwert für kcal:** #110 nennt Richtwerte „nur als Hinweis“. Gilt das auch für kcal, oder darf der kcal-Richtwert der Lebensmittelart weiter als gekennzeichneter Schätzwert in die Rechnung? | Er darf rechnen, gekennzeichnet mit „ca.“. Sonst zählt jedes Produkt ohne Nährwerttabelle mit 0 und die Kernzahl wird unbrauchbar |
| 4 | **Packung ohne Datum:** ERF-09 erlaubt eine Schätzung nach Kategorie, #110 verbietet den Haltbarkeits-Richtwert als MHD. Das widerspricht sich | Keine Schätzung. Die Packung wird mit „Datum fehlt“ gespeichert, zählt bei „Heute“, nicht am Zieldatum, und steht unter „Unvollständig“. Dafür muss `einheit.mhd` leer sein dürfen, `mhd_geschaetzt` entfällt |
| 5 | **Produkt und Lebensmittelart:** Wann sind zwei Packungen dasselbe Produkt? | Gleich bei gleicher Lebensmittelart, Menge und Behälter. Abweichende Nährwerte erzeugen kein neues Produkt, es gilt der zuletzt bestätigte Wert, die App fragt einmal nach |
| 6 | **Tiefe der Startliste:** Ist „Vollkornspaghetti“ eine eigene Lebensmittelart oder ein Produktname unter „Spaghetti“? | Eigene Lebensmittelart nur, wenn sich Richtwerte oder Ernährungsform unterscheiden. Sonst ein freies Feld „Sorte“ am Produkt |
| 7 | **Dock:** Statistik als fester Tab, obwohl sie im MVP nur zwei Inhalte hat? Alternative: „Bald fällig“ in den Dock, Statistik unter die Übersicht | Im MVP nicht tauschen. Bald fällig ist von der Startseite und aus jedem Push einen Tipp entfernt, ein Notvorrat dreht sich langsam. Nach dem ersten Usability-Test neu bewerten |
| 8 | **Selbst weitergehen** in der Foto-Erfassung, wenn die Erkennung sicher ist: Gewinn 3 Tipps, dafür sieht man die Karte nur am Rand und im Schritt Prüfen | Ja, mit Schalter „Jeden Schritt bestätigen“ in den Einstellungen. Im PoC messen, wie oft „sicher“ falsch lag |
| 9 | **„Packungen hinzufügen“** auf der Detailseite entspricht ERF-17 („Gleiches Produkt nochmal“, bisher „später“) | Ins MVP ziehen. Es ist derselbe Erfassungsfluss ab Schritt 3 und der größte Hebel für Nachschub |
| 10 | **„Noch gut“:** Zählt eine geprüfte Packung wieder mit? Bisherige Annahme: nein | Nein für das Zieldatum, ja für „Heute“ für 30 Tage ab Prüfung. Sonst wirkt der Knopf folgenlos. Im Erklär-Blatt steht, wie viele geprüfte Packungen mitzählen |
| 11 | **Getränke und Wasser:** Im Mockup heißt die Warengruppe „Wasser & Getränke“ | Wasser-Tage nur aus Wasser. Andere Getränke stehen daneben („dazu 6 l Saft und Pflanzendrinks“) und zählen über ihre kcal zum Essen |
| 12 | **Abtropfgewicht:** Rechnet die App bei Konserven mit Füllmenge oder Abtropfgewicht? | Mit dem Abtropfgewicht, wenn es erfasst ist, weil sich die Nährwerttabelle bei Konserven meist darauf bezieht. Vor der Umsetzung an drei echten Dosen prüfen |
| 13 | **Zeitgruppe „Diese Woche“:** feste 7 Tage, zusätzlich zu den zwei einstellbaren Schwellen? | Ja, fest. Eine dritte einstellbare Schwelle wäre mehr Einstellung als Nutzen |
| 14 | **Wischen** als Abkürzung in Bald fällig (links Entsorgt, rechts Verbraucht)? | Im MVP weglassen und erst nach dem Test entscheiden. Der sichtbare Knopf reicht für 1 Tipp |
| 15 | **Zeile „Zuletzt entnommen“** auf Ebene 1 des Vorrats | Später. Erst messen, ob drei Tipps im Alltag stören |
| 16 | **Lagerort am Produkt:** Wer dieselbe Art im Keller und in der Küche lagert, hat zwei Produkte und damit zwei Abschnitte im Detail. Ist das recht? | Ja für das MVP, wie beschlossen. Die Detailseite fasst beides unter der Lebensmittelart zusammen |
| 17 | **Stichtag-Umschalter** (V3) für die ganze Übersicht | Nicht im MVP. Die Zielzeile mit Sprung nach Bald fällig beantwortet die häufigste Frage |
| 18 | **Katalog nachziehen:** D3, D4, D5, D7, D10 und D15 ändern Akzeptanzkriterien in `features.html` (UEB-04, UEB-05, UEB-09, VOR-01 bis VOR-03, ERF-05, ERF-07, NK-02) | Nach Freigabe dieses Dokuments in einem eigenen Schritt nachtragen, zusammen mit `05_STATUS_ENTSCHEIDUNGEN.md` |
