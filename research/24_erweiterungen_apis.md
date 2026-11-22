# 24 – Erweiterungen & APIs: Warnungen, Pegel, Stromausfall, Rezepte, Notfallplan, Dokumente, Offline-Karten

> **Kurzfazit:** Technisch sind Warnungen (NINA-Backend `warnung.bund.de/api31`, DWD Open Data), Pegelstände (PEGELONLINE) und Offline-Karten (OSM via selbst gehostete PMTiles) heute ohne Kosten erreichbar. Rechtlich sauber und offen lizenziert sind aber nur ein Teil davon: **DWD-Daten (CC BY 4.0)** und **PEGELONLINE (DL-DE Zero 2.0)** sind klar nutzbar, während für die **MoWaS-/NINA-Warnungen keine offene Lizenz** gefunden wurde. Der MoWaS-RSS-Feed sagt ausdrücklich, dass die Daten nur unverändert und nicht gewerblich genutzt werden dürfen. Der saubere Weg für ein (später ggf. kommerzielles) Preposaurus ist entweder eine **Multiplikatorenvereinbarung mit dem BBK** oder ein bewusster **Verweis/Deep-Link auf NINA bzw. Cell Broadcast** statt eigener Warn-Pushes. Cell Broadcast (DE-Alert) läuft auf Betriebssystem-Ebene und ist für Apps nicht anzapfbar. Für Stromausfälle, Katastrophenschutz-Leuchttürme und Notfalltreffpunkte gibt es **keine bundesweite offene Datenquelle**. Hier sind Nutzer-Eingabe (eigener Treffpunkt) plus OSM-Tags der realistische Ansatz.

Stand der Recherche: 2026-10-06. Die Websuche war in dieser Sitzung ausgeschöpft. Alle Aussagen stützen sich auf direkt abgerufene Primärseiten (WebFetch). Was nicht verifiziert werden konnte, ist als **[unverifiziert]** markiert.

---

## Ergebnisse

### 1. Warn-Schnittstellen im Überblick

