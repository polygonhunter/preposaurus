# Einstellungen, Nutzerverwaltung und Anmeldung – Konzept (Entwurf, 2026-11-22)

> Löst `04_EINSTELLUNGEN.md` (v0.1) für diese drei Themen ab. Grundlage: `05_STATUS_ENTSCHEIDUNGEN.md`, `features.html` (ERS, HH, EIN, SYS, ERI, PWA), `UX_KONZEPT.md`, `technik.html`, Issue #108, Schema aus PR #112.
> Alles hier ist Vorschlag, bis der Maintainer es bestätigt. Ausnahme sind die Vorgaben in §0.

## 0. Vorgaben und Leitlinien

| Vorgabe (Maintainer) | Folge für dieses Konzept |
|---|---|
| Anmeldung nur mit **Benutzername und Passwort** | Keine E-Mail-Adresse im MVP, kein OAuth, kein Passkey (ERS-04 bleibt „später“). Einladungslink (ERS-03) entfällt |
| **Admin legt Nutzer an und vergibt Passwörter** | Keine freie Registrierung. Passwort wird beim Anlegen oder Zurücksetzen **einmal angezeigt**, gespeichert wird nur der Hash |
| **Keine privaten Daten** | Alle Einstellungen gelten für den Haushalt. Persönlich ist nur das Konto selbst, gerätebezogen nur Push |
| Eine Installation = ein Haushalt | Kein Haushalts-Umschalter, keine Mandanten-Einstellungen |

**Verworfen:** Passwörter für den Admin einsehbar. Dafür müssten sie umkehrbar gespeichert werden. Wer DB und `APP_SECRET` hat (auch aus einem Backup), könnte dann alle Passwörter lesen, und Passwörter werden oft auf anderen Diensten wiederverwendet.

**Leitlinien**
1. Jede Einstellung hat einen Standard. Abgefragt wird nur, was die App nicht raten kann (§2).
2. Eine Einstellung kommt nur ins MVP, wenn ohne sie etwas nicht geht oder ein Haushalt sie nachweislich anders braucht.
3. Geheimnisse (Passwort, API-Schlüssel) sind nach dem Speichern nie wieder lesbar.
4. Jede Regel wird auf dem Server geprüft. Ausgeblendete Knöpfe sind nur Komfort.

## 1. Alle Einstellungen

Einstufung: **notwendig** (ohne geht die App nicht) · **sinnvoll** (MVP) · **später**. „Wer“: A = Admin, M = Mitglied, „Gerät“ = jeder für sein eigenes Gerät.

### 1.1 Haushalt, Mitglieder, Ziel

| Bereich | Einstellung | Standard | Wer | Einstufung | Begründung | ID |
|---|---|---|---|---|---|---|
| Haushalt | Name des Haushalts | „Unser Haushalt“ | A | sinnvoll | Nur Anzeige. Pflichtspalte in der DB, deshalb mit Standard statt Abfrage | ERS-01 |
| Haushalt | Standard-Ernährungsform | alles | A | sinnvoll | Erspart die Angabe je Person | HH-03 |
| Mitglieder | Personen anlegen, bearbeiten, entfernen | 1 Erwachsene:r (der Admin) | A | notwendig | Ohne Personen gibt es keinen Bedarf und keine Kernzahl | HH-01 |
| Mitglieder | Name, Typ | – | A | notwendig | Typ bestimmt den Bedarf (Wasser, Baby zählt nicht) | HH-02 |
| Mitglieder | Geburtsjahr, Geschlecht, Aktivität, Gewicht, schwanger/stillend | leer | A | später | Wirken nur im Rechenmodus „Individuell“ (ZIEL-02, später). Felder bleiben im Schema | HH-02 |
| Mitglieder | Ernährungsform je Person | wie Haushalt | A | sinnvoll | Gemischte Haushalte | HH-03 |
| Mitglieder | Allergien | keine | A | sinnvoll | Nur das Feld, der Hinweis bei Nachkaufen kommt später | HH-04 |
| Mitglieder | Verknüpfung Nutzer ↔ Person | keine | A | sinnvoll | Freiwillig. Dient nur der Anzeige („Alex hat entnommen“) | HH-06 |
| Ziel und Quelle | Quelle der Empfehlung | BBK/BLE | – (fest) | notwendig | Im MVP gibt es nur eine. Angezeigt mit Stand und Link, nicht wählbar | ZIEL-01 |
| Ziel und Quelle | Zieldauer | 10 Tage (aus der Quelle) | A | notwendig | Bezugsgröße für „X von Y Tagen“ | ZIEL-03 |
| Ziel und Quelle | Zieldatum | leer | A | sinnvoll | Ohne Datum zeigt die App nur „Heute versorgt“ | ZIEL-04 |
| Ziel und Quelle | Rechenmodus | offiziell | – (fest) | später | DGE-Werte sind ungeprüft | ZIEL-02 |
| Ziel und Quelle | Etappen | keine | A | später | Laut MVP-Zuschnitt | ZIEL-05 |

### 1.2 Vorrat, Ampel, Erinnerungen

