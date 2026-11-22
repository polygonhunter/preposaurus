# Ernährungswissenschaftliche Grundlage: Bedarf je Haushaltsmitglied

> **Kurzfazit:** Die offiziellen Vorratsempfehlungen in Deutschland (BBK, BLE/ernaehrungsvorsorge.de) rechnen pauschal mit **2.200 kcal und 2 l Flüssigkeit pro Person und Tag** (davon 1,5 l zum Trinken, 0,5 l zum Kochen). Die DGE-Richtwerte zeigen aber, dass der Energiebedarf zwischen rund 1.100 kcal (Kleinkind) und über 3.000 kcal (aktiver Mann/Jugendlicher) liegt. Für Preposaurus bietet sich deshalb ein **kcal-basiertes Rechenmodell mit „Personen-Äquivalenten"** an. Die Tagesmenge je Person (DGE nach Alter, Geschlecht, Aktivität) wird durch 2.200 geteilt, und mit diesem Faktor werden die kg-Mengen der BLE-Lebensmittelgruppen skaliert. Babys (Säuglingsnahrung und abgekochtes Wasser), Stillende (+500 kcal, ca. +0,5–0,7 l Wasser), Senioren (höherer Trinkbedarf, BLE: 2 l) und Haustiere (FEDIAF-Formeln) brauchen eigene Regeln. Einige Werte (Säuglinge, Haustier-Wasser) konnte ich nicht an Primärquellen belegen. Sie sind unten markiert.

---

## Ergebnisse

### 1. Offizielle Pauschalannahmen für Vorräte

| Quelle | Energie/Tag | Flüssigkeit/Tag | Zeitraum | Besonderheiten |
|---|---|---|---|---|
| BBK (Ratgeber Notfallvorsorge, Checkliste) [1][2] | ca. 2.200 kcal | 2 l (1,5 l Trinken + 0,5 l Kochen), also ca. 14 l/Woche | 10 Tage (3-Tage-Grundvorrat als Minimum) | Hinweis auf Sonderkost für Babys, Diabetiker, Allergiker und Haustiere, **ohne konkrete Mengen** |
| BLE Vorratskalkulator (ernaehrungsvorsorge.de) [3] | 2.200 kcal | Erwachsene 1,5 l + 0,5 l Kochen; **Kinder bis 12 J.: 1 l**; **Senioren 65+: 2 l** | frei wählbar (3–28 Tage laut Drittquelle [4]) | „allgemeine Empfehlungen, die ggf. an die individuellen Ernährungsbedürfnisse angepasst werden müssen" |
| BLE Tagesmenge je Person [3] | – | – | 1 Tag | Getreide/Brot/Kartoffeln 0,33 kg · Gemüse/Pilze 0,40 kg · Obst 0,25 kg · Milch/-produkte 0,25 kg · Eier/Fleisch/Fisch 0,12 kg · Fette/Öle 33 g · Getränke 2,0 l |
| BBK-Checkliste 10 Tage (Drittquellen zitieren) [2][5] | – | 20 l | 10 Tage | Getreide usw. 3,5 kg · Gemüse/Hülsenfrüchte 4,0 kg · Obst/Nüsse 2,5 kg · Milchprodukte 2,6 kg · Fisch/Fleisch/Eier 1,5 kg · Fette/Öle 0,357 kg |
| FEMA / Ready.gov (USA) [6] | – | **1 Gallone (ca. 3,8 l) inkl. Hygiene**; bei großer Hitze ggf. das Doppelte | „several days" (Kit: mind. 3 Tage) | Kinder, Stillende und Kranke brauchen eventuell mehr Wasser |
| BWL Schweiz (Notvorrat) [7] | – | 9 l pro Person (ein Sixpack) ≈ 3 l/Tag für 3 Tage, **ohne** Hygiene | Lebensmittel für ca. 1 Woche | – |