| Quelle | Zugang | Inhalt | Lizenz / Nutzungsbedingung | Einschätzung für Preposaurus |
|---|---|---|---|---|
| **NINA-Backend** (BBK) | REST/JSON, Basis `https://warnung.bund.de/api31`, dokumentiert auf nina.api.bund.dev [1][2] | Dashboard je Regionalschlüssel (ARS), Warnungsdetails (JSON/GeoJSON), mapData für MoWaS, KATWARN, BIWAPP, DWD, LHP, Polizei; Notfalltipps, Logos, Event-Codes [1] | Keine allgemeine offene Lizenz gefunden. Für den MoWaS-RSS-Feed gilt laut Spezifikation: Die Daten dürfen nur „inhaltlich unverändert und nicht zu gewerblichen Zwecken verwendet werden“ [1]. Das Impressum von warnung.bund.de enthält keine Weiterverwendungsregeln [3] | Technisch einfach. Endpunkte live erreichbar (am 2026-10-06 leere Arrays, also keine aktiven Warnungen in den abgefragten Bereichen) [4]. **Rechtlich heikel bei kommerzieller Nutzung.** Nicht offiziell als öffentliche API zugesichert |
| **MoWaS-Multiplikator** (BBK) | Formale „Multiplikatorenvereinbarung“ mit dem BBK, Betreuung durch das „Team Betreuung Warnmultiplikatoren“ [5] | Offizielle Warnmeldungen zur Weiterverbreitung | Vertraglich; konkrete Vorgaben, Kosten und Pflichten sind auf der Übersichtsseite nicht genannt [5] | **Der saubere Weg**, wenn Preposaurus selbst Warnungen pushen soll. Aufwand und Anforderungen unklar → Anfrage beim BBK nötig |
| **DWD Open Data – Warnungen** | `https://opendata.dwd.de/weather/alerts/` mit `cap/` (12 Varianten: DISTRICT/COMMUNEUNION × DWD/CELLS/EVENT × STAT/DIFF) und `txt/` [6][7] | Amtliche Wetter- und Unwetterwarnungen im CAP-Format | Geodaten des DWD unter **CC BY 4.0**, mit Quellenvermerk [8]. Grundlage: DWD-Gesetz, Daten „weitgehend entgeltfrei“ [9]. Kein SLA [9] | **Gut nutzbar**, auch kommerziell (Quelle angeben). Für Wetter-Warnungen die bevorzugte Quelle |
| **DWD warnings.json (JSONP)** | `https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json`, Aktualisierung alle 10 Min. [10] | Warnstatus auf Kreis-/Gemeindeebene | „Es gilt das Copyright des DWD“, Quellenangabe Pflicht. DWD nennt JSONP-Dateien ausdrücklich „Beiprodukte“, die wegfallen können, und empfiehlt WFS/GeoDienste [10] | Nur für den Prototyp. Für das Produkt CAP/WFS nutzen |
| **DWD GeoServer** (maps.dwd.de) | WMS/WFS [10] | Fertig gerenderte Warnkarten-Layer | wie DWD [8][10] | Interessant für eine Kartenansicht online |
| **LHP** (Länderübergreifendes Hochwasserportal) | hochwasserzentralen.de, Bereich „For Developers“ erwähnt [11]. Hochwasser-Meldungen auch über NINA `/lhp/mapData.json` [1] | Hochwasserlage und -warnungen der Länder | Nutzungsbedingungen nicht ermittelt (Entwicklerseite: 404 unter der vermuteten URL) **[unverifiziert]** | Nur über NINA-Weg oder nach Klärung mit dem LHP |
| **KATWARN** | Läuft heute unter dem Dach **KatX** (TURMsolutions GmbH, Berlin) [12] | Behördliche Warnungen; die Inhalte erscheinen auch in NINA (`/katwarn/mapData.json`) [1] | Keine öffentliche Drittanbieter-API gefunden [12] | Nicht direkt integrierbar; Warnungen nur indirekt über NINA |
| **Cell Broadcast / DE-Alert** | Seit 23.02.2023 in DE; Android 11+ / iOS 16.1+; Verarbeitung auf **Betriebssystem-Ebene**, keine App nötig; Texte bis 500 Zeichen mit Link auf warnung.bund.de; keine personenbezogenen Daten [13] | Warn-SMS an alle Geräte in der Funkzelle | – | **Für Apps nicht lesbar** (nach meinem Kenntnisstand gibt es kein öffentliches iOS/Android-API, um empfangene Warnungen auszulesen **[unverifiziert]**). Preposaurus kann nur erklären und auf die Einstellungen verweisen |
| **EU-Alert** | DE-Alert ist die deutsche Umsetzung der EU-weiten Pflicht zu öffentlichen Warnsystemen über Mobilfunk (EECC Art. 110) **[unverifiziert, BBK-Seite nennt EU-Alert nicht]** [13] | – | – | Wie Cell Broadcast: nur informativ |
| **AT / CH** (AT-Alert, Alertswiss) | Seiten in dieser Sitzung nicht inhaltlich abrufbar (404 bzw. leerer Inhalt) **[unverifiziert]** | – | – | Für den DACH-Ausbau separat prüfen (siehe Report 09) |

**Hinweis zu bund.dev:** Die GitHub-Organisation *bundesAPI* führt sich als „Bundesstelle für Open Data“ [14]. Nach meinem Kenntnisstand handelt es sich um eine **zivilgesellschaftliche Initiative** und nicht um eine Behörde. Die Seite dokumentiert inoffiziell vorhandene Behörden-Backends. Das Impressum ließ sich nicht auslesen **[unverifiziert]**. Wichtig: Laut GitHub-Banner stehen die bund.dev-**API-Proxies „aufgrund exzessiver Nutzung“ derzeit nicht zur Verfügung** [14]. Preposaurus sollte deshalb nie über bund.dev-Proxies gehen, sondern direkt auf die Primärquelle (warnung.bund.de, DWD).