| Bereich | Einstellung | Standard | Wer | Einstufung | Begründung | ID |
|---|---|---|---|---|---|---|
| Vorrat und Kategorien | Lagerorte anlegen, umbenennen, ausblenden | keine | A (Anlegen beim Erfassen: siehe Frage 9) | sinnvoll | Lagerort hängt am Produkt (VOR-05) | EIN-04 |
| Vorrat und Kategorien | Eigene Lebensmittelarten und Kategorien | Startliste (Seed) | A | sinnvoll | Baum laut #110. System-Einträge nur ausblendbar, nie löschbar | EIN-04 |
| Vorrat und Kategorien | Sortierung, Piktogramm je Kategorie | Seed | A | später | Kosmetik | EIN-04 |
| Vorrat und Kategorien | Schlagwörter | – | A | später | Laut MVP-Zuschnitt | VOR-06 |
| Vorrat und Kategorien | „Noch gut zählt mit“ | aus | A | sinnvoll | Entschieden (F10). Ändert die Kernzahl, deshalb Haushalt und nur Admin | ROT-05 |
| Vorrat und Kategorien | „Jeden Schritt bestätigen“ in der Foto-Erfassung | aus | A | später | Erst nach dem PoC sinnvoll (UX-Frage 8) | ERF |
| Ampel und Erinnerungen | Schwelle Gelb | 90 Tage | A | sinnvoll | Entschieden | EIN-05, ROT-01 |
| Ampel und Erinnerungen | Schwelle Orange | 28 Tage | A | sinnvoll | Muss > 0 und ≤ Gelb sein (CHECK besteht) | EIN-05 |
| Ampel und Erinnerungen | Wochenübersicht an/aus, Wochentag, Uhrzeit | an, Sa 10:00 | A | sinnvoll | Ein Zeitpunkt für den Haushalt, siehe §1.5 | ERI-02 |
| Ampel und Erinnerungen | „Dringend“ an/aus | an | A | sinnvoll | Höchstens eine Nachricht am Tag | ERI-03 |
| Ampel und Erinnerungen | Push auf diesem Gerät | aus, bis man es einschaltet | Gerät | sinnvoll | Die Erlaubnis gibt das Gerät, nicht der Haushalt | ERI-01 |
| Ampel und Erinnerungen | Inventur-Intervall | – | A | später | Hängt an ROT-08 | EIN-05, ERI-05 |
| Ampel und Erinnerungen | Check-in-Mail | – | – | später | Ohne E-Mail-Adresse nicht möglich | ERI-06 |

**Bewusst keine Einstellung:** „Datum fehlt“ und die wählbare MHD-Schätzung sind eine Entscheidung je Packung. Nährwerte sind am Produkt bearbeitbar. Die Zeitgruppe „Diese Woche“ ist fest 7 Tage.

### 1.3 Foto-Erkennung/KI (nach #108)

| Bereich | Einstellung | Standard | Wer | Einstufung | Begründung | ID |
|---|---|---|---|---|---|---|
| KI | Foto-Erkennung an/aus | aus | A | notwendig | Ohne bewusstes Einschalten verlässt kein Foto das NAS. Datenschutzhinweis steht daneben | EIN-06 |
| KI | Anbieter | Anthropic | – (fest) | später | Nur ein Adapter im MVP | #108 |
| KI | API-Schlüssel eintragen, ersetzen, löschen | leer | A | notwendig (für Fotos) | Nach dem Speichern nur maskiert. Wert aus `.env` hat Vorrang und sperrt das Feld | #108, EIN-08 |
| KI | „Verbindung testen“, Status | – | A | sinnvoll | Fehler zeigt sich sofort statt beim ersten Foto | #108 |
| KI | Modell je Foto-Rolle (Verpackung, Nährwerte, MHD) | Haiku 5.5 | A | sinnvoll | Entschieden. Auswahl aus fester Liste, kein Freitext | #108, EIN-07 |
| KI | Zweitversuch bei unsicherem MHD, Modell dafür | an, Sonnet 5.5 | A | sinnvoll | Entschieden. Abschaltbar, weil er Kosten erhöht | #108 |
| KI | Hinweis je Nutzer vor dem ersten Foto | unbestätigt | M, A (je für sich) | sinnvoll | Freigegebener Vorschlag aus `technik.html`. Ein Zeitstempel, keine Einstellung | EIN-11 |
| KI | Kosten des Monats | – | A | später | Laut MVP-Zuschnitt | EIN-09 |

### 1.4 Nutzer, Anmeldung, Daten, System

| Bereich | Einstellung | Standard | Wer | Einstufung | Begründung | ID |
|---|---|---|---|---|---|---|
| Nutzer und Anmeldung | Nutzer anlegen (Anzeigename, Benutzername, Rolle, Passwort) | – | A | notwendig | Einziger Weg zu einem Konto | ERS-03, EIN-10 |
| Nutzer und Anmeldung | Rolle ändern | Mitglied | A | notwendig | Regel „letzter Admin“ in §3.3 | EIN-10 |
| Nutzer und Anmeldung | Passwort zurücksetzen | – | A | notwendig | Ohne E-Mail der einzige Weg | ERS-06 |
| Nutzer und Anmeldung | Deaktivieren, reaktivieren | aktiv | A | notwendig | Ersetzt das Löschen | EIN-10 |
| Nutzer und Anmeldung | Alle Sitzungen eines Nutzers beenden | – | A | sinnvoll | Für ein verlorenes Handy. Ersetzt die Sitzungsliste | ERS-05 |
| Nutzer und Anmeldung | Eigener Anzeigename | – | M, A | sinnvoll | Reine Anzeige | EIN-02 |
| Nutzer und Anmeldung | Eigenes Passwort ändern | – | M, A | sinnvoll | Damit das vom Admin vergebene Passwort nicht dauerhaft gilt (§3.2) | EIN-02 |
| Nutzer und Anmeldung | Abmelden, „Überall abmelden“ | – | M, A | notwendig | §4.2 | ERS-02 |
| Nutzer und Anmeldung | Benutzername ändern | – | A | später | Selten. Vermeidet Verwechslung bei der Anmeldung | EIN-10 |
| Nutzer und Anmeldung | Liste der Sitzungen je Gerät | – | – | später | Laut MVP-Zuschnitt | ERS-05 |
| Nutzer und Anmeldung | Sitzungsdauer, Passwortregeln, Sperrzeiten | fest (§4) | – | – | Bewusst keine Einstellung. Konstanten im Code | ERS-02 |
| Daten und System | Export komplett (JSON) | – | A | sinnvoll | Ohne Fotos, ohne Geheimnisse (§6.4) | SYS-01 |
| Daten und System | Version, Lizenz, Quellen | – | alle lesen | sinnvoll | AGPL verlangt den Hinweis auf den Quelltext | SYS-06 |
| Daten und System | Backup-Status, CSV-Export, Import, Historie archivieren | – | A | später | Laut MVP-Zuschnitt | SYS-02 bis SYS-05 |
| Daten und System | Adresse der App (`APP_URL`), `APP_SECRET`, Auth-Geheimnis, DB-Passwort, VAPID-Schlüssel, Zeitzone (`TZ`, Standard Europe/Berlin) | `.env` | Betreiber | notwendig | Gehören zum Betrieb, nicht in die Oberfläche. Die App startet nicht ohne sie und sagt, was fehlt | PWA-04 |