**Hinweis:** Die BLE-Tagesmengen (z. B. Getreide 0,33 kg × 10 = 3,3 kg) weichen leicht von den 10-Tage-Werten der BBK-Checkliste ab (3,5 kg). Das liegt wahrscheinlich an unterschiedlichen Versionen der Checkliste (BLE-Tabelle mit Stand 2024). Die PDF-Tabelle der BLE [8] konnte ich technisch nicht auslesen. **Vor der Implementierung muss jemand die Werte direkt aus der Original-PDF verifizieren.**

### 2. Energiebedarf nach DGE (Richtwerte, kcal/Tag, Stand der Ableitung 2015) [9]

PAL (Physical Activity Level) gibt das Aktivitätsniveau an: 1,4 = überwiegend sitzend, kaum Freizeitaktivität; 1,6 = sitzend mit zeitweise Gehen und Stehen; 1,8 = überwiegend stehend oder gehend. 1,2–1,3 gilt für Bettlägerige, 2,0–2,4 für Schwerarbeit oder Leistungssport [10][11].

| Alter | PAL 1,4 m / w | PAL 1,6 m / w | PAL 1,8 m / w |
|---|---|---|---|
| 1 bis <4 J. | 1.200 / 1.100 | 1.300 / 1.200 | – |
| 4 bis <7 J. | 1.400 / 1.300 | 1.600 / 1.500 | 1.800 / 1.700 |
| 7 bis <10 J. | 1.700 / 1.500 | 1.900 / 1.800 | 2.100 / 2.000 |
| 10 bis <13 J. | 1.900 / 1.700 | 2.200 / 2.000 | 2.400 / 2.200 |
| 13 bis <15 J. | 2.300 / 1.900 | 2.600 / 2.200 | 2.900 / 2.500 |
| 15 bis <19 J. | 2.600 / 2.000 | 3.000 / 2.300 | 3.400 / 2.600 |
| 19 bis <25 J. | 2.400 / 1.900 | 2.800 / 2.200 | 3.100 / 2.500 |
| 25 bis <51 J. | 2.300 / 1.800 | 2.700 / 2.100 | 3.000 / 2.400 |
| 51 bis <65 J. | 2.200 / 1.700 | 2.500 / 2.000 | 2.800 / 2.200 |
| ≥ 65 J. | 2.100 / 1.700 | 2.500 / 1.900 | 2.800 / 2.100 |

**Zuschläge** [9]:
- **Schwangere:** +250 kcal/Tag im 2. Trimester, +500 kcal/Tag im 3. Trimester. Das gilt nur bei Normalgewicht vor der Schwangerschaft, wünschenswerter Gewichtsentwicklung und unverminderter Aktivität.
- **Stillende:** +500 kcal/Tag bei ausschließlichem Stillen in den ersten 4–6 Monaten.

**Säuglinge (unsicher):** Die DGE-Energietabelle beginnt online erst bei „1 bis <4 Jahre". Eine Drittquelle nennt 500 kcal (m) bzw. 450 kcal (w) für 0 bis <4 Monate [12]. **Diesen Wert und den Wert für 4–12 Monate habe ich nicht an der Primärquelle verifiziert.** Für die App ist das wenig relevant, weil Säuglinge über Säuglingsnahrung bzw. Stillen versorgt werden und nicht über die Lebensmittelgruppen (siehe Abschnitt 4).

**Europäischer Vergleich:** EFSA (2013) leitet Average Requirements aus Grundumsatz (Henry-Gleichungen) × PAL 1,4/1,6/1,8/2,0 ab. Bei PAL 1,6 liegen die Werte für Erwachsene von 30–39 Jahren bei ca. 2.000 (w) bis 2.600 (m) kcal und für 70–79 Jahre bei ca. 1.800–2.300 kcal [13]. Das liegt in derselben Größenordnung wie die DGE-Werte.

**Einordnung der 2.200 kcal:** Der Pauschalwert entspricht grob einem Mittelwert über Erwachsene. Für Männer mit PAL ≥ 1,6 und für Jugendliche ist er zu niedrig, für Frauen und Kinder zu hoch. In einer Krise ist die Aktivität teils niedriger (Ausharren zu Hause), teils höher (Kälte ohne Heizung, Wasser schleppen, Aufräumen nach Hochwasser). Dazu fand ich **keine offizielle Quelle, die einen Krisen-PAL empfiehlt.** Das ist eine Designentscheidung (Vorschlag: Standard PAL 1,6, wählbar).