**Kurzes API-Beispiel (nur zur Einordnung):**
```
GET https://warnung.bund.de/api31/dashboard/{ARS}.json      → aktuelle Warnungen für einen Kreis (ARS 12-stellig)
GET https://warnung.bund.de/api31/warnings/{id}.json         → Details
GET https://warnung.bund.de/api31/appdata/gsb/notfalltipps/DE/notfalltipps.json → 18 BBK-Notfalltipps
```
Laut Repo-Doku wurde in v1.1.0 der AGS durch den **Amtlichen Regionalschlüssel (ARS)** ersetzt [2]. Dass für das Dashboard die letzten 7 Stellen des ARS auf „0“ gesetzt werden müssen (Kreisebene), ist eine verbreitete Praxis, wurde hier aber nicht belegt **[unverifiziert]**.

### 2. Pegelstände & Hochwasser

| Quelle | Zugang | Lizenz | Abdeckung |
|---|---|---|---|
| **PEGELONLINE** (WSV) | REST v2: `https://pegelonline.wsv.de/webservices/rest-api/v2/stations.json`, `…/stations/{UUID}/W/currentmeasurement.json`, Filter z. B. `?waters=RHEIN`; JSON/CSV/PNG; 30 Tage rückwirkend; Caching-Header, kein dokumentiertes Rate-Limit [15][16] | **DL-DE→Zero-2.0** (freie Nutzung ohne Bedingungen); ungeprüfte Rohdaten ohne Gewähr [15] | Nur **Bundeswasserstraßen** (Binnen- und Küstenpegel), nicht die kleinen Gewässer der Länder [15] |
| **LHP** | s. o. [11] | ungeklärt | Länder-Hochwasserzentralen, also auch kleinere Flüsse |

→ PEGELONLINE ist rechtlich die sauberste Quelle im ganzen Bericht, deckt aber genau die Sturzflut- und Kleingewässer-Lagen nicht ab (z. B. Ahrtal 2021).

### 3. Stromausfall-Informationen

| Quelle | Befund |
|---|---|
| **störungsauskunft.de** | Portal mit aktuellen Störungen bei Strom, Gas, Wasser, Fernwärme und Straßenbeleuchtung nach PLZ [17]. Betreiber, API und Nutzungsbedingungen ließen sich auf der Startseite nicht ermitteln. Das TLS-Zertifikat von `www.` verweist auf `outages.eu` **[unverifiziert, ob es ein offizielles Angebot für Dritte gibt]** |
| **Netzbetreiber** | Eigene Störungskarten, aber uneinheitlich und ohne gemeinsamen Standard **[unverifiziert]** |
| **BBK-Empfehlung** | Bei Stromausfall: batterie- oder kurbelbetriebenes Radio; Kochen mit Campingkocher oder Grill, **nur draußen** (Erstickungsgefahr) [18] |

→ Es gibt keine bundesweite, offen lizenzierte Echtzeit-Quelle für Stromausfälle. Für Preposaurus ist das ohnehin ein Widerspruch: Bei Stromausfall fallen oft auch Mobilfunk und Internet aus. **Der Mehrwert liegt in der Offline-Vorbereitung, nicht in Live-Daten.**

### 4. Katastrophenschutz-Leuchttürme / Notfalltreffpunkte / Anlaufstellen