### 1.5 Braucht es persönliche Einstellungen? Prüfung

| Kandidat (bisher „Mein Konto“) | Ergebnis | Begründung |
|---|---|---|
| Benachrichtigungsarten je Nutzer | **nein**, Haushalt | Wochenübersicht und „Dringend“ betreffen denselben Vorrat. In einem Haushalt mit 2 bis 5 Leuten reicht ein Zeitpunkt. Wer nichts will, schaltet Push am Gerät aus |
| Push je Gerät | **ja**, aber kein Einstellungs-Datensatz | Das Abo (`push_abo`) ist die Einstellung. An = Zeile vorhanden, aus = Zeile gelöscht |
| Hell/Dunkel | **nein** im MVP | Hell ist Standard (entschieden), dunkel ist nicht umschaltbar (M3-04). Später als Wahl je Gerät im Browser-Speicher, nicht in der DB |
| Animationen reduzieren | **nein** | Die Systemeinstellung des Geräts wird beachtet |
| Startansicht | **nein** | Die Übersicht ist der Sinn der App. Push und Links öffnen ohnehin die passende Seite |
| Vorbelegung letzter Lagerort und Erfassungsweg (UX §1) | **nein** als Einstellung | Wird aus der letzten Erfassung des Nutzers abgeleitet bzw. im Browser-Speicher gemerkt |

**Folge:** Die Tabellen `nutzer_einstellung` und `benachrichtigung_einstellung` entfallen. Der Bereich „Mein Konto“ heißt „Konto und Gerät“ und enthält nur: Anzeigename, Passwort ändern, Push auf diesem Gerät, Abmelden.

**Aufbau der Einstellungen:** Konto und Gerät · Haushalt (Mitglieder, Ziel und Quelle, Vorrat und Kategorien, Ampel und Erinnerungen, Foto-Erkennung) · Nutzerverwaltung · Daten und System. #108 nennt die Foto-Erkennung unter „Daten & System“. Empfohlen ist „Haushalt“, weil dort schon der Schalter aus EIN-06 liegt.

## 2. Ersteinrichtung (ERS-01)

Ziel: in unter 2 Minuten bei der Übersicht. Die Einrichtung erscheint nur, solange es keinen Nutzer gibt.

> Den Ablauf im Detail (Screens, Texte, Reihenfolge) bearbeitet der **Onboarding-Strang**. Dieser Abschnitt legt nur fest, **welche Einstellungen abgefragt werden müssen**, welche einen Standard haben und welche Regeln aus Nutzerverwaltung und Anmeldung dabei gelten. Abgleich über `SCHNITTSTELLEN.md`.

| Schritt | Abgefragt | Vorbelegt | Überspringbar |
|---|---|---|---|
| 1 Konto | Anzeigename, Benutzername, Passwort (selbst gewählt, mit „Anzeigen“-Knopf statt zweitem Feld) | Benutzername aus dem Anzeigenamen vorgeschlagen | nein |
| 2 Haushalt | Wie viele Personen: Zähler für Erwachsene, Kinder, Babys | 1 Erwachsene:r | nein, aber ein Tipp genügt |
| 3 Ziel | Zieldauer, optional Zieldatum | 10 Tage, kein Datum | ja |
| 4 Home-Bildschirm | – (nur Hinweis, nur im iPhone-Browser) | – | ja |

**Nicht abgefragt, weil es Standards gibt:** Haushaltsname, Ernährungsform, Ampel-Schwellen, „Noch gut“, Erinnerungen, Lagerorte, KI (bleibt aus), weitere Nutzer, Details der Personen, Push. Push fragt die App erst nach der ersten Erfassung mit MHD (UX §8).

**Regeln**
- Schritt 1 legt Nutzer (Rolle Admin), Haushalt und `haushalt_einstellung` in **einer Transaktion** an. Ein zweiter gleichzeitiger Aufruf scheitert (M3-03).
- Die erste Person aus Schritt 2 wird mit dem Admin verknüpft und trägt seinen Anzeigenamen. Weitere heißen vorerst „Person 2“ usw.
- Bricht jemand nach Schritt 1 ab, geht es nach der Anmeldung beim offenen Schritt weiter. Merker: `haushalt_einstellung.einrichtung_abgeschlossen_am`.
- Nach Schritt 4 zeigt die Übersicht ruhige Hinweise auf die nächsten Schritte: „Erste Packung erfassen“, „Weitere Nutzer anlegen“, „Foto-Erkennung einrichten“.
- **Wer zuerst öffnet, wird Admin.** Im Heimnetz bzw. Tailnet ist das vertretbar. Die README sagt: direkt nach dem Start einrichten.

## 3. Nutzerverwaltung (EIN-10, ERS-03, ERS-06)

### 3.1 Aktionen des Admins

