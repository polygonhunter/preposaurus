# Preposaurus – Entscheidungen Runde 1

> Stand 2026-11-22 · gebündelt aus den Strängen Design, Datenstruktur, Einstellungen, Onboarding und dem UX-Konzept.
> Aus 57 Einzelfragen sind **25** geworden. Der Rest hat sich erledigt oder war eine Technikfrage (siehe unten „Von uns entschieden“).
> Herleitung und Widersprüche: `ABGLEICH.md`.
> **Antworten (2026-11-24):** Der Maintainer hat die Fragen delegiert. Je Frage steht die Entscheidung „vom Maintainer delegiert, entschieden nach Empfehlung“ bzw. „überholt durch …“ in `05_STATUS_ENTSCHEIDUNGEN.md`, Abschnitt „Delegierte Entscheidungen“. Frage 11 hat der Maintainer selbst entschieden (a, #298).

**So antwortest du:** Nummer und „ok“ reicht, wenn die Empfehlung passt. Sonst Nummer und Buchstabe oder ein Halbsatz. Beispiel: `2 ok · 6 c · 13 ok · 20 b`. „Alles ok außer 6 und 20“ geht auch.
Was hier nicht als Frage steht und in den Konzepten keinem Punkt unten widerspricht, gilt mit deiner Antwort als freigegeben.

---

## Grundsätzliches

### 1 · Design-Richtung
Drei visuelle Richtungen stehen zur Wahl: A „Vorratskammer“, B „Fahrplan“, C „Haushaltsbuch“.
Ansehen: https://claude.ai/artifact/QwPZP47uf6jWWHRcbxNvD3
- a) A
- b) B
- c) C
- d) C als Grundlage, mit der Ordnung von B (Datum als feste Spalte in „Bald fällig“, am PC Tabellen statt Karten)
- e) anderer Mix

**Empfehlung (Design-Strang): d.**
Betrifft: Design, alle UI-Pakete.

### 2 · UX-Konzept freigeben
Das UX-Konzept ändert einiges gegenüber dem alten Entwurf: Übersicht als Satz mit zwei Balken (Essen, Wasser), eigene Seite „Bald fällig“ mit Knöpfen je Zeile, Vorrat in zwei Tipps bis zur Lebensmittelart, „−1“ direkt in der Liste, Verlauf statt der Filter „Verbraucht“ und „Entsorgt“, ein Chip je Datum mit Anzahl beim Erfassen, von Hand ein einziges Formular. Die eigene Wasser-Kachel und die Kachel „Foto aufnehmen“ entfallen.
- a) so freigeben
- b) freigeben mit Änderungen (bitte nennen)

**Empfehlung: a.**
Betrifft: UX, Design, Datenstruktur (Nachkaufen-Tabelle), Katalog.

### 3 · Angaben zu Personen
Für die Rechnung nach BBK reicht je Person der Typ (Erwachsene:r, Kind, Baby …). Geburtsdatum, Geschlecht, Gewicht, Aktivität, schwanger oder stillend und Allergien würden im MVP nirgends verwendet.
- a) im MVP gar nicht speichern: nur Name, Typ, Ernährungsform. Die Felder kommen später zusammen mit der Funktion, die sie braucht
- b) Felder anlegen und leer lassen

**Empfehlung: a.** Es sind Gesundheitsdaten ohne Zweck.
Betrifft: Datenstruktur, Einstellungen, Onboarding.

### 4 · Mail im MVP
Ohne E-Mail-Adresse am Konto kann die App keine Mails schicken. Erinnerungen kämen dann nur als Push. Wer Push nicht erlaubt, sieht alles in der App, bekommt aber nichts zugeschickt.
- a) keine Mail im MVP: Check-in-Mail und „Mail statt Push“ entfallen, der Mailversand wird nicht eingerichtet
- b) freiwilliges Feld „E-Mail für Erinnerungen“ schon im MVP

**Empfehlung: a.** Später als freiwilliges Feld, getrennt von der Anmeldung.
Betrifft: Einstellungen, Datenstruktur, Onboarding, Technik.

### 5 · Erinnerungen für den Haushalt oder je Person
Bisher sollte jede:r die eigenen Erinnerungen einstellen. Seit „keine privaten Daten“ läge es näher, dass der Haushalt einen Zeitpunkt hat.
- a) je Haushalt: ein Wochentag und eine Uhrzeit für die Wochenübersicht, „Dringend“ an oder aus. Je Gerät nur Push an oder aus
- b) je Person