| Quelle | Befund |
|---|---|
| **Berlin – Katastrophenschutz-Leuchttürme** | Anlaufstellen, die „erst in Gefahrenlagen in Betrieb genommen“ werden; Suche nach PLZ, Bezirk oder Adresse; vollständige Liste als **PDF** zum Download [19]. Open Data wird nicht erwähnt [19] |
| **Andere Länder / Kommunen** | Ähnliche Konzepte gibt es unter verschiedenen Namen (z. B. „Notfalltreffpunkte“, „Katastrophenschutz-Leuchttürme“, „Notfallinfopunkte“), die Datenlage ist zersplittert. notfalltreffpunkte.de existiert nicht (DNS-Fehler) [20] **[unverifiziert, welche Länder welche Daten offen anbieten]** |
| **OpenStreetMap** | `emergency=disaster_help_point` steht genau für „Hilfe bei Ausfall normaler Kommunikation (z. B. langer Stromausfall)“; der Vorschlag stammt aus der Schweiz [21]. Daneben gibt es `emergency=assembly_point` (rund 13.177 Nutzungen weltweit, Stand 06/2023; eher für Gebäude-Sammelplätze) [22] |

→ Realistisch: **OSM-Daten (ODbL) plus behördliche PDFs als Links plus nutzerdefinierte Treffpunkte.** Behördliche Listen nur importieren, wenn die Lizenz es erlaubt. Die Vollständigkeit der OSM-Daten in DE ist unbekannt **[unverifiziert]**.

### 5. Offline-Karten

| Option | Befund |
|---|---|
| **tile.openstreetmap.org** | **Offline-Nutzung und Bulk-Download sind verboten** („Offline use is not permitted“). Pflicht: Attribution „© OpenStreetMap contributors“, eigener User-Agent, mindestens 7 Tage Cache [23] |
| **Protomaps / PMTiles** | Open-Source-System mit einem einzigen Archiv-File, Ausgabe über HTTP-Range-Requests, selbst hostbar; Code BSD, Basemap-Daten **ODbL** [24]. Regionale Extrakte per pmtiles-CLI [24]. Ein Landkreis- oder Stadtausschnitt ist als Offline-Paket auf dem Gerät denkbar |
| **Rechtsfolge ODbL** | Attribution nötig. Eigene Ergänzungen an der Datenbank fallen ggf. unter Share-Alike **[Detail juristisch prüfen]** |

### 6. Rezepte ohne Strom / aus dem Vorrat

| Quelle | Befund | Lizenz |
|---|---|---|
| **BBK-Notfalltipps** (über NINA-API) | Unter den 18 Artikeln ist „Kochen ohne Strom“ [25] | Keine Lizenzangabe im JSON [25]. Inhalte sind Behördentexte; das Urheberrecht ist nicht automatisch frei (§ 5 UrhG gilt nur für amtliche Werke im engen Sinn) **[juristisch prüfen]** |
| **BMEL / BLE – ernaehrungsvorsorge.de** | Vorratstabelle (auch vegetarisch), Vorratskalkulator, Hinweise zu Haltbarmachen, Lagerung und Pflege des Vorrats. **Keine Rezepte**, kein „Kochen ohne Strom“ [26][27] | © 2026 BLE [26] |
| **BBK-Ratgeber** „Vorsorgen für Krisen und Katastrophen“ + Checklisten (PDF), in 8 Fremdsprachen, Leichter Sprache und DGS [28] | Empfehlung 10 Tage, „mindestens drei Tage“ helfen schon [28] | Verlinken, nicht kopieren |
| **Wikibooks-Kochbuch** (de) | Großes freies Kochbuch, **CC BY-SA 4.0**, keine eigene Kategorie „Notvorrat“ [29] | Nutzbar mit Attribution + Share-Alike (abgeleitete Rezepttexte müssten ebenfalls CC BY-SA sein) |

→ Es gibt keine fertige, offene Datenbank „Rezepte aus dem Notvorrat ohne Strom“. **Empfehlung: Rezepte selbst schreiben** (Zutatenlisten als solche sind urheberrechtlich in der Regel nicht geschützt, Beschreibungstexte schon **[juristisch prüfen]**) oder kuratiert aus CC-BY-SA-Quellen übernehmen und dabei an die Kategorien der BMEL-Vorratstabelle koppeln (Getreide, Hülsenfrüchte, Konserven …).