| Aktion | Ablauf | Regeln |
|---|---|---|
| **Anlegen** | Anzeigename, Benutzername, Rolle (Standard Mitglied), optional Person verknüpfen. Passwort: von der App erzeugt, der Admin darf es überschreiben | Benutzername eindeutig, sonst ruhiger Hinweis am Feld. Passwortregeln aus §4.4 gelten auch für den Admin |
| **Passwort einmal zeigen** | Nach dem Speichern eine Seite mit Benutzername und Passwort, Knopf „Kopieren“, Satz „Dieses Passwort wird nur jetzt angezeigt.“ | Das Passwort steht nur in der Antwort dieser einen Aktion. Nicht in der Adresse, nicht im Log, nicht in der DB im Klartext. Nach Verlassen der Seite ist es weg |
| **Rolle setzen** | Umschalter Admin/Mitglied in der Nutzer-Detailseite | Regel „letzter Admin“ (§3.3). Die Änderung gilt beim nächsten Seitenaufruf, die Rolle wird je Anfrage aus der DB gelesen |
| **Passwort zurücksetzen** | Wie Anlegen: erzeugen oder eingeben, einmal zeigen | Beendet **alle** Sitzungen des Nutzers. Setzt `passwort_vorlaeufig`. Hebt eine laufende Anmeldesperre auf |
| **Deaktivieren** | Knopf mit kurzer Rückfrage | Beendet alle Sitzungen sofort, löscht die Push-Abos, Anmeldung nicht mehr möglich. Historie („entnommen von Alex“) und Verknüpfung bleiben. Nicht für sich selbst, nicht für den letzten Admin |
| **Reaktivieren** | Knopf in der Liste „Deaktiviert“ | Das alte Passwort gilt wieder. Die App bietet direkt „Passwort zurücksetzen“ an |
| **Sitzungen beenden** | Knopf „Überall abmelden“ am Nutzer | Für ein verlorenes Gerät |
| **Löschen** | gibt es nicht | Entschieden. Der Benutzername eines deaktivierten Nutzers bleibt belegt |

Die Liste zeigt je Nutzer: Anzeigename, Benutzername, Rolle, Status (aktiv, deaktiviert), verknüpfte Person, letzte Anmeldung. Der Status „eingeladen“ entfällt.

### 3.2 Passwort: einmal anzeigen, dann nur Hash

- **Erzeugt wird** ein Passwort aus vier zufälligen deutschen Wörtern mit Trennzeichen, z. B. `Linse-Regal-Hafer-Wolke`. Das lässt sich vorlesen und am Handy tippen. Quelle ist ein kryptografischer Zufallsgenerator, die Wortliste hat mindestens 2.000 Wörter (rund 44 Bit).
- **Der Admin kennt das Passwort** bis zur ersten Änderung durch den Nutzer. Deshalb: Nach der Anmeldung mit einem vorläufigen Passwort zeigt die App einmal je Sitzung den ruhigen Hinweis „Magst du ein eigenes Passwort setzen?“. Kein Zwang (Frage 3).
- Ändert der Nutzer sein Passwort selbst, braucht er das alte. Alle anderen Sitzungen enden, die aktuelle bleibt.
- Am Konto steht sichtbar: „Passwort zuletzt geändert am … von …“. So merkt jeder, wenn ein Admin es zurückgesetzt hat.
- **Restrisiken:** Der Admin kann jedes Passwort neu setzen und sich als der Nutzer anmelden. Das ist gewollt und, weil es keine privaten Daten gibt, folgenlos. Die Hashes stehen in den täglichen Backups. Sie sind mit scrypt gehasht, die Kopie am zweiten Ort ist verschlüsselt (`technik.html`). Backups enthalten auch Sitzungs-Token: Nach dem Einspielen eines fremden oder alten Backups „Alle abmelden“ ausführen (§3.4).

### 3.3 Der letzte Admin

**Regel:** Es gibt immer mindestens einen **aktiven** Admin.

| Fall | Verhalten |
|---|---|
| Einziger Admin will sich herabstufen | Abgelehnt: „Ihr braucht mindestens einen Admin. Mach zuerst jemand anderen zum Admin.“ Der Umschalter ist gesperrt, mit diesem Satz daneben |
| Admin will sich herabstufen, ein zweiter aktiver Admin existiert | Erlaubt, mit Rückfrage. Danach sieht er die Admin-Bereiche nicht mehr |
| Admin will den letzten anderen Admin herabstufen oder deaktivieren | Erlaubt, er selbst bleibt Admin |
| Admin will sich selbst deaktivieren | Nie erlaubt. Das macht ein anderer Admin |
| Zwei Admins stufen sich gleichzeitig gegenseitig herab | Die Prüfung läuft in einer Transaktion mit Sperre auf den Admin-Zeilen. Die zweite Aktion scheitert |

Die Regel liegt als reine Funktion in `auth/domain/user-rules.ts` (M2-10) und wird im Use-Case in der Transaktion angewandt. Empfehlung in der Oberfläche bei zwei Erwachsenen: „Ein zweiter Admin hilft, falls ein Passwort verloren geht.“

### 3.4 Notfall: Admin hat sein Passwort vergessen

Reihenfolge: 1. Ein anderer Admin setzt es zurück. 2. Gibt es keinen, hilft nur ein Befehl auf dem NAS.

```
docker compose exec web node scripts/admin.mjs passwort-zuruecksetzen <benutzername>
```

