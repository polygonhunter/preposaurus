# Preposaurus einrichten

Diese Anleitung führt Schritt für Schritt durch die Einrichtung von Preposaurus auf einem NAS oder einem anderen eigenen Server, ähnlich wie bei Paperless-ngx. Vorwissen zu Docker brauchst du nicht. Jeder Schritt nennt den Befehl und das, was danach zu sehen sein sollte.

> **Stand:** Die Anleitung beschreibt die Dateien aus dem Repository (Compose-Dateien, Images, Backup). Sie ist in der CI geprüft, aber **noch nicht an einem echten NAS**. Stellen, die nur am Gerät prüfbar sind, tragen den Hinweis *noch nicht am Gerät geprüft*. Die Abnahme am Gerät ist Arbeitspaket M13-06 (Issue #1). Die App selbst ist noch in Entwicklung, einige Schritte (Ersteinrichtung, Push, Mail) folgen mit späteren Versionen.

## Inhalt

1. [So ist Preposaurus aufgebaut](#1-so-ist-preposaurus-aufgebaut)
2. [Voraussetzungen](#2-voraussetzungen)
3. [Tailscale vorbereiten](#3-tailscale-vorbereiten)
4. [Ordner und Dateien anlegen](#4-ordner-und-dateien-anlegen)
5. [Die Datei .env ausfüllen](#5-die-datei-env-ausfüllen)
6. [Starten](#6-starten)
7. [Erster Aufruf und Ersteinrichtung](#7-erster-aufruf-und-ersteinrichtung)
8. [Weitere Geräte und Haushaltsmitglieder](#8-weitere-geräte-und-haushaltsmitglieder)
9. [Die App auf den Home-Bildschirm des iPhones legen](#9-die-app-auf-den-home-bildschirm-des-iphones-legen)
10. [Backups](#10-backups)
11. [Wiederherstellen](#11-wiederherstellen)
12. [Updates und der Weg zurück](#12-updates-und-der-weg-zurück)
13. [Notfall-Befehle: Passwort vergessen, kein Admin, alle abmelden](#13-notfall-befehle-passwort-vergessen-kein-admin-alle-abmelden)
14. [Fehlersuche](#14-fehlersuche)
15. [Hinweise je NAS-Typ](#15-hinweise-je-nas-typ)
16. [Tailscale als Paket auf dem NAS (zweiter Weg)](#16-tailscale-als-paket-auf-dem-nas-zweiter-weg)

---

## 1. So ist Preposaurus aufgebaut

Preposaurus läuft als kleine Gruppe von Containern (Programmpaketen) mit Docker Compose. Compose startet sie in der richtigen Reihenfolge und hält sie am Laufen.

| Dienst | Aufgabe |
|---|---|
| `db` | Datenbank (PostgreSQL 18). Nur intern erreichbar |
| `migrate` | richtet beim Start die Datenbank ein bzw. bringt sie auf den neuen Stand und beendet sich dann |
| `web` | die App selbst |
| `backup` | sichert jede Nacht Datenbank und Fotos |
| `tailscale` | bringt die App verschlüsselt (HTTPS) in dein privates Tailscale-Netz |
| `worker` | erledigt Aufgaben nach Zeitplan im Hintergrund: Wochenübersicht, „Bald verbrauchen“, Check-in-Mail, nächtliches Aufräumen |

**Erreichbar ist die App nur über Tailscale**, nicht aus dem offenen Internet und nicht direkt im Heimnetz. Tailscale ist ein privates, verschlüsseltes Netz zwischen deinen eigenen Geräten (dem „Tailnet“). Die App bekommt darin eine Adresse wie `https://haushalt.dein-tailnet.ts.net`.

Warum so streng?
- Kamera, Home-Bildschirm-App und Benachrichtigungen gehen im Browser nur über HTTPS.
- Die Anmeldung geht in Produktion **nur über HTTPS**. Das Sitzungs-Cookie ist als „Secure“ markiert, über reines `http://` verwirft der Browser es. Das ist gewollt.
- Der App-Port 3000 wird **nie ins Heimnetz freigegeben**. Die Anmeldebremse zählt Fehlversuche je Gerät. Bei direktem Zugriff könnte ein Gerät eine falsche Adresse mitschicken und so die Bremse umgehen. Tailscale Serve setzt die echte Adresse.

Alle Daten liegen in drei sichtbaren Ordnern neben der Compose-Datei:

| Ordner | Inhalt |
|---|---|
| `db` | die Datenbank |
| `fotos` | die Fotos der Packungen |
| `backups` | die nächtlichen Sicherungen |

Dazu kommt `tailscale` mit dem Zustand des Tailscale-Containers. Er enthält den Geräteschlüssel im Tailnet und ist **vertraulich**: nicht teilen, nicht in eine öffentliche Freigabe legen.

## 2. Voraussetzungen

- **Ein NAS oder Server mit Docker und Docker Compose** (Version 2.24 oder neuer, wegen `!reset` in der Tailscale-Datei). Prüfen per SSH:
  ```bash
  docker compose version
  ```
  Erwartet: `Docker Compose version v2.24.0` oder höher.
- **Nur für den zweiten Weg ohne Tailscale-Container** ([Abschnitt 16](#16-tailscale-als-paket-auf-dem-nas-zweiter-weg)): Docker Engine **28.3.3 oder neuer** (`docker version`, Zeile `Server: … Version`). Ältere Versionen ließen Geräte im selben Netz an einen nur auf `127.0.0.1` veröffentlichten Port (behoben in 28.0.0, nach einem firewalld-Neustart erneut bis 28.3.3, CVE-2025-54388). Mit dem empfohlenen Tailscale-Container ist kein Port auf dem NAS offen, dann spielt die Version dafür keine Rolle.
- **Prozessor x86-64 (amd64) oder ARM64 (aarch64).** Ältere NAS mit 32-Bit-ARM gehen nicht. Prüfen:
  ```bash
  uname -m
  ```
  Erwartet: `x86_64` oder `aarch64`.
- **Etwa 1 GB Arbeitsspeicher frei** und Platz für Fotos und Backups (Richtwert: dreimal so viel wie die Fotos selbst).
- **Ein Tailscale-Konto** (kostenlos für bis zu 6 Personen, nur privat): [tailscale.com](https://tailscale.com)
- **Die Tailscale-App** auf jedem Handy und PC, mit dem ihr Preposaurus nutzen wollt.
- **SSH-Zugang** zum NAS ist hilfreich. Die Befehle in dieser Anleitung laufen dort. Auf manchen Geräten braucht Docker `sudo` davor.

## 3. Tailscale vorbereiten

Alles in diesem Abschnitt passiert im Browser im Tailscale-Admin-Bereich: [login.tailscale.com/admin](https://login.tailscale.com/admin).

> *Noch nicht am Gerät geprüft:* der Tailscale-Container mit Serve und HTTPS-Zertifikat (Abschnitte 3, 6 und 7). Die CI prüft die Tailscale-Datei nur auf ihren Aufbau, nicht im echten Tailnet. Die Bezeichnungen im Admin-Bereich können sich geändert haben.

### 3.1 MagicDNS und HTTPS einschalten

1. Seite **DNS** öffnen.
2. **MagicDNS** einschalten (falls noch aus). Damit bekommen deine Geräte Namen statt Zahlen.
3. Weiter unten bei **HTTPS Certificates** auf **Enable HTTPS** klicken.

Erwartet: Oben auf der Seite steht der Name deines Tailnets, z. B. `dein-tailnet.ts.net`. Notiere ihn.

### 3.2 Einen neutralen Gerätenamen wählen

Der Gerätename landet im **öffentlichen Zertifikats-Verzeichnis** (Certificate-Transparency-Log), weil Tailscale dafür ein HTTPS-Zertifikat holt. Wähle deshalb einen neutralen Namen, der nichts über dich oder den Zweck verrät, z. B. `haushalt` oder `nas-app`. Nicht: `notvorrat`, `preposaurus-mueller`.

### 3.3 Einen Auth-Schlüssel für den Tailscale-Container erzeugen

Der Tailscale-Container meldet sich mit einem Auth-Schlüssel einmalig in deinem Tailnet an.

1. Seite **Settings → Keys** öffnen.
2. **Generate auth key…** wählen.
3. **Reusable** aus, **Ephemeral** aus. Gibt es die Option **Pre-approved**, einschalten.
4. **Generate key** und den Schlüssel (beginnt mit `tskey-auth-`) kopieren. Er wird nur einmal angezeigt.

Der Schlüssel ist ein Geheimnis wie ein Passwort. Er kommt gleich in die Datei `.env` und sonst nirgendwohin.

> Ohne Auth-Schlüssel geht es auch: Dann schreibt der Tailscale-Container beim ersten Start einen Anmelde-Link ins Log (`docker compose logs tailscale`), den du im Browser öffnest.

## 4. Ordner und Dateien anlegen

### 4.1 Einen Ordner für Preposaurus anlegen

Wähle einen Ordner auf dem NAS, der von den NAS-eigenen Snapshots und Sicherungen erfasst wird. Beispiele stehen in [Abschnitt 15](#15-hinweise-je-nas-typ). Hier im Beispiel `/volume1/docker/preposaurus`:

```bash
mkdir -p /volume1/docker/preposaurus
cd /volume1/docker/preposaurus
```

### 4.2 Die Installationsdateien herunterladen

Jede Version auf der [Release-Seite](https://github.com/polygonhunter/preposaurus/releases) hat ein Archiv `preposaurus-<version>.tar.gz`. Darin stecken:

- `compose.yaml` – die Dienste
- `compose.tailscale.yaml` – der Tailscale-Container
- `docker/tailscale/serve.json` – die HTTPS-Einstellung für Tailscale Serve
- `env.beispiel` – die Vorlage für die Datei `.env`, mit eingetragener Version

Herunterladen und entpacken (Version anpassen):

```bash
VERSION=0.1.0
wget https://github.com/polygonhunter/preposaurus/releases/download/v$VERSION/preposaurus-$VERSION.tar.gz
tar -xzf preposaurus-$VERSION.tar.gz --strip-components=1
cp env.beispiel .env
```

Ohne `wget` geht `curl -LO <adresse>`. Ohne SSH: das Archiv am PC herunterladen, entpacken und den Inhalt in den Ordner auf dem NAS kopieren. Dabei `env.beispiel` in `.env` umbenennen.

Erwartet: `ls -a` zeigt `.env`, `compose.yaml`, `compose.tailscale.yaml`, `docker` und `env.beispiel`.

### 4.3 Die Datenordner anlegen

```bash
mkdir -p db fotos backups/status tailscale
```

Die App läuft aus Sicherheitsgründen **nicht als root**, sondern unter einer Nutzer-ID. Diesem Nutzer muss der Ordner `fotos` gehören. Standard ist die ID 1000. Auf vielen NAS hat dein eigener Nutzer eine andere ID, dann nimm diese:

```bash
id -u   # z. B. 1026
id -g   # z. B. 100
```

Trag beide Zahlen in Abschnitt 5 als `PREPOSAURUS_UID` und `PREPOSAURUS_GID` ein. Wenn der Ordner `fotos` nicht deinem Nutzer gehört (z. B. weil du ihn mit `sudo` angelegt hast):

```bash
sudo chown "$(id -u):$(id -g)" fotos backups
```

Den Ordner `db` verwaltet die Datenbank selbst, er braucht keine Anpassung.

**Nur für dich lesbar machen:** Die Backups enthalten Passwort-Hashes, Sitzungen und Gesundheitsangaben, der Ordner `tailscale` den Geräteschlüssel. Auf einem NAS mit mehreren Nutzern oder einer Netzwerkfreigabe auf den Ordner sollen andere sie nicht lesen können:

```bash
chmod 700 backups tailscale
```

Der Backup-Container legt seine Dateien zusätzlich nur für den Besitzer lesbar an (`600` bzw. `700`).

## 5. Die Datei .env ausfüllen

Die Datei `.env` enthält alle Einstellungen und Geheimnisse. **Sie gehört nie in ein Repository, in einen Chat oder in ein Ticket.** Bewahre eine Kopie getrennt von den Backups auf, z. B. im Passwort-Manager.

Mach sie zuerst nur für dich lesbar und öffne sie dann mit einem Editor (per SSH z. B. `nano .env`, am NAS auch über den Datei-Browser):

```bash
chmod 600 .env
```

### 5.1 Geheimnisse erzeugen

```bash
openssl rand -hex 24      # für POSTGRES_PASSWORD
openssl rand -base64 32   # für APP_SECRET
```

Erwartet: je eine lange Zufallszeile. Kopiere sie in die passenden Zeilen. Ohne `openssl` auf dem NAS geht es mit Docker:

```bash
docker run --rm alpine:3.22 sh -c "apk add -q openssl && openssl rand -base64 32"
```

### 5.2 Alle Variablen erklärt

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `COMPOSE_FILE` | ja | Welche Compose-Dateien gelten. Vorgabe `compose.yaml:compose.tailscale.yaml` (mit Tailscale-Container). Dadurch reicht überall ein einfaches `docker compose …`. Nur beim zweiten Weg ([Abschnitt 16](#16-tailscale-als-paket-auf-dem-nas-zweiter-weg)): `compose.yaml` |
| `PREPOSAURUS_VERSION` | ja | Version der Images, immer eine feste Nummer wie `0.1.0`, nie `latest`. So ändert sich nichts ohne dein Zutun |
| `POSTGRES_PASSWORD` | ja | Passwort der Datenbank. Nur Buchstaben und Ziffern (`openssl rand -hex 24`), weil es in einer Adresse steht. Nach dem ersten Start nicht mehr ändern, die Datenbank merkt es sich beim Anlegen |
| `APP_SECRET` | ja | Geheimnis für die Sitzungen und für den verschlüsselt gespeicherten KI-Schlüssel, mindestens 32 Zeichen (`openssl rand -base64 32`). Ein neuer Wert meldet alle Geräte ab, ein in der App hinterlegter KI-Schlüssel muss dann neu eingetragen werden. **Getrennt von der Datenbank sichern** |
| `PREPOSAURUS_UID`, `PREPOSAURUS_GID` | ja | Nutzer- und Gruppen-ID, der die Ordner `fotos` und `backups` gehören (aus Abschnitt 4.3). Standard 1000 |
| `TS_HOSTNAME` | mit Tailscale-Container | Gerätename im Tailnet. Neutral wählen (Abschnitt 3.2). Ergibt die Adresse `https://<TS_HOSTNAME>.<tailnet>.ts.net` |
| `TS_AUTHKEY` | nur beim ersten Start | Auth-Schlüssel aus Abschnitt 3.3. Nach dem ersten erfolgreichen Start leeren und `docker compose up -d` ausführen (Abschnitt 6) |
| `BACKUP_TIME` | nein | Uhrzeit der täglichen Sicherung, Standard `03:00` |
| `TZ` | nein | Zeitzone für die Sicherung, Standard `Europe/Berlin` |
| `LOG_LEVEL` | nein | Wie viel die App ins Log schreibt: `debug`, `info` (Standard), `warn` oder `error` |
| `ANTHROPIC_API_KEY` | nein | Schlüssel für die Foto-Erkennung. Normalerweise trägt ihn der Admin **in der App** ein (dort verschlüsselt gespeichert). Steht er hier, hat er Vorrang. Ohne Schlüssel geht alles von Hand |
| `SMTP_HOST` | nein | Mailserver für die Wochenübersicht (wenn kein Gerät Push hat) und die Check-in-Mail. Leer: keine Mails, alles andere läuft weiter |
| `SMTP_PORT` | nein | Port des Mailservers, Standard `587` (STARTTLS). Bei `465` gilt TLS von Anfang an |
| `SMTP_SECURE` | nein | `true` oder `false` erzwingt TLS von Anfang an bzw. schaltet es ab. Leer: nach Port |
| `SMTP_USER`, `SMTP_PASSWORD` | nein | Anmeldung am Mailserver. Beide setzen oder beide leer lassen (z. B. Relay im eigenen Netz) |
| `SMTP_FROM` | mit `SMTP_HOST` | Absender, z. B. `Preposaurus <vorrat@example.org>` |
| `APP_URL` | nein | Adresse der App, z. B. `https://haushalt.dein-tailnet.ts.net`. Nur für den Link „Vorrat öffnen“ in Mails. Leer: Mails ohne Link |

Mails sind optional. Sie gehen nur an Nutzer, die selbst eine Adresse hinterlegt haben; die Anmeldung braucht keine. So trägt jeder seine Adresse ein: **Einstellungen → Profil, Passwort und Mails → E-Mail für Erinnerungen**, dann **Speichern**. Leer lassen heißt: keine Mails. Darunter lässt sich die Check-in-Mail (wöchentlich oder monatlich) wählen, sobald `SMTP_HOST` gesetzt und eine Adresse eingetragen ist. Die Wochenübersicht geht per Mail an alle mit Adresse, solange kein Gerät Push hat. Push-Benachrichtigungen folgen später.

Erwartet: `docker compose config --quiet` gibt nichts aus. Fehlt ein Pflichtwert, nennt die Meldung die Variable, z. B. `APP_SECRET fehlt in .env`.

## 6. Starten

```bash
docker compose pull
docker compose up -d
```

Erwartet:
- `pull` lädt die Images `preposaurus`, `preposaurus-backup`, `postgres` und `tailscale`.
- `up -d` meldet nach etwa einer Minute alle Dienste als `Started` bzw. `Healthy`, `migrate` als `Exited`.

Prüfen:

```bash
docker compose ps -a
```

| Dienst | erwarteter Status |
|---|---|
| `db` | `Up … (healthy)` |
| `migrate` | `Exited (0)` – richtig so, er ist fertig |
| `web` | `Up … (healthy)` |
| `worker` | `Up` |
| `backup` | `Up` |
| `tailscale` | `Up` |

Im Log von `migrate` stehen `Migrationen eingespielt` und `Stammdaten eingespielt`:

```bash
docker compose logs migrate
```

Im Log von `worker` steht `Worker gestartet` (`docker compose logs worker`). Der Worker legt seine Warteschlange beim ersten Start selbst in der Datenbank an (Schema `pgboss`), sie ist in den Backups mit enthalten. Seine Zeitpläne gelten immer in deutscher Zeit (Europe/Berlin).

Läuft der Tailscale-Container, erscheint das Gerät mit deinem `TS_HOSTNAME` im Admin-Bereich unter **Machines** (*noch nicht am Gerät geprüft*). Dort beim Gerät über das Menü **Disable key expiry** wählen, sonst muss es sich nach einigen Monaten neu anmelden.

Danach den Auth-Schlüssel wieder aus der `.env` nehmen (Zeile `TS_AUTHKEY=` leeren) und `docker compose up -d` ausführen. Der Zustand liegt jetzt im Ordner `tailscale`, und der Schlüssel steht nicht mehr in der Container-Konfiguration (`docker inspect`).

## 7. Erster Aufruf und Ersteinrichtung

1. Auf einem Gerät mit verbundener Tailscale-App im Browser öffnen: `https://<TS_HOSTNAME>.<tailnet>.ts.net`, z. B. `https://haushalt.dein-tailnet.ts.net`.
2. Der erste Aufruf kann einige Sekunden dauern, weil Tailscale das Zertifikat holt (*noch nicht am Gerät geprüft*).
3. Kurztest ohne Anmeldung: `https://<adresse>/api/health` zeigt `{"status":"ok"}`.

**Wer die App zuerst öffnet, wird Admin.** Richte sie deshalb direkt nach dem Start ein. Die Ersteinrichtung in der App fragt nach Anzeigename, Benutzername und Passwort (keine E-Mail), danach nach der Zahl der Personen im Haushalt und dem Ziel in Tagen. Das dauert etwa zwei Minuten.

> In der aktuellen Entwicklungsversion zeigt die App noch eine Platzhalterseite. Die Ersteinrichtung kommt mit Meilenstein M3.

Die Foto-Erkennung ist anfangs aus. Der Admin kann sie später in den Einstellungen mit einem eigenen Anthropic-Schlüssel einschalten. Fotos gehen dann zur Auswertung an Anthropic, alles andere bleibt auf dem NAS.

### 7.1 Foto-Erkennung einrichten (Anthropic-Schlüssel in der App)

1. In der [Konsole von Anthropic](https://platform.claude.com/settings/keys) unter **API Keys** einen Schlüssel anlegen (beginnt mit `sk-ant-`) und kopieren. Die Kosten rechnet Anthropic direkt mit deinem Konto ab, ein Ausgabenlimit lässt sich dort setzen.
2. In Preposaurus als Admin: **Einstellungen → Daten & System → Foto-Erkennung**.
3. Unter **Verbindung hinzufügen** den Schlüssel einfügen und **Hinzufügen** tippen. Die App speichert ihn verschlüsselt (AES-256-GCM mit einem Schlüssel aus `APP_SECRET`) und zeigt danach nur noch „gespeichert · endet auf …“ mit den letzten vier Zeichen. Jede Foto-Art bekommt die neue Verbindung mit dem empfohlenen Modell (Haiku 5.5, zweiter Versuch beim MHD Sonnet 5.5).
4. **Verbindung testen** tippen. Erwartet: „Die Verbindung funktioniert.“ Sonst sagt die App, was fehlt (z. B. Schlüssel ungültig, kein Guthaben).
5. Unter **Für den Haushalt** den Schalter **Foto-Erkennung** einschalten und **Speichern**. Oben im **Status** steht dann „eingerichtet“ und je Foto-Art das Modell.

Voraussetzung ist `AI_PROVIDER=anthropic` (Standard in `compose.yaml`). Ein Neustart ist nicht nötig. Steht `ANTHROPIC_API_KEY` in der `.env`, hat er Vorrang vor den Verbindungen aus der App und erscheint dort als „aus Umgebungsvariable“. Ändert sich `APP_SECRET`, lässt sich der gespeicherte Schlüssel nicht mehr lesen: dann unter der Verbindung **Schlüssel ersetzen**.

## 8. Weitere Geräte und Haushaltsmitglieder

Jedes Gerät braucht die Tailscale-App, und Tailscale muss zum Öffnen der App verbunden sein.

Für weitere Personen gibt es zwei Wege:

| Weg | So geht's | Gut für |
|---|---|---|
| **Ins eigene Tailnet einladen** | Admin-Bereich → **Users** → **Invite users**. Die Person meldet sich mit eigenem Konto an und sieht alle Geräte, die du freigibst | Familie im selben Haushalt |
| **Nur das Gerät teilen** | Admin-Bereich → **Machines** → beim Gerät **Share…**. Die Person nutzt ihr eigenes Tailnet und sieht nur Preposaurus | Personen, die schon ein eigenes Tailnet haben |

Im kostenlosen Tarif sind bis zu 6 Nutzer möglich. Danach legt der Admin für jede Person in Preposaurus einen eigenen Benutzer an (Einstellungen → Nutzer, kommt mit M3).

## 9. Die App auf den Home-Bildschirm des iPhones legen

1. Tailscale-App auf dem iPhone verbinden.
2. In **Safari** die Adresse `https://<TS_HOSTNAME>.<tailnet>.ts.net` öffnen.
3. Unten auf das **Teilen**-Symbol tippen (Quadrat mit Pfeil nach oben).
4. **Zum Home-Bildschirm** wählen, Namen bestätigen, **Hinzufügen**.

Erwartet: Preposaurus liegt als eigenes Symbol (drei gestapelte Kisten auf Blau) auf dem Home-Bildschirm, öffnet sich ohne Adressleiste und startet auf der Übersicht. Benachrichtigungen gehen auf dem iPhone nur aus dieser Home-Bildschirm-App heraus. Solange Preposaurus in Safari läuft, erinnert ein Hinweis auf der Übersicht an diesen Schritt. Er lässt sich mit **Ausblenden** schließen und bleibt dann auf diesem Gerät weg.

**Ohne Verbindung** (Tailscale aus, kein Netz, NAS aus): Übersicht und Vorrat zeigen den zuletzt geladenen Stand mit dem Hinweis „Ohne Verbindung – Stand von …“. Erfassen, Entnehmen und alle Formulare sind dann gesperrt. Andere Seiten zeigen nur „Ohne Verbindung“. Gespeichert wird der Stand nur im Browser des Geräts, und nur für den angemeldeten Nutzer: Beim Abmelden und auf der Anmeldeseite wird er gelöscht. Das klappt nur über HTTPS (Tailscale Serve), über `http://` mit IP-Adresse gibt es keinen Offline-Stand.

*Noch nicht am Gerät geprüft:* Kamera in der Home-Bildschirm-App, Offline-Stand bei ausgeschaltetem Tailscale auf einem echten iPhone.

Auf Android geht es in Chrome über das Menü (⋮) → **Zum Startbildschirm hinzufügen**. Am PC reicht ein Lesezeichen.

## 10. Backups

### 10.1 Was automatisch passiert

Der Dienst `backup` sichert jede Nacht um `BACKUP_TIME`:
- die **Datenbank** mit `pg_dump` (Version 18, passend zur Datenbank) als Datei `datenbank.dump`
- die **Fotos** als vollständigen Ordner. Unveränderte Fotos sind feste Links auf den vorigen Stand und kosten keinen zusätzlichen Platz. Ein versehentlich gelöschtes Foto bleibt in älteren Ständen erhalten.

Jeder Stand heißt nach seinem Zeitpunkt, mehrere am selben Tag überschreiben sich also nicht. Es gibt fünf Arten:

| Ordner | entsteht | bleibt |
|---|---|---|
| `taeglich` | jede Nacht | die neuesten 7 |
| `woechentlich` | sonntags als Kopie des Tagesstands | die neuesten 4 |
| `manuell` | `jetzt` (Abschnitt 10.2) | die neuesten 5 |
| `vor-update` | `jetzt vor-update` (Abschnitt 12) | **immer**, bis du ihn selbst löschst |
| `vor-wiederherstellung` | automatisch vor jedem Wiederherstellen | die neuesten 5 |

```
backups/
├─ taeglich/
│  ├─ 2026-11-21_030000/  datenbank.dump, fotos/
│  └─ 2026-11-22_030000/  datenbank.dump, fotos/
├─ woechentlich/
│  └─ 2026-W47/           datenbank.dump, fotos/
└─ vor-update/
   └─ 2026-11-22_100512/  datenbank.dump, fotos/
```

Im Log steht jede Sicherung (`docker compose logs backup`), z. B. `Sicherung fertig: taeglich/2026-11-22_030000 (14M)`.

**Fehlgeschlagene Sicherungen fallen auf:** Scheitert eine Sicherung oder ist die letzte älter als 26 Stunden, zeigt `docker compose ps` den Dienst `backup` als `unhealthy`. Schau deshalb ab und zu in `docker compose ps` oder in die Container-Übersicht des NAS.

**In der App:** Admins sehen unter **Einstellungen → Daten & System → Sicherung** Zeitpunkt und Art der letzten Sicherung. Ist sie älter als 26 Stunden oder hat der letzte Lauf nicht geklappt, steht dort ein ruhiger Hinweis. Dafür schreibt der Dienst `backup` zwei kleine Textdateien nach `backups/status/` (`letzter-lauf`, `letzte-sicherung`, nur Zeitpunkt und Art, für alle lesbar). Der Dienst `web` sieht nur diesen Unterordner und nur lesend, nie die Sicherungen selbst.

### 10.2 Von Hand sichern und Stände ansehen

```bash
docker compose run --rm backup jetzt     # sofort sichern (Ordner manuell)
docker compose run --rm backup liste     # vorhandene Stände zeigen
```

### 10.3 Eine Probe machen

Einmal nach der Einrichtung und nach größeren Updates prüfen, ob sich eine Sicherung einspielen lässt. Die Probe nutzt eine Wegwerf-Datenbank, die App läuft dabei weiter:

```bash
docker compose run --rm backup pruefen taeglich/2026-11-22_030000
```

Erwartet: `Probe in Ordnung: taeglich/2026-11-22_030000 lässt sich einspielen (… Tabellen, … Fotodateien).`

### 10.4 Was du zusätzlich tun solltest

- **Zweiter Ort, verschlüsselt:** Ein Backup nur auf demselben NAS hilft nicht, wenn das NAS ausfällt. Kopiere den Ordner `backups` regelmäßig an einen zweiten Ort, z. B. eine externe Platte oder einen Cloud-Speicher, **verschlüsselt**, denn er enthält auch Gesundheitsangaben (Allergien, Schwangerschaft) und die Passwort-Hashes. Dafür eignet sich die Sicherungs-App des NAS (z. B. Hyper Backup mit Verschlüsselung) oder ein Werkzeug wie restic.
- **Die `.env` getrennt sichern:** Ohne `APP_SECRET` ist ein in der App hinterlegter KI-Schlüssel nach dem Einspielen verloren und alle Geräte sind abgemeldet. Die `.env` gehört nicht in denselben Ordner wie die Backups an den zweiten Ort, sondern z. B. in den Passwort-Manager.
- **Export als JSON** (Einstellungen → Daten & System → Export, nur Admins): eine lesbare Datei mit Vorrat, Produkten, Packungen, Mitgliedern, Ziel und Quelle mit Version, ohne Passwörter, Sitzungen und KI-Schlüssel, Fotos nur als Verweis. Gut, um die eigenen Daten mitzunehmen oder anzusehen. Sie **ersetzt keine Sicherung**: Zurückspielen geht nur mit einem Stand aus Abschnitt 11.
- **Snapshots des NAS** für die Ordner `fotos` und `backups` einschalten, falls das NAS sie bietet. Ein Snapshot des laufenden Ordners `db` ersetzt den Dump nicht, weil die Datenbank darin mitten im Schreiben eingefroren sein kann.

## 11. Wiederherstellen

So spielst du einen Stand zurück. **Datenbank und Fotos werden dabei durch den Stand ersetzt.**

```bash
docker compose stop web worker                                           # App anhalten
docker compose run --rm backup liste                                     # Stand aussuchen
docker compose run --rm backup wiederherstellen taeglich/2026-11-22_030000
docker compose up -d                                                     # App wieder starten
```

Der Container fragt vor dem Ersetzen nach und erwartet die Eingabe `ja`. Läuft die App noch, bricht er ohne Änderung ab: `Die App ist noch verbunden. Bitte zuerst: docker compose stop web worker`.

So bleibt es sicher:
- **Zuerst sichert er den jetzigen Zustand** nach `vor-wiederherstellung/…`. Hast du den falschen Stand gewählt, spielst du einfach diesen zurück.
- Von `vor-wiederherstellung` bleiben die neuesten 5. Spielst du den ältesten davon zurück, räumt er ihn danach weg. Sein Inhalt ist jetzt der laufende Stand, und der neue Stand `vor-wiederherstellung/…` hält den Zustand davor.
- Er spielt den Stand in eine **neue** Datenbank ein und ersetzt die alte erst, wenn das geklappt hat. Lässt sich der Stand nicht einspielen, bleibt alles, wie es war.
- Die Fotos ersetzt er erst ganz am Ende. Bricht das ab (z. B. Platte voll), nennt die Meldung den Stand `vor-wiederherstellung/…` von eben. Schaffe Platz und spiele denselben Stand noch einmal zurück.

Erwartet: `Wiederhergestellt. Der Zustand davor liegt unter vor-wiederherstellung/…` und `Jetzt die App starten …: docker compose up -d`. Nimm `up -d` und nicht nur `start web`: So läuft auch `migrate` und bringt einen älteren Stand auf das Schema der aktuellen Version.

**Auf einem neuen NAS** (das alte ist defekt):
1. Abschnitte 4 bis 6 durchgehen, mit **derselben `.env`** (gleiches `APP_SECRET`) und derselben Version wie beim Backup.
2. Den gesicherten Ordner `backups` vom zweiten Ort zurück in den neuen Preposaurus-Ordner kopieren.
3. Wie oben wiederherstellen.

Wer ein **altes oder fremdes** Backup einspielt, holt damit auch alte Sitzungen zurück. Dann nach dem Start alle Geräte abmelden (mehr dazu in Abschnitt 13):

```bash
docker compose exec web node scripts/admin.mjs alle-abmelden
```

## 12. Updates und der Weg zurück

Neue Versionen stehen auf der [Release-Seite](https://github.com/polygonhunter/preposaurus/releases) mit ihren Änderungen.

1. **Sichern:** `docker compose run --rm backup jetzt vor-update` und den Namen aus der Ausgabe merken (z. B. `vor-update/2026-11-22_100512`). Diesen Stand löscht der Container nie von selbst, auch nicht die nächtliche Sicherung.
2. **Version eintragen:** in der `.env` die Zeile `PREPOSAURUS_VERSION=` auf die neue Nummer setzen.
3. **Neue Dateien prüfen:** Falls das Release geänderte Compose-Dateien enthält, das neue Archiv wie in Abschnitt 4.2 entpacken (ohne `cp env.beispiel .env`, deine `.env` bleibt). Achtung: Das Entpacken ersetzt `compose.yaml` und `compose.tailscale.yaml` ohne Rückfrage. Hast du sie selbst angepasst, vorher eine Kopie anlegen und die Änderung danach neu eintragen.
4. **Ziehen und neu starten:**
   ```bash
   docker compose pull
   docker compose up -d
   ```
   `migrate` bringt die Datenbank dabei automatisch auf den neuen Stand.
5. **Prüfen:** `docker compose ps -a` wie in Abschnitt 6, dann die App öffnen.

**Zurück zur alten Version:** Datenbank-Änderungen laufen nur vorwärts. Der Weg zurück ist deshalb:
1. `docker compose stop web worker`
2. Alte Nummer in `PREPOSAURUS_VERSION` eintragen, `docker compose pull`.
3. Den Stand von vor dem Update einspielen: `docker compose run --rm backup wiederherstellen vor-update/2026-11-22_100512` (Abschnitt 11).
4. `docker compose up -d`

Was zwischen Update und Rückweg erfasst wurde, ist danach weg (es steckt aber noch im Stand `vor-wiederherstellung/…`). Alte Stände unter `vor-update` löschst du selbst, wenn du sie nicht mehr brauchst: `rm -r backups/vor-update/<name>`.

## 13. Notfall-Befehle: Passwort vergessen, kein Admin, alle abmelden

Für Notfälle gibt es vier Befehle, die du auf dem NAS im Preposaurus-Ordner ausführst, während die App läuft. Jeder Befehl, der etwas ändert, hinterlässt eine Zeile im Log von `web` (`docker compose logs web`), nie mit Passwort.

| Befehl | Wofür |
|---|---|
| `nutzer-auflisten` | zeigt Benutzername, Anzeigename, Rolle, ob aktiv und die letzte Anmeldung |
| `passwort-zuruecksetzen <benutzername>` | neues vorläufiges Passwort, siehe unten |
| `admin-machen <benutzername>` | macht den Nutzer wieder aktiv und zum Admin |
| `alle-abmelden` | meldet alle Geräte aller Nutzer ab |

### Den richtigen Benutzernamen finden

```bash
docker compose exec web node scripts/admin.mjs nutzer-auflisten
```

Erwartet, z. B.:
```
Benutzername  Anzeigename  Rolle     Aktiv  Letzte Anmeldung
alex          Alex         admin     ja     20.11.2026, 09:30
sam           Sam          mitglied  nein   noch nie
```

### Admin-Passwort vergessen

1. **Gibt es einen zweiten Admin,** setzt er das Passwort in der App zurück (Einstellungen → Nutzer).
2. **Sonst** auf dem NAS im Preposaurus-Ordner:
   ```bash
   docker compose exec web node scripts/admin.mjs passwort-zuruecksetzen <benutzername>
   ```

Erwartet:
```
Neues vorläufiges Passwort für „alex“: fqju-frbq-zmcw-ctek-wq52
Es wird nur jetzt angezeigt. Alle Sitzungen und Anmeldesperren sind aufgehoben.
```

Der Befehl erzeugt das Passwort selbst und zeigt es nur einmal. Er beendet alle Sitzungen dieses Nutzers und hebt die Anmeldesperren auf (für den Namen, die Pause für alle und die Sperren je Adresse). Melde dich damit an und setze danach ein eigenes Passwort. Im Log von `web` steht eine Zeile `Passwort per Kommandozeile zurückgesetzt` ohne das Passwort.

Das Passwort steht danach im Terminal. Teilst du gerade deinen Bildschirm oder zeichnest ihn auf, vorher beenden, und das Terminal danach schließen bzw. leeren (`clear`).

### Es gibt keinen aktiven Admin mehr

Wurde der einzige Admin deaktiviert oder herabgestuft, oder ist die Person nicht mehr da:

```bash
docker compose exec web node scripts/admin.mjs admin-machen <benutzername>
```

Erwartet: `„sam“ ist jetzt ein aktiver Admin.` Der Nutzer behält sein Passwort. Kennt er das Passwort nicht, danach `passwort-zuruecksetzen` für ihn ausführen.

### Alle Geräte abmelden

Nach dem Einspielen eines alten oder fremden Backups (Abschnitt 11) oder wenn ein Gerät verloren ging, auf dem jemand angemeldet war:

```bash
docker compose exec web node scripts/admin.mjs alle-abmelden
```

Erwartet: `Alle Geräte sind abgemeldet (3 Sitzungen beendet).` Jeder meldet sich danach mit seinem Passwort neu an. Anders als ein neues `APP_SECRET` bleibt dabei ein in der App hinterlegter KI-Schlüssel erhalten.

Die Befehle gibt es bewusst nur im Container, nicht als Formular oder Einstellung: Wer `docker compose exec` ausführen darf, hat ohnehin Zugriff auf alle Daten.

## 14. Fehlersuche

Die wichtigsten Befehle:

```bash
docker compose ps -a                 # läuft alles?
docker compose logs --tail=100 web   # Meldungen der App
docker compose logs db migrate       # Datenbank und Einrichtung
docker compose logs tailscale        # Tailscale
```

| Problem | Ursache und Lösung |
|---|---|
| `… fehlt in .env` beim Start | Eine Pflichtvariable ist leer. Abschnitt 5 |
| `web` startet nicht, im Log `Ungültige Umgebungsvariablen` | Ein Wert in der `.env` passt nicht, z. B. `APP_SECRET` zu kurz. Die Meldung nennt die Variable |
| `migrate` steht auf `Exited (1)` | `docker compose logs migrate` lesen. Oft ist die Datenbank nicht erreichbar oder `POSTGRES_PASSWORD` wurde nach dem ersten Start geändert. Altes Passwort wieder eintragen |
| `db` meldet `password authentication failed` | `POSTGRES_PASSWORD` wurde nach dem ersten Start geändert. Die Datenbank behält das erste Passwort. Altes Passwort wieder eintragen |
| `db` meldet etwas zu `/var/lib/postgresql/data` | Der Ordner `db` stammt von PostgreSQL 17 oder älter. Neu einrichten und ein Backup einspielen |
| Fotos lassen sich nicht speichern, im Log `EACCES` | Der Ordner `fotos` gehört nicht dem Nutzer aus `PREPOSAURUS_UID`. Abschnitt 4.3 |
| Browser findet die Adresse nicht | Tailscale auf dem Gerät verbunden? MagicDNS an (Abschnitt 3.1)? Erscheint das Gerät unter **Machines**? |
| Zertifikatsfehler oder langer erster Aufruf | HTTPS-Zertifikate im Admin-Bereich eingeschaltet? Der erste Aufruf holt das Zertifikat und dauert etwas. `docker compose logs tailscale` zeigt Fehler |
| Anmeldung klappt, aber man ist sofort wieder abgemeldet | Die App wurde über `http://` statt `https://` geöffnet. Das sichere Cookie geht nur über HTTPS |
| Kamera geht nicht | Nur über die `https://…ts.net`-Adresse. Im Browser die Kamera für die Seite erlauben |
| „Zu viele Versuche“ bei der Anmeldung | Kurz warten (höchstens 15 Minuten) oder ein Admin setzt das Passwort zurück. Für den einzigen Admin: Abschnitt 13 |
| Tailscale-Gerät nach Monaten offline | Schlüssel abgelaufen. In **Machines** neu anmelden und **Disable key expiry** wählen |
| App nach einem Neustart des Tailscale-Containers nicht mehr erreichbar | `web` hängt noch am Netz des alten Tailscale-Containers. `docker compose up -d --force-recreate web` (*noch nicht am Gerät geprüft*) |
| Tailscale meldet einen ungültigen oder verbrauchten Auth-Schlüssel | Der Schlüssel war einmalig und ist verbraucht, der Ordner `tailscale` aber leer (z. B. neu angelegt). Neuen Schlüssel erzeugen (Abschnitt 3.3), eintragen, `docker compose up -d`, danach wieder leeren |
| `backup` steht in `docker compose ps` auf `unhealthy` | Die letzte Sicherung ist gescheitert oder älter als 26 Stunden. `docker compose logs backup` lesen, dann `docker compose run --rm backup jetzt` |
| Backup meldet „Es läuft schon eine Sicherung …“ | Gerade läuft eine Sicherung, Probe oder Wiederherstellung. Kurz warten |
| `pull` meldet `denied` oder `unauthorized` | Das Image ist (noch) nicht öffentlich. Mit einem GitHub-Token mit Leserecht für Pakete anmelden: `docker login ghcr.io` |
| `!reset` wird nicht verstanden | Docker Compose ist älter als 2.24. Docker bzw. Container Manager aktualisieren |

## 15. Hinweise je NAS-Typ

Die Abschnitte 3 bis 14 gelten überall. Hier steht nur, was je Gerät anders ist. **Alle Angaben in diesem Abschnitt sind noch nicht am Gerät geprüft.**

### Synology (Container Manager)

*Noch nicht am Gerät geprüft.*
- **Docker:** Paket **Container Manager** aus dem Paket-Zentrum installieren (DSM 7.2 oder neuer). Prozessor prüfen: Nur Modelle mit x86-64 oder ARM64 gehen.
- **Ordner:** Container Manager legt den freigegebenen Ordner `docker` an. Preposaurus kommt nach `/volume1/docker/preposaurus`.
- **SSH:** Systemsteuerung → Terminal & SNMP → SSH aktivieren. Docker-Befehle brauchen dort `sudo` (`sudo docker compose …`).
- **Nutzer-ID:** Der erste angelegte Nutzer hat meist die ID 1026, Gruppe `users` = 100. Mit `id -u` und `id -g` prüfen und in die `.env` eintragen.
- **Projekt anlegen:** Am zuverlässigsten per SSH wie in Abschnitt 6. In der Oberfläche: Container Manager → **Projekt** → **Erstellen**, Pfad `/docker/preposaurus`, „vorhandene compose.yaml verwenden“. Ob die Oberfläche `COMPOSE_FILE` aus der `.env` und damit die Tailscale-Datei berücksichtigt, ist offen. Im Zweifel per SSH starten.
- **Compose-Version:** Container Manager bringt eine eigene Docker-Compose-Version mit. Mit `docker compose version` prüfen, ob sie mindestens 2.24 ist.
- **Tailscale:** Der Tailscale-Container braucht kein Tailscale-Paket auf dem NAS und keinen freien Port 443. Das Synology-Paket aus dem Paket-Zentrum wird laut Tailscale nicht mehr unterstützt.
- **Snapshots:** Mit dem Paket **Snapshot Replication** auf Btrfs-Volumes für den Ordner `docker` einschalten. **Hyper Backup** mit Verschlüsselung für den zweiten Ort.

### QNAP (Container Station)

*Noch nicht am Gerät geprüft.*
- **Docker:** **Container Station** aus dem App Center installieren (Version 3 oder neuer bringt Docker Compose mit).
- **Ordner:** z. B. im freigegebenen Ordner `Container`: `/share/Container/preposaurus`.
- **SSH:** Systemsteuerung → Netzwerk- & Dateidienste → Telnet/SSH. Ob Docker dort `sudo` braucht, hängt am Nutzer.
- **Nutzer-ID:** mit `id -u` und `id -g` prüfen.
- **Projekt anlegen:** per SSH wie in Abschnitt 6, oder in Container Station unter **Anwendungen** → **Erstellen** mit dem Inhalt der Compose-Datei. Ob die Oberfläche die `.env` und `COMPOSE_FILE` liest, ist offen.
- **Snapshots:** Speicher & Snapshots für das Volume. **Hybrid Backup Sync** mit Verschlüsselung für den zweiten Ort.

### Unraid

*Noch nicht am Gerät geprüft.*
- **Docker Compose:** Unraid bringt Docker mit, aber kein Compose in der Oberfläche. Das Community-Plugin **Docker Compose Manager** nachinstallieren oder Compose per Terminal nutzen.
- **Ordner:** `/mnt/user/appdata/preposaurus`.
- **Nutzer-ID:** Unraid-Container laufen üblicherweise als `nobody` (99) mit Gruppe `users` (100). `PREPOSAURUS_UID=99` und `PREPOSAURUS_GID=100` eintragen und `chown 99:100 fotos backups`.
- **Tailscale:** Unraid hat eine eigene Tailscale-Integration je Container. Der hier beschriebene Tailscale-Container funktioniert unabhängig davon. Bitte nur einen der beiden Wege nutzen.
- **Backups:** Der Ordner `appdata` wird oft vom Plugin **Appdata Backup** gesichert. Das ersetzt den Datenbank-Dump nicht, ergänzt ihn aber. Den Ordner `backups` zusätzlich verschlüsselt an einen zweiten Ort kopieren.

### Beliebiger Linux-Server

In der CI auf Ubuntu mit Docker geprüft (ohne Tailscale-Container).
- **Docker:** nach der offiziellen Anleitung für die Distribution installieren: [docs.docker.com/engine/install](https://docs.docker.com/engine/install/). Das Paket `docker-compose-plugin` gehört dazu.
- **Ordner:** z. B. `/srv/preposaurus` oder `~/preposaurus`.
- **Nutzer-ID:** Dein Nutzer hat meist 1000, dann passt der Standard.
- **Snapshots:** je nach Dateisystem (Btrfs, ZFS, LVM). Für den zweiten Ort eignet sich restic oder borg mit Verschlüsselung.
- **Neustart:** Die Dienste haben `restart: unless-stopped` und starten nach einem Neustart des Servers von selbst, wenn Docker beim Booten startet (`sudo systemctl enable docker`).

## 16. Tailscale als Paket auf dem NAS (zweiter Weg)

Wer Tailscale schon als Paket direkt auf dem NAS hat, kann auf den Tailscale-Container verzichten. *Noch nicht am Gerät geprüft.*

**Voraussetzung: Docker Engine 28.3.3 oder neuer.** Bei älteren Versionen erreichen Geräte im selben Netz den Port `127.0.0.1:3000` unter Umständen trotzdem (Docker-Lücken, behoben in 28.0.0 und 28.3.3). Dann könnte ein Gerät im WLAN die Anmeldebremse je Adresse mit einem selbst gesetzten `X-Forwarded-For` umgehen. NAS-Pakete bringen oft ältere Versionen mit (`docker version` zeigt sie). Im Zweifel den Tailscale-Container nehmen: Dort ist gar kein Port auf dem NAS offen, und die App lauscht nur innerhalb des Containers.

1. In der `.env`: `COMPOSE_FILE=compose.yaml`. `TS_HOSTNAME` und `TS_AUTHKEY` werden nicht gebraucht.
2. Starten wie in Abschnitt 6. Die App lauscht dann nur auf `127.0.0.1:3000` des NAS, also nicht im Heimnetz.
3. Auf dem NAS Tailscale Serve einrichten:
   ```bash
   tailscale serve --bg 3000
   ```
   Erwartet: Tailscale nennt die Adresse `https://<nas-name>.<tailnet>.ts.net`.
4. **Nie** den Port als `3000:3000` freigeben und keinen anderen Reverse-Proxy davor setzen, der `X-Forwarded-For` nicht selbst setzt (siehe Abschnitt 1).

Hinweise: Der Gerätename ist hier der Name des NAS im Tailnet und landet ebenfalls im Zertifikats-Log. Auf Synology meldet das Forum Konflikte mit Port 443 und das Paket braucht eine Startaufgabe für ausgehende Verbindungen. Dort ist der Tailscale-Container der einfachere Weg.