### 7. Notfallplan, Notfallkontakte, Dokumentenmappe

| Thema | Offizielle Grundlage | Befund |
|---|---|---|
| **Dokumentenmappe** | BBK „Dokumente sichern“ [30] | **Originale:** Familienurkunden/Stammbuch. **Original oder beglaubigte Kopie:** Sparbücher, Verträge, Versicherungspolicen, Einkommens-/Steuernachweise, Zeugnisse, Testament, Vollmachten. **Einfache Kopie:** Ausweis, Führerschein, Impfpass, Grundbuch, Bescheide, Versicherungsnachweise u. a. Zusätzlich digital sichern oder bei Vertrauten, Notar bzw. im Bankschließfach hinterlegen [30] |
| **Notgepäck, Hausapotheke** | BBK-Unterseiten [31] | Als Checklisten-Module gut abbildbar |
| **Notfallplan / Treffpunkt** | Auf den abgerufenen BBK-Seiten gibt es keinen eigenen Treffpunkt-Abschnitt [28][31]. Möglicherweise steht er im Ratgeber-PDF **[unverifiziert]** | Haushalts-Treffpunkt (nah/fern), Kontaktkette und „Wer holt die Kinder?“ sind sinnvolle Eigenfunktionen |
| **NINA selbst** | Bietet laut BBK keine Funktionen für Notfallkontakte oder Treffpunkte [32] | **Marktlücke**: Preposaurus ergänzt NINA statt mit ihr zu konkurrieren |

**Rechtliches zur digitalen Dokumentenmappe:** Ausweiskopien, Gesundheitsdaten (Impfpass, Medikation, Allergien) und Finanzdokumente sind hochsensibel. Gesundheitsdaten sind besondere Kategorien nach Art. 9 DSGVO (Allgemeinwissen, in dieser Sitzung nicht neu abgerufen). Dazu kommt das Pass-/Personalausweisrecht zu Kopien **[unverifiziert, juristisch prüfen]**. Daraus folgt: **lokal und verschlüsselt, ohne Server-Upload, Ende-zu-Ende-Sync höchstens optional.**

---

## Bedeutung für Preposaurus

**Empfehlung nach Machbarkeit (MVP → später):**

| Priorität | Feature | Quelle | Aufwand | Risiko |
|---|---|---|---|---|
| **MVP+** (geringes Risiko) | **„Bin ich gewarnt?“-Check**: Erklären und prüfen, ob NINA installiert und Cell Broadcast aktiv ist, mit Deep-Link zu NINA | BBK [13][32] | gering | keins |
| **MVP+** | **Notfallplan-Modul**: Haushaltsmitglieder (gibt es schon) + Treffpunkt nah/fern + Kontaktkette + Rollen; offline als PDF/Ausdruck | eigene Funktion, BBK-Struktur [28][30] | gering | gering |
| **MVP+** | **Dokumentenmappe als Checkliste** (Original/beglaubigt/Kopie, nach BBK) – erst nur „habe ich / liegt wo“, **keine** Dokument-Scans | BBK [30] | gering | gering |
| **V2** | **Wetterwarnungen** für Wohnort(e) aus DWD-CAP, mit Quellenvermerk „Deutscher Wetterdienst“ | DWD CC BY 4.0 [7][8] | mittel (Backend für Push nötig) | gering |
| **V2** | **Pegel-Widget** für Nutzer an Bundeswasserstraßen | PEGELONLINE DL-DE Zero [15][16] | gering | gering (Abdeckung begrenzt) |
| **V2** | **Offline-Karte** mit eigenem Treffpunkt + OSM `disaster_help_point`/`assembly_point` + Links zu Länder-PDFs (z. B. Berlin) | PMTiles/ODbL [21][22][24] | mittel–hoch | ODbL-Pflichten, Datenlücken |
| **V2** | **Vorrats-Rezepte ohne Strom**, an die Bestände gekoppelt („Du hast Linsen + Tomatenkonserve → Rezept X“), bevorzugt verbraucht, was bald abläuft | eigene Texte / CC BY-SA [29] | mittel | Urheberrecht bei Fremdtexten |
| **V3** | **Volle Warn-Integration (MoWaS, Polizei, LHP) mit Push** | nur über **BBK-Multiplikatorenvereinbarung** [5] | hoch (Vertrag, Betrieb) | rechtlich/haftungsrelevant |
| **V3** | **Digitale Dokumentenmappe mit Scans** (verschlüsselter Tresor) | eigene Funktion | hoch | DSGVO Art. 9, Sicherheit |
| **verwerfen** | Live-Stromausfall-Karte | keine offene Quelle [17] | – | Daten fehlen, Nutzen im Ernstfall fraglich |