### 3. Wasserbedarf

**DGE-Referenzwerte Wasserzufuhr (ml/Tag, Stand 2000)** [14]:

| Alter | Getränke | Wasser aus fester Nahrung | Oxidationswasser | Gesamt |
|---|---|---|---|---|
| 0 bis <4 Mon. | 620 | – | 60 | 680 |
| 4 bis <12 Mon. | 400 | 500 | 100 | 1.000 |
| 1 bis <4 J. | 820 | 350 | 130 | 1.300 |
| 4 bis <7 J. | 940 | 480 | 180 | 1.600 |
| 7 bis <10 J. | 970 | 600 | 230 | 1.800 |
| 10 bis <13 J. | 1.170 | 710 | 270 | 2.150 |
| 13 bis <15 J. | 1.330 | 810 | 310 | 2.450 |
| 15 bis <19 J. | 1.530 | 920 | 350 | 2.800 |
| 19 bis <25 J. | 1.470 | 890 | 340 | 2.700 |
| 25 bis <51 J. | 1.410 | 860 | 330 | 2.600 |
| 51 bis <65 J. | 1.230 | 740 | 280 | 2.250 |
| ≥ 65 J. | 1.310 | 680 | 260 | 2.250 |
| Schwangere | 1.470 | 890 | 340 | 2.700 |
| Stillende | 1.710 | 1.000 | 390 | 3.100 |

**EFSA (2010)** [15]: Die Adequate Intake (Gesamtwasser) beträgt 2,0 l (Frauen) und 2,5 l (Männer), gleich für Ältere. Für Kinder: 2–3 J. 1,3 l, 4–8 J. 1,6 l, 9–13 J. 1,9 l (w) bzw. 2,1 l (m). Säuglinge im 1. Halbjahr 100–190 ml/kg, 6–12 Monate 0,8–1,0 l. Schwangere +300 ml, Stillende +700 ml. Die Werte gelten **nur bei moderater Temperatur und PAL 1,6.**

**Wichtig für Vorräte:** Die DGE rechnet damit, dass ca. 1/3 des Wassers aus „normaler" fester Nahrung kommt. Ein Notvorrat besteht aber oft aus Trockenwaren wie Reis, Nudeln, Knäckebrot und Hülsenfrüchten. Diese liefern kaum Wasser und brauchen Kochwasser. Den Anteil aus Nahrung gibt es dann nur bei Konserven, H-Milch und Obst/Gemüse im Glas. Daraus folgt: **Trinkwasser plus Kochwasser einplanen.** Genau das tut die BBK-Pauschale (1,5 + 0,5 l). Hygienewasser (Zähneputzen, Waschen, Toilette) ist bei BBK/BLE und BWL **nicht** enthalten, bei FEMA schon (1 Gallone).

**Senioren:** Die BLE empfiehlt für 65+ ausdrücklich 2 l Trinkmenge [3]. Laut DGE-Tabelle haben Ältere zwar einen ähnlichen Gesamtbedarf, nehmen aber weniger Wasser über die Nahrung auf. Dass das Durstempfinden im Alter nachlässt, ist allgemein bekannt. **Eine Primärquelle dafür konnte ich in dieser Recherche nicht mehr abrufen** (Suchkontingent erschöpft).

**Hitze:** FEMA: „In very hot temperatures, water needs can double" [6]. EFSA-Werte gelten nur für moderate Temperaturen [15].

### 4. Babys und Kleinkinder