**Empfehlung: a.**
Betrifft: Einstellungen, Datenstruktur.

---

## Erfassen

### 6 · Packung ohne Datum: Soll die App ein Datum schätzen können?
Entschieden ist: Ohne lesbares Datum wird die Packung mit „Datum fehlt“ gespeichert, eine Schätzung gibt es nur auf Wunsch. Offen ist, woher die Schätzung kommt. Auch eine KI kennt ohne Aufdruck nur die übliche Haltbarkeit. Und es gilt bisher: Die übliche Haltbarkeit wird nie als Datum verwendet.
- a) im MVP gar nicht schätzen: nur „Datum fehlt“, später von Hand nachtragen
- b) Knopf „Schätzen“ rechnet heute + übliche Haltbarkeit der Lebensmittelart. Ohne KI, auf den Monat genau, als „geschätzt“ markiert. Geht auch, wenn die Foto-Erkennung aus ist
- c) Knopf „Von der KI schätzen lassen“: eigener KI-Aufruf, kostet etwas, geht nur mit eingeschalteter Erkennung

**Empfehlung: b.** Die Regel heißt dann: nie *automatisch* als Datum. Den Knopf gibt es erst, wenn die Haltbarkeitswerte geprüft sind. Ein geschätztes Datum zählt wie ein echtes, die App nennt die Zahl der geschätzten Packungen in der Erklärung.
Betrifft: Datenstruktur, UX, Einstellungen (KI-Rollen).

### 7 · Nährwerte ohne Tabelle: Wann wird bestätigt?
Entschieden ist: Geschätzte Nährwerte tragen ein „ca.“ und müssen gesondert bestätigt werden. Offen ist der Zeitpunkt.
- a) beim Speichern: ein bewusster Tipp „Mit ca.-Werten speichern“. Unbestätigte Schätzungen gibt es dann nicht
- b) nachträglich: Die Packung wird erst gespeichert, die Schätzung steht bis zur Bestätigung unter „Unvollständig“

**Empfehlung: a.** Ein Tipp mehr, dafür kein offener Rest. Das „ca.“ bleibt in beiden Fällen, bis echte Werte vom Etikett oder von Hand da sind.
Betrifft: Datenstruktur, UX.

### 8 · Nährwerte ohne Tabelle: Woher kommt der Wert?
- a) zuerst der feste Richtwert der Lebensmittelart (kostenlos, immer gleich). Die KI schätzt nur, wenn es für die Art keinen Richtwert gibt
- b) zuerst die KI (anhand von Foto und Art), der Richtwert nur als Ersatz

**Empfehlung: a.** Hinweis: Die Richtwerte sind noch leer, bis du die Startliste und das Prüfblatt freigibst (#128, #19). Bis dahin greift die KI-Schätzung oder „Nährwerte fehlen“.
Betrifft: Datenstruktur, Einstellungen (KI-Rollen), UX.

### 9 · Foto-Erfassung: von selbst weitergehen?
Ist sich die Erkennung sicher, könnte die App ohne „Weiter“ zum nächsten Foto springen. Das spart 3 Tipps. Geprüft wird trotzdem alles vor dem Speichern.
- a) immer jede Karte bestätigen
- b) zum Start jede Karte bestätigen. Zeigt der Test mit echten Fotos, dass „sicher“ selten falsch liegt, wird auf selbst weitergehen umgestellt. Kein Schalter
- c) sofort selbst weitergehen, mit Schalter „Jeden Schritt bestätigen“ in den Einstellungen

**Empfehlung: b.**
Betrifft: UX, Einstellungen, Datenstruktur.

### 10 · Wann sind zwei Packungen dasselbe Produkt?
Beim Nachschub schlägt die App vor: „Zu Spaghetti 500 g hinzufügen?“
- a) gleich bei gleicher Lebensmittelart, Menge und Behälter. Wer dieselbe Art an zwei Lagerorten hat, bekommt zwei Einträge unter derselben Lebensmittelart. Für „Vollkorn“ und Ähnliches gibt es ein freies Zusatzfeld am Produkt. Eine eigene Lebensmittelart nur, wenn sich Nährwerte oder Ernährungsform deutlich unterscheiden
- b) strenger oder lockerer (bitte nennen)