**Leitlinien:**
1. **Ergänzen statt ersetzen:** Preposaurus ist kein Warn-Kanal. Warnungen kommen aus NINA und Cell Broadcast, Preposaurus sorgt für die Vorbereitung. Das senkt Haftungs- und Rechtsrisiken stark.
2. **Offline first:** Notfallplan, Kontakte, Dokumenten-Checkliste, Treffpunkt-Karte und Rezepte müssen ohne Netz funktionieren, weil gerade bei Stromausfall das Netz wegbricht.
3. **Prüf-Trigger nutzen:** Eine DWD-Unwetterwarnung (V2) kann einen „Vorrat-Check“ auslösen („Sturm morgen – Taschenlampe, Batterien, Wasser ok?“). Das ist ein Alleinstellungsmerkmal und rechtlich unkritisch, weil die DWD-Daten offen lizenziert sind.
4. **Notfalltipps** (18 BBK-Artikel) nur verlinken oder nach Lizenzklärung einbinden.
5. **Quellenvermerke** sichtbar machen (DWD, OSM, WSV) – passt zum Grundprinzip „richtige Quellen“ aus dem Ideenpapier.

---

## Offene Fragen

1. **BBK:** Welche Vorgaben, Kosten und Pflichten (Unveränderbarkeit, Latenz, Zertifizierung) gelten für Warnmultiplikatoren? Ist die direkte Nutzung von `warnung.bund.de/api31` durch Dritt-Apps geduldet oder untersagt? → Anfrage beim „Team Betreuung Warnmultiplikatoren“ [5].
2. **Lizenz der BBK-Texte** (Notfalltipps, Ratgeber): Dürfen sie wörtlich in eine App übernommen werden?
3. **LHP:** Gibt es einen offiziellen Entwickler-Zugang, und unter welcher Lizenz?
4. **störungsauskunft.de:** Wer betreibt es, gibt es eine Schnittstelle für Dritte?
5. **Leuchttürme und Notfalltreffpunkte:** Welche Bundesländer und Kommunen veröffentlichen sie als Open Data (z. B. daten.berlin.de)? Eine Übersicht fehlt.
6. **AT-Alert / Alertswiss / EU-Alert:** Zugang und Lizenzen für den DACH-Ausbau (in dieser Sitzung nicht abrufbar).
7. **bund.dev:** Rechtsstatus und Verfügbarkeit (Proxies derzeit abgeschaltet [14]).
8. **Juristisch:** Speichern von Ausweiskopien in der App, Haftung bei verspäteten oder fehlenden Warnungen, ODbL-Share-Alike bei eigenen Treffpunkt-Daten.
9. **Plattform:** Gibt es iOS/Android-APIs, mit denen eine App erkennt, ob Cell-Broadcast-Warnungen aktiviert sind? (vermutlich nein **[unverifiziert]**)

---

## Quellen

Alle abgerufen am 2026-10-06.