| Eigenschaft | Festlegung | Warum |
|---|---|---|
| Zugang | Nur als Befehl im Container. **Keine** Route, kein Formular, keine Umgebungsvariable | Wer `docker compose exec` darf, hat ohnehin DB, Fotos und `.env`. Es entsteht kein neuer Angriffsweg übers Netz |
| Passwort | Wird erzeugt und einmal im Terminal ausgegeben. Nie als Argument | Argumente landen im Shell-Verlauf und in der Prozessliste |
| Wirkung | Neuer Hash, `passwort_vorlaeufig = true`, alle Sitzungen des Nutzers beendet, Anmeldesperre aufgehoben: in `anmelde_sperre` die Zeile `name:<benutzername>`, dazu `global` und alle `ip:`-Zeilen | Wie das Zurücksetzen in der App. `global` und `ip:` mit, weil der Admin sonst trotz neuem Passwort in einer laufenden Pause oder Adress-Sperre hängen kann (Review #138) |
| Spur | Eine Zeile im Server-Log **ohne** Passwort. Am Konto steht „zuletzt geändert … per Kommandozeile“ | Ein Zurücksetzen bleibt nicht unbemerkt |
| Weitere Befehle | `nutzer-auflisten` · `admin-machen <benutzername>` (reaktiviert und setzt die Rolle) · `alle-abmelden` | Deckt „einziger Admin ist weg“ und „Backup eingespielt“ ab |
| Technik | Nutzt dieselben Use-Cases wie die Oberfläche. Muss im Standalone-Image enthalten sein (eigener Build-Schritt) | Keine zweite Logik, die Regeln gelten auch hier |
| Verworfen | `ADMIN_PASSWORD` in `.env`, Reset-Datei im Volume, Sicherheitsfrage | Bleiben liegen, landen in Backups oder sind erratbar |

## 4. Anmeldung (ERS-02)

### 4.1 Sitzung

| Punkt | Festlegung |
|---|---|
| Dauer | **180 Tage, gleitend**: Jede Nutzung nach mehr als einem Tag verlängert wieder auf 180 Tage. Ein Notvorrat wird selten geöffnet, kürzere Fristen würden beim Erfassen stören (Frage 4) |
| „Angemeldet bleiben“ | Angekreuzt als Standard (UX §8). Abgewählt endet die Sitzung mit dem Schließen des Browsers, gedacht für fremde Geräte |
| Cookie | `HttpOnly`, `Secure`, `SameSite=Lax`. Die App läuft nur über HTTPS (Tailscale Serve). Das braucht sie ohnehin für Kamera, Push und Installation |
| Prüfung | Je Anfrage gegen die DB, **ohne** Cookie-Zwischenspeicher. Deaktivieren und Zurücksetzen wirken dadurch sofort |
| Ende der Sitzung | Abmelden · Passwort geändert oder zurückgesetzt · deaktiviert · „Überall abmelden“ · 180 Tage ohne Nutzung |

### 4.2 Abmelden
- „Abmelden“ steht unter Konto und Gerät. Es beendet die Sitzung dieses Geräts und löscht dessen Push-Abo. Sonst kämen Nachrichten auf ein abgemeldetes Gerät.
- „Überall abmelden“ beendet alle eigenen Sitzungen.
- Danach zeigt die App die Anmeldung, ohne Reste im Offline-Speicher der PWA (zwischengespeicherte Seiten werden beim Abmelden geleert).

### 4.3 Schutz gegen Durchprobieren

Auch im Heimnetz sinnvoll: Ein befallenes Gerät im WLAN oder ein neugieriges Kind kann beliebig oft raten.

| Schicht | Festlegung |
|---|---|
| Bremse je Benutzername | Ab 5 Fehlversuchen in Folge wartet dieser Name 1 Minute, danach verdoppelt sich die Wartezeit je Fehlversuch bis höchstens 15 Minuten. Erfolg setzt zurück. **Keine Dauersperre**, sonst könnte jemand den Admin aussperren |
| Bremse je Adresse | Höchstens 20 Fehlversuche je IP in 10 Minuten, über alle Namen. Bremst das Durchprobieren vieler Namen. Hinter Tailscale Serve kommt die IP aus `X-Forwarded-For` (geprüft in M3-01, §4.5) Ohne verwertbare Adresse (Header fehlt oder enthält eine Liste) teilen sich alle Geräte den Zähler `ip:unbekannt` |
| Obergrenze für alle | Höchstens 100 Versuche in 10 Minuten über alle Namen und Adressen, danach 1 Minute Pause für alle (Schlüssel `global`). Nach Ende einer Pause bzw. Adress-Sperre beginnt die Zählung wieder bei 1, sonst erneuerte ein Versuch je Minute die Pause dauerhaft. Nur der Name verdoppelt weiter. Ein Erfolg, der selbst die Grenze erreicht hätte, nimmt seine Sperre zurück. Hält auch einen Angreifer auf, der die Adresse je Anfrage fälscht (Sicherheits-Review #138) |
| Zählen vor dem Prüfen | Jeder Versuch wird atomar gezählt, **bevor** das Passwort geprüft wird. Erreicht der Stand eine Grenze, gilt die Sperre sofort, auch für parallele Anfragen. Ein Erfolg nimmt die Zählung zurück (Review #138) |
| Gleiches Verhalten für unbekannte Namen | Gezählt wird der eingegebene Name, ob es ihn gibt oder nicht. Auch dann wird ein Hash gerechnet. Antwort und Dauer verraten nichts |
| Meldungen | Falsch: „Benutzername oder Passwort stimmt nicht.“ Gebremst: „Zu viele Versuche. Bitte in 5 Minuten noch einmal.“ Deaktiviert: dieselbe Meldung wie falsch |
| Ausweg | Ein Admin setzt das Passwort zurück, das hebt die Bremse auf. Für den Admin: §3.4 |
| Spur | Fehlversuche und Bremsen im Server-Log (Name, Zeit, ohne Passwort). Eine Anzeige für den Admin kommt später |

Die Zähler liegen in der DB (`anmelde_sperre`, §6), damit ein Neustart sie nicht löscht. Der Worker räumt Einträge nach 24 Stunden auf.

### 4.4 Passwortregeln

| Regel | Festlegung | Begründung |
|---|---|---|
| Länge | mindestens **10**, höchstens 128 Zeichen | Länge schlägt Sonderzeichen. 10 ist am Handy tippbar und mit der Bremse aus §4.3 ausreichend |
| Zusammensetzung | keine Pflicht für Ziffern oder Sonderzeichen, alle Zeichen und Leerzeichen erlaubt | Solche Pflichten führen zu „Passwort1!“ |
| Sperrliste | Nicht erlaubt: Benutzername, Anzeigename, Haushaltsname, „preposaurus“ (auch als Bestandteil mit Anhängsel) und eine mitgelieferte Liste der rund 1.000 häufigsten Passwörter | Das „nicht naiv“ für das Heimnetz. Läuft ohne Internet, keine Abfrage bei fremden Diensten |
| Ablauf | keiner | Erzwungene Wechsel machen Passwörter schlechter |
| Gilt für | alle Wege: Einrichtung, Admin, eigenes Ändern, Kommandozeile | Ein Zod-Schema in `auth/domain`, überall wiederverwendet |
| Hinweis im Formular | „Mindestens 10 Zeichen. Ein Satz oder ein paar Wörter sind gut. Bitte keins, das du woanders nutzt.“ | Ruhig, ohne Stärke-Balken |

**Benutzername:** 3 bis 30 Zeichen, Buchstaben, Ziffern, Punkt und Unterstrich. Groß- und Kleinschreibung spielt keine Rolle (gespeichert klein). Der Anzeigename ist ein eigenes, freies Feld.

### 4.5 Was Better Auth mitbringt (gegen die Doku geprüft am 2026-11-22)

| Thema | Laut Doku | Folge für Preposaurus |
|---|---|---|
| Username-Plugin | Feld `username` (klein normalisiert) und `displayUsername`. Anmeldung über `signIn.username` bzw. `auth.api.signInUsername`. Standard 3 bis 30 Zeichen, Buchstaben, Ziffern, Unterstrich, Punkt | Passt ohne Anpassung. `displayUsername: false`, weil `name` der Anzeigename ist |
| E-Mail bleibt Pflicht | `signUp.email` verlangt `email`, `name`, `password`. Das Plugin ersetzt die E-Mail nicht | Die Spalte `email` bleibt und bekommt eine **technische Adresse** aus der Nutzer-ID (`<id>@nutzer.invalid`). Nie angezeigt, nie angeschrieben |
| Namen erraten | `/is-username-available` ist standardmäßig an | **Umgesetzt in M3-01:** Es gibt keine Route `/api/auth/[...all]`. Kommt sie, bedient `auth.handler` nur Pfade aus einer Erlaubt-Liste (`ALLOWED_HTTP_PATHS`, zurzeit leer), alle anderen geben 404. Keine Sperrliste über `disabledPaths`, weil sie neue Routen wie `/change-password` oder `/list-sessions` still freigäbe (Review #138) |
| Freie Registrierung | `emailAndPassword.disableSignUp` (Standard `false`) | Auf `true`. Nutzer entstehen nur in eigenen Use-Cases auf dem Server **Geprüft in M3-01:** Die Sperre trifft auch den Server-Aufruf `auth.api.signUpEmail`. Nutzer legen eigene Use-Cases über `auth.$context` an |
| Passwort-Hash | scrypt als Standard, eigenes `hash`/`verify` möglich. Länge 8 bis 128 (`minPasswordLength`, `maxPasswordLength`) | scrypt bleibt, keine weitere Abhängigkeit. `minPasswordLength: 10`. Die Sperrliste prüft unser Schema davor |
| Sitzung | `expiresIn` 7 Tage, `updateAge` 1 Tag, gleitend. `revokeSession`, `revokeOtherSessions`, `revokeSessions`. `changePassword` mit `revokeOtherSessions` | `expiresIn` auf 180 Tage. `cookieCache` bleibt aus. „Angemeldet bleiben“ abwählbar, **geprüft in M3-01:** `rememberMe: false` gibt eine Sitzung von 1 Tag und ein Cookie ohne `Max-Age`, das mit dem Browser endet |
| Rate-Limit | Nur **je IP**, Standard 100 Anfragen je 10 s, in Entwicklung aus. Eigene Regeln je Pfad (`customRules`). **Aufrufe über `auth.api` werden nicht begrenzt** | Reicht nicht: Unser Formular ruft eine Server Action und damit `auth.api` auf. Die Bremsen aus §4.3 baut deshalb ein eigener Use-Case vor dem Aufruf. Zusätzlich `customRules` für `/sign-in/username` (5 je Minute) für direkte Aufrufe der Route |
| IP hinter Proxy | Standard-Header `x-forwarded-for`, einstellbar (`ipAddressHeaders`) | **Geprüft in M3-01:** Tailscale Serve setzt `X-Forwarded-For` auf die Tailnet-Adresse und ersetzt einen Wert vom Gerät (die Doku schweigt dazu, Quelle ist `ipn/ipnlocal/serve.go`). Einstellbar über `CLIENT_IP_HEADER`. Fehlt der Header, teilen sich alle Geräte einen Zähler. Die Bremse je Benutzername wirkt trotzdem |
| Admin-Plugin | `createUser` (verlangt E-Mail), `setUserPassword`, `setRole`, `banUser` (beendet Sitzungen), `removeUser` (**löscht hart**), `impersonateUser`. Eigene Rollen über Access Control | **Empfehlung: nicht verwenden.** Seine Routen kennen die Regel „letzter Admin“ nicht, bringen hartes Löschen und Imitieren mit und doppeln `aktiv` durch `banned`. Stattdessen fünf kleine eigene Use-Cases, die Hash und Sitzungen über den Server-Kontext von Better Auth setzen. Vor M3-01 an einem Probelauf bestätigen (Frage 10) |
| Deaktivierte Nutzer | Ohne Admin-Plugin keine eingebaute Sperre | Prüfung im Anmelde-Use-Case und zusätzlich in einem Datenbank-Hook vor dem Anlegen einer Sitzung |

**Betrieb (Sicherheits-Review #138, gilt für Compose-Datei und Einrichtungsanleitung #1):**
- Den App-Port 3000 **nie ins LAN freigeben**. Die App läuft nur hinter dem Tailscale-Sidecar (`network_mode: service:tailscale`) oder höchstens mit `127.0.0.1:3000:3000`. Grund: Next übernimmt einen `X-Forwarded-For`, den das Gerät selbst mitschickt. Wer den Port direkt erreicht, kann sich je Anfrage eine neue Adresse ausdenken und die Bremse je Adresse umgehen oder ein fremdes Gerät aussperren. Tailscale Serve ersetzt den Header dagegen. Die Bremsen je Name und `global` wirken in beiden Fällen.
- In Produktion (`NODE_ENV=production`) geht die Anmeldung **nur über HTTPS**. Das Sitzungs-Cookie ist `Secure`, über reines http verwirft der Browser es. Das ist gewollt und kein Fehler, `useSecureCookies` bleibt an.

## 5. Rechte-Matrix

✓ erlaubt · – nicht erlaubt · „liest“ = sichtbar, Felder gesperrt mit „Das ändert ein Admin“.

| Bereich | Aktion | Admin | Mitglied |
|---|---|---|---|
| Vorrat | Übersicht, Vorrat, Bald fällig, Statistik, Verlauf ansehen | ✓ | ✓ |
| Vorrat | Erfassen (Foto oder manuell), eigene Entwürfe fortsetzen und verwerfen | ✓ | ✓ |
| Vorrat | Produkt, Packung, Nährwerte, MHD, Lagerort bearbeiten | ✓ | ✓ |
| Vorrat | Entnehmen, Verbraucht, Entsorgt, Noch gut, Rückgängig | ✓ | ✓ |
| Vorrat | **Endgültig löschen** (Fehlerfassung samt Fotos) | ✓ | – |
| Nachkaufen | Abhaken, Eintrag ergänzen, ausblenden | ✓ | ✓ |
| Nachkaufen | Eigene Einträge endgültig entfernen | ✓ | – (ausblenden reicht) |
| Haushalt | Mitglieder, Ernährungsform, Allergien ändern | ✓ | liest |
| Haushalt | Ziel und Zieldatum ändern | ✓ | liest |
| Haushalt | Lagerorte, Lebensmittelarten, Kategorien verwalten | ✓ | liest (Anlegen beim Erfassen: Frage 9) |
| Haushalt | Ampel-Schwellen, „Noch gut zählt mit“, Erinnerungen des Haushalts | ✓ | liest |
| KI | An/aus, Schlüssel, Modelle, Verbindung testen | ✓ | liest nur „an“ oder „aus“ |
| KI | Hinweis vor dem ersten eigenen Foto bestätigen | ✓ | ✓ |
| Konto und Gerät | Eigener Anzeigename, eigenes Passwort, Abmelden, Überall abmelden | ✓ | ✓ |
| Konto und Gerät | Push auf diesem Gerät an/aus | ✓ | ✓ |
| Nutzerverwaltung | Liste sehen, anlegen, Rolle, zurücksetzen, deaktivieren, reaktivieren, Sitzungen beenden, Person verknüpfen | ✓ | – (Bereich nicht sichtbar) |
| Daten und System | Export | ✓ | – (nicht sichtbar) |
| Daten und System | Version, Lizenz, Quellen | ✓ | ✓ |
| Notfall | Kommandozeile im Container | Betreiber des NAS | – |

Durchsetzung: `requireSession()`, `requireAdmin()` in jeder Server Action und Route (M3-01), auch bei Direktaufruf. Die Rolle steht nie im Cookie, sondern kommt je Anfrage aus der DB.

## 6. Auswirkungen auf das Datenmodell (gegenüber PR #112)

### 6.1 `nutzer` (`schema/account.ts`)

| Spalte | Änderung | Zweck |
|---|---|---|
| `benutzername` | **neu**, text, NOT NULL, UNIQUE, klein gespeichert | Anmeldename (Username-Plugin) |
| `email` | bleibt NOT NULL UNIQUE, Inhalt ist die technische Adresse | Von Better Auth verlangt |
| `email_verified`, `image` | bleiben, ungenutzt | Von Better Auth verlangt |
| `name` | bleibt | Anzeigename |
| `rolle`, `aktiv`, `haushalt_id`, `mitglied_id` | bleiben | wie beschlossen |
| `passwort_vorlaeufig` | **neu**, boolean, Standard `false` | Vom Admin oder per Kommandozeile gesetzt, noch nicht selbst geändert |
| `passwort_geaendert_am` | **neu**, timestamptz | Anzeige am Konto |
| `passwort_geaendert_von` | **neu**, uuid, FK `nutzer`, `SET NULL`. Leer bei Kommandozeile | Nachvollziehbarkeit |
| `letzte_anmeldung_am` | **neu**, timestamptz | Liste der Nutzerverwaltung. Sitzungen eignen sich nicht, sie werden gelöscht |
| `ki_hinweis_bestaetigt_am` | **neu**, timestamptz | Hinweis vor dem ersten Foto |

Die Regel „mindestens ein aktiver Admin“ lässt sich nicht als Constraint ausdrücken und liegt im Use-Case (§3.3).

### 6.2 Weitere Tabellen

| Tabelle | Änderung |
|---|---|
| `haushalt_einstellung` | **neu:** `noch_gut_zaehlt_mit` boolean `false` · `wochenuebersicht_aktiv` boolean `true` · `wochenuebersicht_wochentag` smallint `6` (CHECK 1 bis 7) · `wochenuebersicht_uhrzeit` time `10:00` · `dringend_aktiv` boolean `true` · `einrichtung_abgeschlossen_am` timestamptz |
| `ki_einstellung` | **neu:** `mhd_zweitversuch_aktiv` boolean `true` · `modell_mhd_zweitversuch` text (leer = Standard). Die Standards (Haiku 5.5, Sonnet 5.5) stehen als Konstanten im Code, nicht in der DB |
| `anmelde_sperre` | **neue Tabelle:** `id` · `schluessel` text UNIQUE (`name:<benutzername>` oder `ip:<adresse>`) · `fehlversuche` integer · `letzter_fehlversuch_am` timestamptz · `gesperrt_bis` timestamptz · Zeitstempel. Ohne FK auf `nutzer`, weil auch unbekannte Namen gezählt werden |
| `benachrichtigung_einstellung` | **entfällt** (§1.5). Ebenso die Konstante `NOTIFICATION_KINDS` |
| `nutzer_einstellung` | **wird nicht angelegt** (stand nur in `technik.html` und UX §1, nicht in PR #112) |
| `push_abo` | bleibt. `geraet` wird aus dem Browser abgeleitet („iPhone“, „Mac“) |
| `sitzung`, `konto`, `verifizierung` | bleiben wie von Better Auth vorgegeben. `konto.password` enthält den scrypt-Hash. `verifizierung` bleibt leer |
| Einladung | Keine Token-Tabelle nötig, weil ERS-03 als Link entfällt |

Diese Änderungen sind in `SCHNITTSTELLEN.md` als „Einstellungen → Datenstruktur“ gemeldet. Alles als neue Migration nach `0006`. `SECURITY`-Regel für den Logger: `password`, `token` und `schluessel_*` werden nie geschrieben.

### 6.3 Nachzuziehende Dokumente und Pakete (nach Freigabe)

| Stelle | Änderung |
|---|---|
| `features.html` | ERS-02 Benutzername statt E-Mail · ERS-03 „Nutzer anlegen“ statt Einladungslink · ERI-06 nach „später“ · ERI-07 und EIN-03 entfallen im MVP · EIN-02 ohne E-Mail · EIN-07 und EIN-08 nach #108 |
| `UX_KONZEPT.md` | §8 Anmelden: Benutzername. Einstellungen: „Konto und Gerät“. Vorbelegungen ohne `nutzer_einstellung` |
| `docs/UMSETZUNG.md` | M3-01, M3-02 (Benutzername, Bremse) · M3-10 (reaktivieren statt entfernen) · M3-11 (ohne Einladung, mit Kommandozeile) · M9-01 · M11 (Erinnerungen je Haushalt) |
| `technik.html` | Datenmodell „Haushalt und Konto“, „Erinnerungen“, Abschnitt Sicherheit |
| `05_STATUS_ENTSCHEIDUNGEN.md` | Entscheidung Passwort (einmal anzeigen, nur Hash) und alles, was aus §7 bestätigt wird |

### 6.4 Export und Backup

| | Enthält | Enthält nicht |
|---|---|---|
| Export (SYS-01) | Haushalt, Personen, Ziel, Vorrat, Historie, Einstellungen, Nutzer mit Anzeigename, Benutzername, Rolle, Status | Passwort-Hashes, Sitzungen, Anmeldesperren, API-Schlüssel (auch nicht als Chiffrat), Push-Abos, Fotos |
| Backup (`pg_dump`) | alles, auch Hashes, Sitzungs-Token und den verschlüsselten API-Schlüssel | `APP_SECRET` (liegt in `.env`, muss getrennt gesichert werden, sonst ist der API-Schlüssel nach dem Einspielen neu einzutragen) |

## 7. Offene Fragen an den Maintainer

| Nr. | Frage | Empfehlung |
|---|---|---|
| 1 | **Erinnerungen je Haushalt statt je Nutzer?** Bisher galt „jeder stellt seine eigenen ein“ (03, ERI-07) | Ja, je Haushalt. Je Gerät nur Push an oder aus. Spart zwei Tabellen und eine Einstellungsseite |
| 2 | **Check-in-Mail** fällt ohne E-Mail-Adresse aus dem MVP. Einverstanden? | Ja. Später mit einem freiwilligen Feld „E-Mail für Erinnerungen“ am Konto, getrennt von der Anmeldung |
| 3 | **Vorläufiges Passwort:** Wechsel beim ersten Anmelden erzwingen oder nur anbieten? | Nur anbieten. In einer Familie ist das vom Admin vergebene Passwort oft gewollt, etwa bei Kindern |
| 4 | **Sitzungsdauer:** 30, 90 oder 180 Tage ohne Nutzung? | 180 Tage, gleitend. Bei verlorenem Gerät „Überall abmelden“ durch den Admin |
| 5 | **Mindestlänge** 8 oder 10 Zeichen? | 10, ohne Pflicht für Sonderzeichen, mit Sperrliste |
| 6 | **Erzeugtes Passwort** als vier Wörter oder als 12 zufällige Zeichen? | Vier Wörter. Lässt sich vorlesen und abtippen |
| 7 | **Hell/Dunkel und Startansicht** ganz streichen statt „später je Nutzer“? | Startansicht streichen. Dunkel später als Wahl je Gerät, ohne DB |
| 8 | **Foto-Erkennung** in den Einstellungen unter „Haushalt“ (hier) oder „Daten & System“ (#108)? | Haushalt, neben dem Schalter aus EIN-06 |
| 9 | **Darf ein Mitglied beim Erfassen einen neuen Lagerort anlegen?** EIN-04 sagt Admin | Ja, anlegen. Umbenennen und Ausblenden bleiben beim Admin. Sonst stockt die Erfassung |
| 10 | **Better Auth ohne Admin-Plugin**, mit eigenen Use-Cases? | Ja, wenn der Probelauf vor M3-01 zeigt, dass sich Hash und Sitzungen sauber über den Server-Kontext setzen lassen. Sonst Admin-Plugin mit gesperrten Routen für Löschen und Imitieren |
| 11 | **Ersteinrichtung ohne Einrichtungs-Code:** Wer zuerst öffnet, wird Admin | Ja. Ein Code aus dem Container-Log wäre sicherer, kostet aber die 2 Minuten. Als Option für später notieren |
| 12 | **Mehrere Admins** erlaubt? | Ja, ohne Obergrenze. Bei zwei Erwachsenen empfiehlt die App einen zweiten |
| 13 | **Benutzername eines deaktivierten Nutzers** bleibt belegt | Ja. Sonst wäre die Historie mehrdeutig. Reaktivieren ist der Weg zurück |
| 14 | **Anzeige der Fehlversuche** für den Admin im MVP? | Nein, nur Server-Log. Später eine Zeile in der Nutzerverwaltung |