**Empfehlung: a.** Das legt auch die Tiefe der Startliste fest (#128).
Betrifft: UX, Datenstruktur.

### 11 · Dürfen Mitglieder beim Erfassen Neues anlegen?
Fehlt beim Erfassen ein Lagerort oder eine Lebensmittelart, müsste sonst ein Admin einspringen.
- a) ja: Mitglieder dürfen Lagerorte und Lebensmittelarten anlegen. Umbenennen, ausblenden und Richtwerte bleiben beim Admin
- b) nur Lagerorte
- c) nein, nur Admin

**Empfehlung: a.**
Betrifft: Einstellungen, Datenstruktur.

**Entschieden (Maintainer, 2026-11-24): a** („Auch Mitglieder“, #298). Lebensmittelarten beim Erfassen sind umgesetzt (#298), der Lagerort beim Erfassen mit #301.

### 12 · „Packungen hinzufügen“ schon im MVP?
Ein Knopf auf der Seite einer Lebensmittelart, der direkt zu Datum und Anzahl springt. Bisher als „später“ eingeplant.
- a) ins MVP
- b) später

**Empfehlung: a.** Größter Hebel für Nachschub, kein eigener Ablauf.
Betrifft: UX, Datenstruktur.

---

## Vorrat und Rechnung

### 13 · Die große Zahl: ganze Tage?
- a) im Satz ganze Tage („reicht für 6 Tage“, abgerundet), die Nachkommastelle nur an den Balken
- b) überall eine Nachkommastelle („6,0 Tage“)

**Empfehlung: a.**
Betrifft: UX, Design, Fachlogik.

### 14 · Was heißt „diese Woche“ und wann kommt die Dringend-Nachricht?
- a) „Diese Woche“ sind fest 7 Tage. Die Push-Nachricht „Dringend“ meldet nur, was neu in diese 7 Tage gerutscht ist, höchstens einmal am Tag
- b) die Nachricht meldet schon ab der einstellbaren Schwelle (Standard 28 Tage)

**Empfehlung: a.**
Betrifft: UX, Datenstruktur, Einstellungen.

### 15 · Wasser und andere Getränke
- a) Wasser-Tage zählen nur Wasser. Saft, Pflanzendrinks und Ähnliches stehen daneben und zählen über ihre Kalorien zum Essen
- b) alle Getränke zählen zu den Wasser-Tagen

**Empfehlung: a.**
Betrifft: UX, Fachlogik, Startliste.

### 16 · Konserven: Füllmenge oder Abtropfgewicht?
- a) mit dem Abtropfgewicht rechnen, wenn es erfasst ist, sonst mit der Füllmenge. Vor dem Bauen an drei echten Dosen prüfen
- b) immer Füllmenge

**Empfehlung: a.**
Betrifft: UX, Fachlogik.

### 17 · „Noch gut“ mit eingeschaltetem Schalter: wie lange?
Entschieden ist: Eine geprüfte, abgelaufene Packung zählt nur mit, wenn der Schalter an ist, und nie am Zieldatum.
- a) ohne Frist, bis die Packung verbraucht oder entsorgt ist. Die Erklärung nennt, wie viele geprüfte Packungen mitzählen
- b) 30 Tage ab Prüfung, danach steht sie wieder unter „Abgelaufen“

**Empfehlung: a.** Keine wiederkehrende Mahnung.
Betrifft: UX, Datenstruktur.

---

## Einstellungen und Nutzer

### 18 · Regeln für die Anmeldung (ein Paket)
- Passwort mindestens 10 Zeichen, keine Pflicht für Sonderzeichen, einfache Sperrliste
- von der App erzeugte Passwörter sind vier Wörter (`Linse-Regal-Hafer-Wolke`), der Admin darf ein eigenes eintragen
- ein vom Admin vergebenes Passwort zu ändern wird angeboten, nicht erzwungen
- angemeldet bleibt man 180 Tage ab der letzten Nutzung
- mehrere Admins sind erlaubt
- nach 5 Fehlversuchen wächst eine Wartezeit, eine Dauersperre gibt es nicht

**Empfehlung: Paket so annehmen.** Abweichungen bitte einzeln nennen.
Betrifft: Einstellungen, Onboarding.

### 19 · Aufbau der Einstellungen
- a) vier Bereiche: „Konto und Gerät“ (statt „Mein Konto“) · Haushalt · Nutzerverwaltung · Daten und System. Die Foto-Erkennung steht unter „Haushalt“
- b) wie a, aber die Foto-Erkennung unter „Daten und System“

**Empfehlung: a.**
Betrifft: Einstellungen, Design.