- **Säuglingsnahrung (Pulver):** Das BfR empfiehlt, sie immer frisch zuzubereiten, in den ersten Monaten mit **abgekochtem Wasser** (auf max. ca. 50 °C abgekühlt bei gesunden Reifgeborenen). Zubereitete Nahrung soll nicht länger als 2 h über 5 °C stehen. Gekauftes Wasser muss die Kennzeichnung „geeignet für die Zubereitung von Säuglingsnahrung" tragen [16][17]. Unterwegs oder nachts: abgekochtes Wasser in einer sauberen Thermoskanne, Pulver portioniert in trockenen Flaschen [16].
- **Konsequenzen für den Vorrat:** (a) Wasser speziell für Säuglingsnahrung, getrennt vom normalen Trinkwasser geplant. (b) **Energie zum Abkochen** (Gaskocher, Brennstoff), die bei Stromausfall nötig ist. (c) Wasser für Fläschchenhygiene (Reinigen und Auskochen). Für (c) fand ich keine offizielle Mengenangabe.
- **Trinkmenge Säugling:** Eltern-Ratgeber nennen als Faustregel ca. **1/6 (bis 1/5) des Körpergewichts** an Milch pro 24 h für junge Säuglinge, für Neugeborene in den ersten 10 Tagen „Lebenstag × 10 ml pro Mahlzeit" [18]. **Das sind keine Primärquellen.** Die EFSA-Werte (100–190 ml/kg/Tag Gesamtwasser im 1. Halbjahr) [15] stützen die Größenordnung (1/6 von 6 kg = 1 l ≈ 167 ml/kg). Empfehlung: In der App die **Dosierangabe auf der Packung** als maßgeblich darstellen und nur eine Schätzung anbieten.
- **Gestillte Babys:** Keine Säuglingsnahrung nötig. Die stillende Person bekommt +500 kcal [9] und mehr Wasser: DGE gesamt 3.100 statt 2.600 ml [14], EFSA +700 ml [15]. Als Rückfallebene trotzdem eine kleine Reserve Pre-Nahrung vorschlagen. Das ist eine Designidee, keine Quellenempfehlung.
- **Beikost-Alter (ca. 5–12 Mon.):** Gläschen und Breie lassen sich gut lagern. Mengen müssen individuell festgelegt werden. Konkrete Vorratsmengen fand ich in keiner offiziellen Quelle.
- **Windeln, Feuchttücher und Ähnliches** sind kein Ernährungsthema, gehören aber in den Baby-Bedarf (FEMA nennt „infant formula and diapers" [19]).

### 5. Allergien, Unverträglichkeiten, Diäten

- Das BBK weist pauschal darauf hin, Unverträglichkeiten und Allergien sowie Sonderkost (Diabetiker, Allergiker, Babys) zu berücksichtigen [1][5]. **Konkrete Mengen oder Ersatzlisten nennt es nicht.**
- Die BLE stellt neben der Mischkost-Tabelle eine **vegetarische Vorratstabelle** bereit [8][20]. Eine **vegane oder glutenfreie offizielle Tabelle habe ich nicht gefunden.**
- Ableitbare Logik für die App:
  - **Vegetarisch/vegan:** Die Gruppe „Eier/Fleisch/Fisch" wird durch Hülsenfrüchte, Nüsse und Sojaprodukte ersetzt. „Milch/-produkte" wird bei veganer Ernährung durch angereicherte Pflanzendrinks (H-Ware) ersetzt. Gesamt-kcal bleiben gleich. Bei veganer Ernährung **Vitamin B12** als „Vorrats-Item" mitdenken (Nährstoff-Hintergrund nicht in dieser Recherche verifiziert).
  - **Glutenfrei:** Die Getreidegruppe auf Reis, Mais, Hirse, Kartoffelflocken und glutenfreie Produkte beschränken. Das Kreuzkontaminationsrisiko spricht für einen eigenen, gekennzeichneten Lagerplatz (Fachinformation zu Zöliakie [21], nicht vorratsspezifisch).
  - **Allergene:** Die 14 deklarationspflichtigen Allergene der EU-LMIV kann die App über Barcode-Daten automatisch markieren. Datenquelle und Verfügbarkeit klärt Recherche 03/04, nicht hier.
- **Diabetes, Medikamente:** Sonderkost (z. B. schnelle Kohlenhydrate gegen Unterzuckerung) und Medikamente sind medizinisch individuell. Die App sollte hier **nur erinnern, nicht berechnen.**

### 6. Haustiere

| Tier | Energiebedarf (Erhaltung) | Wasser | Quelle / Status |
|---|---|---|---|
| Hund | **MER ≈ 110 kcal × kg KG^0,75** (FEDIAF-Wert für 3–7-jährige Hunde; reale Spanne je nach Aktivität und Rasse deutlich größer) | Faustregel **50–60 ml/kg/Tag**, bei Hitze oder Trockenfutter bis 80–100 ml/kg | Energie: FEDIAF-Leitlinien laut UK Pet Food [22][23]. Wasser: nur Ratgeberseiten [24], **keine Primärquelle verifiziert** |
| Katze | **MER ≈ 100 kcal × kg KG^0,67** | ca. **60 ml/kg/Tag** (Nassfutter deckt einen großen Teil) | Energie: UK Pet Food Faktenblatt [22]. Wasser: Ratgeber [24], **unverifiziert** |

- Das BBK nennt Tierfutter (Dosen- und Trockenfutter) als Vorratsposten, aber ohne Mengen [5]. FEMA nennt „pet food and extra water for your pet" [19].
- **Am genauesten:** die Fütterungsempfehlung auf der Packung bzw. die gewohnte Tagesration (g/Tag) × Tage. Die kcal-Formel dient nur als Plausibilitätscheck oder Schätzung, wenn keine Ration bekannt ist.

### 7. kcal-basiert vs. kg-basiert: Vergleich

| Kriterium | kg-basiert (BLE-Gruppen) | kcal-basiert |
|---|---|---|
| Nähe zur offiziellen Empfehlung | sehr nah, 1:1 übernehmbar | indirekt (2.200 kcal als Basis) |
| Ausgewogenheit (Gruppen) | gut abgebildet | nicht abgebildet (theoretisch 100 % Schokolade) |
| Individualisierung (Kind vs. Mann) | schlecht | gut (DGE-Werte) |
| Bestandsbewertung | einfach (Gewicht vom Etikett) | braucht Nährwert (kcal/100 g, oft über Barcode verfügbar) |
| Verständlichkeit | „4 kg Gemüse" ist greifbar | „82.000 kcal" ist abstrakt, aber als „Tage" gut darstellbar |
| Umgang mit Trocken- vs. Nassware | ungenau (1 kg Reis ≠ 1 kg Dosenmais) | genau |

**Empfehlung: ein hybrides Modell** (siehe Formeln).

---

## Bedeutung für Preposaurus

### Vorgeschlagene Formeln

**F1 Energiebedarf je Person i (kcal/Tag):**
```
E_i = DGE(Alter, Geschlecht, PAL) + Zuschlag_i
Zuschlag: Schwangerschaft 2. Trim. +250, 3. Trim. +500; Stillen (ausschließlich) +500
PAL-Default = 1,6 (wählbar 1,4 / 1,6 / 1,8; Option „Krisenmodus" als Designentscheidung)
Säugling < 12 Mon.: nicht über Lebensmittelgruppen, sondern Sonderpfad Säuglingsnahrung
```

**F2 Personen-Äquivalent (PÄ):**
```
PÄ_i = E_i / 2.200        (Bezugswert von BBK/BLE)
PÄ_Haushalt = Σ PÄ_i
```

**F3 Soll-Menge Lebensmittelgruppe g (kg):**
```
Soll_g = Tagesmenge_BLE_g × PÄ_Haushalt × Zieltage
```
(Optional nach Ernährungsform: Austausch der Gruppen, z. B. vegan, bei gleicher kcal-Summe.)

**F4 Wasser je Person i (l/Tag):**
```
W_i = Trinken_i + Kochen_i (+ Hygiene_i optional) (+ Babyflaschen_i)
Trinken: Erw. 1,5 | Kinder ≤ 12 J. 1,0 | Senioren 65+ 2,0     (BLE) [3]
         Alternative „genau": DGE-Getränkewert je Altersgruppe [14]
Kochen:  0,5 je Person, die feste Vorratskost isst (BBK) [1]
Stillende: + 0,5–0,7 (DGE/EFSA)
Hitze-Faktor: × bis 2,0 (FEMA)
Hygiene-Option: bis 1 Gallone ≈ 3,8 l Gesamt (FEMA-Modus)
```

**F5 Bestand → „Tage Reichweite":**
```
kcal_Bestand = Σ (Nettogewicht_g × kcal/100 g / 100)   (nur nicht abgelaufene Artikel)
Reichweite_Tage_Energie = kcal_Bestand / Σ E_i
Reichweite_Tage_Wasser  = Liter_Bestand / Σ W_i
Reichweite_Gesamt = min(Energie, Wasser, ggf. je Gruppe)  → „schwächstes Glied"
```

**F6 Haustier:**
```
Futter_g/Tag = gewohnte Ration (bevorzugt)  ODER  MER / (kcal pro 100 g Futter) × 100
MER Hund ≈ 110 × kg^0,75 ; Katze ≈ 100 × kg^0,67
Wasser ≈ 50–60 ml/kg/Tag (Hund), ≈ 60 ml/kg (Katze) → als Schätzung kennzeichnen
```

**F7 Säugling (Formula):**
```
Pulver_g/Tag  = laut Packung (Eingabe) ODER Schätzung Milchvolumen ≈ Körpergewicht/6 × Dosierung
Wasser_Baby   = Milchvolumen + Reserve (Abkochverluste/Spülen, Vorschlag +20 %, nicht belegt)
Flag: „Energiequelle zum Abkochen vorhanden?"
```

### Rechenbeispiel (Haushalt mit 4 Personen, Ziel 10 Tage, PAL 1,6)

| Person | E_i (kcal) | PÄ | Wasser (l/Tag, BLE-Logik) |
|---|---|---|---|
| Mann, 38 | 2.700 | 1,23 | 2,0 |
| Frau, 36 | 2.100 | 0,95 | 2,0 |
| Junge, 6 | 1.600 | 0,73 | 1,0 (+0,5 Kochen?) |
| Frau, 72 | 1.900 | 0,86 | 2,0 (+0,5 Kochen) |
| **Summe** | **8.300** | **3,77** | **7,0–8,0** |

Mit der Pauschale wären es 4 × 2.200 = 8.800 kcal/Tag. Das individuelle Modell spart in diesem Beispiel rund 6 %. Bei einem Haushalt mit Teenagern läge es dagegen *über* der Pauschale. Für 10 Tage ergeben sich 83.000 kcal und ca. 70–80 l Wasser. Getreide z. B.: 0,33 kg × 3,77 × 10 ≈ 12,4 kg.
*Offene Designfrage:* Ob für Kinder und Senioren zusätzlich 0,5 l Kochwasser anfallen, geht aus der BLE-Seite nicht eindeutig hervor.

### Konkrete Produktideen

1. **Personenprofil-Wizard** mit Piktogrammen (Baby, Kind, Teen, Erwachsener, Senior, Schwangere/Stillende, Hund, Katze). Pflicht: Alter, Geschlecht. Optional: Aktivität (3 Icons), Ernährungsform, Allergien.
2. **Zwei Rechenmodi:** „Offiziell (BBK/BLE-Pauschale)" als Default, weil er quellentreu und einfach ist, und „Individuell (DGE)" für Fortgeschrittene. Die verwendete Quelle und Formel steht immer transparent daneben (Info-Button).
3. **Dashboard „Reichweite in Tagen"** getrennt nach Energie, Wasser und je Lebensmittelgruppe. Das schwächste Glied wird hervorgehoben („Wasser reicht nur 4 von 10 Tagen").
4. **Sonder-Checklisten je Profiltyp:** Baby (Pulver, Wasser „für Säuglingsnahrung geeignet", Kocher, Brennstoff, Flaschen, Windeln), Senior (Trinkmenge, Medikamente), Haustier (Futter, Wasser, Napf), Diabetes (Traubenzucker).
5. **Ernährungsform-Mapping:** vegetarisch (BLE-Tabelle), vegan und glutenfrei als abgeleitete Tauschregeln, **klar gekennzeichnet als „abgeleitet, nicht offiziell"**.
6. **Klima-/Szenario-Schalter:** Hitze (×2 Wasser), Hygiene-Wasser einplanen (FEMA-Modus), Stromausfall (Lebensmittel ohne Kochen bevorzugen, siehe Kochwasser).
7. **Nährwerte per Barcode** (kcal/100 g, Nettogewicht, Allergene) machen den kcal-Modus fast ohne Mehraufwand möglich. Fallback sind Durchschnittswerte je Kategorie.
8. **Disclaimer:** keine medizinische Beratung. Bei Säuglingen, Schwangerschaft, Erkrankungen oder Haustier-Diäten auf Fachpersonen bzw. die Packungsangabe verweisen.

---

## Offene Fragen

1. **Verifikation der BLE-Tabellenwerte:** Die Tagesmengen (BLE-Webseite) und die 10-Tage-Mengen (BBK-Checkliste in Drittquellen) weichen leicht voneinander ab. Die BLE-PDF [8] und die aktuelle BBK-Broschüre müssen im Original geprüft werden. Die BBK-Bevorratungsseite lieferte bei Abruf einen 404-Fehler (URL hat sich geändert).
2. **DGE-Energiewerte für Säuglinge** (0–4 und 4–12 Monate) aus der Primärquelle holen. Ist die DGE-Tabelle von 2015 noch aktuell, oder gibt es eine Überarbeitung (D-A-CH)?
3. **Wasser-Referenzwerte DGE** haben Stand 2000. Gibt es aktualisierte D-A-CH-Werte?
4. **Krisen-PAL:** Gibt es eine offizielle oder wissenschaftliche Empfehlung zum Energiebedarf in Krisensituationen (Kälte, Stress, körperliche Arbeit)? Ansatzpunkte wären z. B. die UNHCR/WFP-Planungswerte von 2.100 kcal (nicht recherchiert).
5. **Senioren:** Primärquelle zum verminderten Durstempfinden und zu Dehydratationsrisiken (z. B. DGE, ESPEN-Leitlinie) noch nicht verifiziert.
6. **Haustier-Wasserbedarf:** Primärquelle (z. B. NRC 2006, WSAVA) fehlt. Die Werte stammen aus Ratgeberseiten.
7. **Säuglingsnahrung:** Gibt es eine offizielle Empfehlung, wie viele Tage oder Packungen Pre-Nahrung bevorratet werden sollen, und wie viel Wasser man für Flaschenhygiene braucht? (Netzwerk Gesund ins Leben, BfR?)
8. **Vegan/glutenfrei:** Gibt es offizielle Vorratstabellen (z. B. von der Deutschen Zöliakie-Gesellschaft oder vom BZfE)?
9. **Andere Länder:** Wie rechnen Österreich (Zivilschutzverband), die Schweiz (BWL) und FEMA Kinder bzw. Senioren? Abgleich mit den Recherchen 07/08/11.
10. **Datenqualität von Barcode-Nährwerten** (Vollständigkeit der kcal-Angaben) als Voraussetzung für den kcal-Modus.

---

## Quellen

(Abruf jeweils 2026-10-06)

1. BBK: Ratgeber für Notfallvorsorge und richtiges Handeln in Notsituationen, Checkliste (Kopie THW OV Hagen). https://ov-hagen.thw.de/fileadmin/user_upload/LVNW/GBOC/OHAG/Downloads/Notfallinformationen/ratgeber-notfallvosorge-checkliste.pdf
2. Verbraucherzentrale Niedersachsen: Lebensmittelvorrat für Zuhause. https://www.verbraucherzentrale-niedersachsen.de/wissen/lebensmittel/auswaehlen-zubereiten-aufbewahren/lebensmittelvorrat-fuer-zuhause-so-sind-sie-fuer-ausnahmesituationen-vorbereitet-120155
3. BLE, ernaehrungsvorsorge.de: Vorratskalkulator. https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratskalkulator/
4. rechner-portal.de: Notvorrat-Rechner (Drittquelle, beschreibt BLE-Logik). https://rechner-portal.de/kochen-ernaehrung/ernaehrung/notvorrat-rechner
5. echo24.de: Einkaufen für den Notfall (zitiert BBK). https://www.echo24.de/leben/verbraucher/vorrat-lebensmittel-menschen-liste-bbk-strom-ausfall-notfall-einkaufen-gas-katastrophen-91402221.html
6. FEMA / Ready.gov: Water. https://www.ready.gov/water
7. Kanton St. Gallen / BWL: Broschüre Notvorrat. https://www.sg.ch/content/dam/sgch/kbs/Broschuere_Notvorrat.pdf
8. BLE: Anhang 3.1 Vorratstabelle Mischkost (DIN A4, 2024). https://www.ernaehrungsvorsorge.de/fileadmin/SITE_MASTER/content/Dokumente/Anhang_3.1_Vorratstabelle_Mischkost_-_DIN_A4.pdf
9. DGE: Referenzwerte Energie. https://www.dge.de/wissenschaft/referenzwerte/energie/
10. Verbraucherzentrale NRW: Ernährung, Umsatz, Kalorien. https://www.verbraucherzentrale.nrw/wissen/lebensmittel/gesund-ernaehren/ernaehrung-umsatz-kalorien-wie-viel-energie-benoetigt-der-koerper-102519
11. DGE: FAQ Energie (2015, PDF). https://www.dge.de/fileadmin/dok/gesunde-ernaehrung/faq/DGE-FAQ-Energie-2015.pdf
12. Ärzte Zeitung: Wie viele Kalorien braucht ein Mensch? (Drittquelle für Säuglingswerte). https://www.aerztezeitung.de/Medizin/Wie-viele-Kalorien-braucht-ein-Mensch-246487.html
13. EFSA NDA Panel (2013): Scientific Opinion on Dietary Reference Values for energy, EFSA Journal 11(1):3005. https://efsa.europa.eu/en/efsajournal/pub/3005
14. DGE: Referenzwerte Wasser. https://www.dge.de/wissenschaft/referenzwerte/wasser/
15. EFSA (2010): Dietary reference values for water / Pressemitteilung. https://www.efsa.europa.eu/en/press/news/nda100326
16. BfR: Säuglingsnahrung in Babyflaschen möglichst frisch zubereiten. https://www.bfr.bund.de/presseinformation/saeuglingsnahrung-in-babyflaschen-moeglichst-frisch-zubereiten/
17. BfR: Empfehlungen zur hygienischen Zubereitung pulverförmiger Säuglingsnahrung (PDF). https://www.bfr.bund.de/cm/343/empfehlungen-zur-hygienischen-zubereitung-pulverfoermiger-saeuglingsnahrung.pdf
18. babyartikel.de: Trinkmenge Baby Tabelle (Ratgeber, keine Primärquelle). https://www.babyartikel.de/magazin/trinkmenge-baby-tabelle
19. FEMA Preparedness Checklist (PDF-Kopie). https://lakesidecommittee.princeton.edu/wp-content/uploads/sites/315/2018/09/FEMA-Preparedness-Checklist.pdf
20. BLE: Anhang 3.2 Vorratstabelle vegetarisch. https://www.ernaehrungsvorsorge.de/fileadmin/SITE_MASTER/content/Dokumente/Anhang_3.2_Vorratstabelle_vegetarisch_-_DIN_A4.pdf
21. Apotheken Umschau: Zöliakie – verstecktes Gluten vermeiden. https://www.apotheken-umschau.de/krankheiten-symptome/magen-und-darmerkrankungen/hilfe-bei-zoelliakie-verstecktes-gluten-vermeiden-1107097.html
22. UK Pet Food (PFMA): Calorie factsheet. https://pfma.org.uk/calorie-factsheet
23. FEDIAF Nutritional Guidelines (PDF-Kopie, ältere Fassung). https://clasi.edvance360.com/upload/case/media/dropbox/FEDIAF_Nutrtion_Guideline161214_1.pdf
24. hundeo.com: Wasserbedarf-Rechner (Ratgeber, keine Primärquelle). https://www.hundeo.com/rechner/wasserbedarf