1. NINA API – OpenAPI-Spezifikation (bundesAPI): https://raw.githubusercontent.com/bundesAPI/nina-api/main/openapi.yaml (Doku: https://nina.api.bund.dev/)
2. bundesAPI/nina-api – README (GitHub): https://github.com/bundesAPI/nina-api
3. warnung.bund.de – Impressum: https://warnung.bund.de/impressum
4. NINA-Endpunkte live abgefragt: https://warnung.bund.de/api31/dashboard/091620000000.json und https://warnung.bund.de/api31/dwd/mapData.json
5. BBK – Warnmultiplikatoren: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Warnung-in-Deutschland/Warnmultiplikatoren/warnmultiplikatoren_node.html
6. DWD Open Data – weather/alerts: https://opendata.dwd.de/weather/alerts/
7. DWD Open Data – weather/alerts/cap: https://opendata.dwd.de/weather/alerts/cap/
8. DWD – Rechtliche Hinweise / Nutzungsbedingungen: https://www.dwd.de/DE/service/rechtliche_hinweise/rechtliche_hinweise_node.html
9. DWD – Open Data: https://www.dwd.de/DE/leistungen/opendata/opendata.html
10. DWD – Objekteinbindung Warnungen: https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/objekteinbindung.html
11. Länderübergreifendes Hochwasserportal: https://www.hochwasserzentralen.de/
12. KatX (Weiterleitung von katwarn.de): https://kat-x.de/
13. BBK – Cell Broadcast: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Warnung-in-Deutschland/So-werden-Sie-gewarnt/Cell-Broadcast/cell-broadcast_node.html
14. GitHub-Organisation bundesAPI: https://github.com/bundesAPI
15. PEGELONLINE – Webservice-Überblick: https://www.pegelonline.wsv.de/webservice/ueberblick
16. PEGELONLINE – REST-API-Guide: https://www.pegelonline.wsv.de/webservice/guideRestapi
17. störungsauskunft.de: https://xn--strungsauskunft-9sb.de/
18. BBK – Stromausfall: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Stromausfall/stromausfall_node.html
19. Berlin – Katastrophenschutz-Leuchttürme: https://www.berlin.de/bevoelkerungsschutz/warnung-und-information/katastrophenschutz-leuchttuerme/
20. notfalltreffpunkte.de (DNS nicht auflösbar): https://www.notfalltreffpunkte.de/
21. OSM-Wiki – emergency=disaster_help_point: https://wiki.openstreetmap.org/wiki/Tag:emergency%3Ddisaster_help_point
22. OSM-Wiki – emergency=assembly_point: https://wiki.openstreetmap.org/wiki/Tag:emergency%3Dassembly_point
23. OSMF – Tile Usage Policy: https://operations.osmfoundation.org/policies/tiles/
24. Protomaps-Dokumentation: https://docs.protomaps.com/
25. NINA – Notfalltipps JSON: https://warnung.bund.de/api31/appdata/gsb/notfalltipps/DE/notfalltipps.json
26. BLE/BMEL – Ernährungsvorsorge, Private Vorsorge: https://www.ernaehrungsvorsorge.de/private-vorsorge/
27. BBK – Essen und Trinken bevorraten: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/So-koennen-Sie-sich-vorbereiten/Bevorraten/bevorraten_node.html
28. BBK – Ratgeber und Checkliste: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Ratgeber-Checkliste/ratgeber-checkliste_node.html
29. Wikibooks – Kochbuch: https://de.wikibooks.org/wiki/Kochbuch
30. BBK – Dokumente sichern: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/So-koennen-Sie-sich-vorbereiten/Dokumente-sichern/dokumente-sichern_node.html
31. BBK – So können Sie sich vorbereiten: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/So-koennen-Sie-sich-vorbereiten/so-koennen-sie-sich-vorbereiten_node.html
32. BBK – Warn-App NINA: https://www.bbk.bund.de/DE/Warnung-Vorsorge/Warn-App-NINA/warn-app-nina_node.html