### 20 · Dunkle Darstellung und Startansicht
- a) im MVP nur hell. Dunkel kommt später als Wahl je Gerät. Die Einstellung „Startansicht“ entfällt ganz
- b) die App folgt von Anfang an der Einstellung des Geräts
- c) Umschalter hell/dunkel schon im MVP

**Empfehlung: a.** Die dunklen Farben werden trotzdem jetzt mit festgelegt.
Betrifft: Einstellungen, Design.

---

## Onboarding

### 21 · Foto-Erkennung in der Ersteinrichtung
Der API-Schlüssel wird jetzt in der App eingetragen. Der geplante Schritt in der Einrichtung erschien aber nur, wenn der Schlüssel schon in der Server-Datei steht.
- a) kein Schritt in der Einrichtung. Auf der Übersicht steht unter „Erste Schritte“ der Eintrag „Foto-Erkennung einrichten“, er führt in die Einstellungen (Schlüssel eintragen, testen, einschalten)
- b) Schritt nur, wenn der Schlüssel schon in der Server-Datei steht
- c) Schritt für alle, mit Feld für den Schlüssel

**Empfehlung: a.** Ein Ort für die Einrichtung, die 2 Minuten bleiben. Dazu: Wer als Admin einschaltet, hat den Hinweis „Fotos gehen an Anthropic“ damit bestätigt. Alle anderen bestätigen ihn vor ihrem ersten Foto.
Betrifft: Onboarding, Einstellungen.

### 22 · Die Übersicht am Anfang
Solange Essen oder Wasser für weniger als einen Tag da ist, stünde oben „reicht für 0 Tage“.
- a) Startphase: statt der großen 0 ein Anfangssatz mit dem Ziel und dem nächsten Schritt. Darunter eine Liste „Erste Schritte“, die auch Mitglieder mit ihren eigenen Punkten sehen. Einmalige ruhige Rückmeldungen (erste Packung, 3 Tage geschafft, Ziel erreicht), keine Abzeichen
- b) von Anfang an die echte Zahl, auch 0

**Empfehlung: a.**
Betrifft: Onboarding, UX, Design.

### 23 · Ernährungsform in der Einrichtung
- a) in Schritt 2 eine eingeklappte Zeile „Isst jemand vegetarisch oder vegan?“, Standard „alles“
- b) nicht abfragen, nur in den Einstellungen

**Empfehlung: a.** Kostet keinen Tipp und verhindert wochenlang falsche Zielmengen.
Betrifft: Onboarding, Einstellungen.

### 24 · Wer darf einrichten, und über welche Adresse?
- a) das erste Konto lässt sich nur über die verschlüsselte Tailscale-Adresse anlegen (oder direkt am NAS). Wer zuerst öffnet, wird Admin, ohne zusätzlichen Code
- b) zusätzlich ein Code aus dem Server-Log
- c) Einrichtung auch über die unverschlüsselte Adresse erlauben

**Empfehlung: a.**
Betrifft: Onboarding, Einstellungen.

---

## Später

### 25 · Auf später verschieben (ein Paket)
- „Bald fällig“ statt „Statistik“ in die untere Leiste: erst nach dem ersten Test mit Nutzern neu bewerten
- Wischen als Abkürzung in „Bald fällig“
- Zeile „Zuletzt entnommen“ im Vorrat
- Umschalter „Heute / am Zieldatum“ für die ganze Übersicht
- „Eiweiß reicht X Tage“
- Anzeige der Fehlversuche für den Admin, Benutzernamen ändern, Liste der angemeldeten Geräte
- Export mit Fotos, CSV-Export, Import
- offene Schnittstelle für Home Assistant (später, nur lesend)
- ein Beispielvorrat zum Ausprobieren: gar nicht

**Empfehlung: alles so verschieben.**
Betrifft: alle Stränge.

**Weiter offen aus `05`, hier nicht neu gestellt:** Offline (nur anzeigen oder auch eintragen), NAS-Modell, Startliste der Lebensmittelarten prüfen (#128), offizielle Werte prüfen (#19).

---

## Von uns entschieden

Erledigt durch den Abgleich oder reine Technik. Vorläufige Werte sind als benannte Konstante angelegt und mit einem Wort änderbar.

| Nr. | Entscheidung | Warum |
|---|---|---|
| E-1 | Die Datenbank behält eine technische E-Mail-Spalte (`<id>@nutzer.invalid`). Sie wird nie angezeigt, nie angeschrieben, nie exportiert | Die Anmelde-Bibliothek verlangt die Spalte |
| E-2 | Jedes Produkt hat eine Lebensmittelart. Kategorie und Warengruppe werden daraus abgeleitet und nicht doppelt gespeichert | folgt aus dem Baum (05) |
| E-3 | Zielmengen je Ernährungsform stehen als fertige, geprüfte Zeilen in der Datenbank. Die Verschiebungsregeln erzeugen und prüfen diese Zeilen nur noch | eine Wahrheit statt zwei, gleiche Zahlen |
| E-4 | Keine persönliche Einstellungstabelle. „Zuletzt genutzter Lagerort“ und „zuletzt Foto oder von Hand“ kommen aus der letzten Erfassung | keine privaten Daten (05) |
| E-5 | „ca.“ hängt an der Herkunft eines Werts, nicht an der Bestätigung. Richtwerte werden live gelesen, nicht ins Produkt kopiert | so wirken spätere Korrekturen der Richtwerte sofort |
| E-6 | Beim Entnehmen kommen Packungen ohne Datum zuletzt | steht so auch in #121 |
| E-7 | „Noch gut“ zählt nie am Zieldatum. Die Fachlogik rechnet das heute falsch und wird korrigiert | #117 |
| E-8 | Summen für Eiweiß, Kohlenhydrate und Fett sind im MVP, auf jeder Ebene. Lebensmittelarten bekommen dafür Makro-Richtwerte | 05, UX-Frage 2 erledigt |
| E-9 | Der kcal-Richtwert der Lebensmittelart darf rechnen, mit „ca.“ | 05, UX-Frage 3 erledigt |
| E-10 | Das Kennzeichen „geschätzt“ am Datum bleibt. Eine Schätzung ist höchstens auf den Monat genau | 05, UX-Frage 4 erledigt |
| E-11 | Hinweise, Meilensteine und „Erste Schritte“ merkt sich das Gerät im Browser. Keine Tabelle dafür | keine privaten Daten |
| E-12 | Ein Server-Geheimnis `APP_SECRET` mit Prüfung beim Start. Push-Schlüssel sind optional: Ohne sie startet die App, Push ist dann aus | Technik |
| E-13 | Nutzerverwaltung mit eigenen kleinen Bausteinen statt des Admin-Plugins der Anmelde-Bibliothek. Vor dem Bau ein Probelauf | das Plugin löscht hart und kennt die Regel „letzter Admin“ nicht |
| E-14 | Export ohne Fotos (die sichert das Backup). MHD-Fotos bleiben nach dem Speichern erhalten | 05 „Fotos werden gespeichert“ |
| E-15 | Nachkaufen, vorläufig: „Erledigt“ bleibt 14 Tage sichtbar. Eine ausgeblendete Lücke kommt zurück, wenn sie sich um mehr als 10 % ändert oder nach 30 Tagen | Detailwerte, jederzeit änderbar |
| E-16 | Nutzer werden nie gelöscht, nur deaktiviert. Der Benutzername bleibt belegt | sonst wäre der Verlauf mehrdeutig |
| E-17 | Wird ein Nutzer mit einer Platzhalter-Person („Person 2“) verknüpft, übernimmt sie seinen Anzeigenamen | spart einen Gang in die Mitgliederliste |
| E-18 | Mitglieder sehen von der Foto-Erkennung nur „an“ oder „aus“, nie Schlüssel oder Verbindungen | einheitlich mit „Das ändert ein Admin“ |
| E-19 | Schema: Die sicheren Änderungen gehen in die offene PR #112 bzw. den Nachtrag #120, die fragenabhängigen als eigene Migration nach deinen Antworten | keine Wegwerf-Migrationen |
| E-20 | „Nächster Schritt“ auf der Übersicht und die erste Zeile in „Nachkaufen“ zeigen dieselbe Menge (Fehlmenge bis zum Ziel) | sonst stehen zwei Zahlen für dieselbe Lücke da |
| E-21 | Die einstellbare Schwelle „dringend“ kann nicht unter 7 Tage sinken | sonst überlappt sie mit „Diese Woche“ |
| E-22 | Felder ohne Verwendung entfallen: Prüfsumme und Größe der Fotos, Piktogramm je Person, alte Richtwerte an der Kategorie | kein Feld ohne Zweck |
| E-23 | Systemstatus und die Prüfung vor der Einrichtung sind dieselbe Funktion | eine Prüfung, zwei Orte |
| E-24 | Die Einrichtung nimmt alle Personentypen und den Schalter „Ich zähle selbst mit“ entgegen. Mindestens eine Person mit Bedarf ist Pflicht | sonst gibt es keine Kernzahl |
