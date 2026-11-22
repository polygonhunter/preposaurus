# Faktenblatt (AP0)

Prüfung der Punkte aus `PLAN.md` Abschnitt 7 gegen Primärquellen.
**Abrufdatum aller Quellen: 2026-11-22.**
Status: **geprüft** = Aussage steht so in der verlinkten Quelle · **nicht prüfbar** = keine Primärquelle gefunden, nicht als Tatsache verwenden · **Ableitung** = eigener Schluss aus geprüften Fakten, als solcher kennzeichnen.

Abweichungen von den Annahmen im Plan sind mit **⚠ Abweichung** markiert.

---

## F1 · Lizenz Paperless-ngx
- **Aussage:** Paperless-ngx steht unter GPL-3.0 (nicht AGPL).
- **Quelle:** GitHub-API `license.spdx_id` = `GPL-3.0` – https://github.com/paperless-ngx/paperless-ngx (Lizenzdatei: https://github.com/paperless-ngx/paperless-ngx/blob/main/LICENSE)
- **Status:** geprüft

## F2 · Lizenz Audiobookshelf
- **Aussage:** Audiobookshelf steht unter GPL-3.0.
- **Quelle:** GitHub-API `license.spdx_id` = `GPL-3.0` – https://github.com/advplyr/audiobookshelf
- **Status:** geprüft

## F3 · Vergleichsprojekte
- **Aussage:** Immich AGPL-3.0, Mealie AGPL-3.0, Grocy MIT.
- **Quellen:** GitHub-API `license.spdx_id` – https://github.com/immich-app/immich · https://github.com/mealie-recipes/mealie · https://github.com/grocy/grocy
- **Status:** geprüft

## F4 · MIT, GPL-3.0, AGPL-3.0 in einfachen Worten

| Lizenz | Erlaubt | Verlangt | Quelle |
|---|---|---|---|
| MIT | Nutzen, kopieren, ändern, verbreiten, verkaufen, unter andere Lizenz stellen („sublicense“) | Copyright- und Lizenzhinweis bleibt in allen Kopien erhalten. Keine Gewährleistung | https://opensource.org/license/mit |
| GPL-3.0 | Nutzen, ändern, verbreiten, auch kommerziell | Wer das Programm (oder eine Änderung) **weitergibt**, muss den Quelltext unter GPL-3.0 mitliefern bzw. anbieten. Reiner Betrieb auf eigenem Server ohne Weitergabe löst das nicht aus | https://www.gnu.org/licenses/gpl-3.0.txt |
| AGPL-3.0 | wie GPL-3.0 | zusätzlich § 13: Wer eine **geänderte** Fassung betreibt und Nutzer über ein Netzwerk damit arbeiten lässt, muss diesen Nutzern den Quelltext der geänderten Fassung anbieten | https://www.gnu.org/licenses/agpl-3.0.txt (§ 13 „Remote Network Interaction“) |

- **Netzwerk-Klausel nur in AGPL:** § 13 der AGPL-3.0 heißt „Remote Network Interaction“. § 13 der GPL-3.0 regelt dagegen nur die Kombination mit AGPL-Code („Use with the GNU Affero General Public License“).
- **„or later“:** Steht im Lizenzhinweis „version 3 of the License, or (at your option) any later version“, darf der Empfänger auch spätere FSF-Versionen wählen (GPL-3.0 § 14 bzw. AGPL-3.0 § 14). SPDX-Kennungen: `GPL-3.0-or-later`, `AGPL-3.0-or-later` gegenüber `-only`.
- **MIT ist mit GPL vereinbar:** Die FSF führt die Expat-Lizenz (= „MIT“) als „compatible with the GNU GPL“ – https://www.gnu.org/licenses/license-list.en.html#Expat
- **Status:** geprüft (gegen Lizenztexte). Hinweis: Zusammenfassung in Alltagssprache, keine Rechtsberatung.

## F5 · Tailscale Serve auf dem NAS
**Geprüft:**
- **Synology:** Das Paket im Synology Package Center wird laut Tailscale **nicht mehr unterstützt**; empfohlen ist die manuelle SPK-Installation vom Tailscale-Paketserver. Unter DSM 7 erlaubt das Paket standardmäßig nur eingehende Verbindungen, weil es kein TUN-Gerät anlegen darf; ausgehend erst über eine Root-Startaufgabe (`configure-host`), die nach jedem Paket-Update erneut laufen muss. – https://tailscale.com/kb/1131/synology – **geprüft**
- **QNAP:** Installation über das QNAP App Center (empfohlen) oder manuell als `.qpkg`. Zu Serve, HTTPS oder Port 443 sagt die Seite nichts. – https://tailscale.com/kb/1273/qnap – **geprüft**
- **Unraid:** Tailscale ist offiziell als App verfügbar; Unraid bietet je Container den Schalter „Use Tailscale“ mit Serve/Funnel je Container (Voraussetzung: HTTPS-Zertifikate im Tailnet aktiviert). – https://docs.unraid.net/unraid-os/system-administration/secure-your-server/tailscale · https://tailscale.com/kb/1307/unraid – **geprüft**
- **Sidecar-Container (herstellerunabhängig):** Tailscale beschreibt das Muster offiziell: ein Tailscale-Container je Dienst, der App-Container hängt mit `network_mode: service:<tailscale>` daran; `TS_SERVE_CONFIG` zeigt auf eine JSON-Datei, `${TS_CERT_DOMAIN}` wird beim Start durch den eigenen Gerätenamen ersetzt, Ziel z. B. `http://127.0.0.1:<port>`; der Zustand muss in einem Volume liegen (`TS_STATE_DIR`, `/var/lib/tailscale`). `TS_USERSPACE` ist standardmäßig an. – https://tailscale.com/blog/docker-tailscale-guide (07.02.2024) · https://tailscale.com/docs/features/containers/docker/docker-params – **geprüft**
- **Erlaubte Ports:** **⚠ Abweichung:** Die Liste 443 / 8443 / 10000 gilt laut Tailscale für **Funnel**, nicht für Serve: „For Funnel, you must use one of the allowed ports: 443, 8443, or 10000.“ – https://tailscale.com/docs/reference/tailscale-cli/funnel. Die Serve-Referenz nennt `--https=<port>` ohne feste Portliste. – https://tailscale.com/kb/1242/tailscale-serve – **geprüft** (dass beliebige Ports bei Serve gehen, steht dort nicht ausdrücklich)
- **`--bg`:** Serve läuft damit dauerhaft im Hintergrund und übersteht Neustarts. – https://tailscale.com/kb/1242/tailscale-serve – **geprüft**

**Nicht prüfbar:**
- **Konflikt mit Port 443 auf Synology (DSM-nginx belegt 80/443):** Nur Forenbeiträge, keine Herstellerseite. Genannte Auswege dort: Serve auf anderem HTTPS-Port (z. B. 8443) oder Sidecar-Container mit eigener Tailnet-Adresse. – Beispiele: https://www.synoforum.com/threads/nas-420-and-dsm-7-2-2-update-4-change-ports-443-and-ports-80-to-something-else-to-free-up-ports.15477/post-76755 · https://forums.unraid.net/topic/191745-tailscale-docker-integration-https-serve-not-functioning-as-expected-example-heimdall/ – **nicht prüfbar**
- **Ob `tailscale serve` im Host-Paket unter DSM 7 (Hybrid-/Userspace-Modus) zuverlässig läuft:** keine Herstellerangabe. – **nicht prüfbar**
- **Ableitung:** Der Sidecar-Weg umgeht den 443-Konflikt, weil der Container ein eigenes Tailnet-Gerät mit eigener Adresse ist. Das folgt aus dem Muster oben, steht aber so nicht in einer Herstellerquelle. Beide Wege zeigen, offen lassen (hängt am NAS-Modell).

## F6 · MagicDNS, HTTPS-Zertifikate, CT-Log, Funnel
- **Aussage:** HTTPS-Zertifikate setzen MagicDNS voraus und werden im Admin-Bereich (Seite DNS → „Enable HTTPS“) aktiviert. Zertifikate kommen von Let's Encrypt, gelten 90 Tage; der private Schlüssel bleibt auf dem Gerät. – https://tailscale.com/kb/1153/enabling-https – **geprüft**
- **Aussage:** Gerätenamen und Tailnet-Name werden im öffentlichen Certificate-Transparency-Log veröffentlicht; Tailscale rät, keine sensiblen Gerätenamen zu verwenden. – https://tailscale.com/kb/1153/enabling-https – **geprüft**
- **Aussage:** Serve setzt aktivierte HTTPS-Zertifikate voraus und holt das Zertifikat dann automatisch; Serve ist nur im Tailnet erreichbar und fügt Identitäts-Header hinzu. – https://tailscale.com/kb/1312/serve – **geprüft**
- **Aussage:** Funnel ist standardmäßig deaktiviert und braucht ein `funnel`-Attribut in der Tailnet-Richtlinie; öffentlich wird ein Port nur durch einen `tailscale funnel`-Befehl. – https://tailscale.com/kb/1223/funnel – **geprüft**. Hinweis: Die Serve-Seite formuliert missverständlich, Funnel sei „auf dem Gerät“ standardmäßig an; die Funnel-Seite sagt „disabled by default“. Für die Doku gilt: Funnel nicht einrichten.

## F7 · Tailscale-Tarif
- **Aussage:** Der kostenlose Tarif „Personal“ erlaubt **bis zu 6 Nutzer** und **unbegrenzt viele Nutzergeräte**, dazu bis zu 50 „tagged resources“; nur für nicht-kommerzielle Nutzung. – https://tailscale.com/pricing – **geprüft**
- **Aussage:** Ein einzelnes Gerät (z. B. das NAS) kann an Personen **außerhalb** des eigenen Tailnets freigegeben werden; diese brauchen dafür **ein eigenes Tailscale-Konto** (beliebiger Anbieter-Login). Freigabe ist in allen Tarifen verfügbar. – https://tailscale.com/kb/1084/sharing – **geprüft**
- **Nicht prüfbar:** Ob per Freigabe eingeladene Personen auf die 6-Nutzer-Grenze angerechnet werden, steht auf keiner der Seiten.
- **Ableitung:** Ein Haushalt mit bis zu 6 Personen kann komplett im kostenlosen Tarif bleiben; jede Person braucht ein eigenes Konto (entweder als Nutzer im Tailnet oder über Geräte-Freigabe).

## F8 · iPhone Duo: Bildschirme
- **Aussage (Hersteller):** Innen 7,6" OLED-Faltdisplay, 1878 × 2670 px, 430 ppi. Außen 5,4" OLED, 1398 × 2034 px, 460 ppi. Beide Super Retina XDR, ProMotion bis 120 Hz. Chip A20 Pro, iOS 27. – https://www.apple.com/iphone-duo/specs/ (Seite geöffnet) – **geprüft**. Punktmaße nennt die Seite nicht.
- **Aussage (CSS-Viewport in Safari 27.1, WebKit-Blog, Jen Simmons, 23.10.2026):** – https://webkit.org/blog/18486/webkit-features-for-safari-27-1/ – **geprüft**

| Zustand | Breite (CSS-px) | Höhe klein/groß (svh/lvh) |
|---|---|---|
| Außen, hochkant | 382 | 580 / 618 |
| Außen, quer | 594 | 368 / 406 |
| Innen, hochkant (ein Tab) | **669** | 867 / 902 |
| Innen, quer (ein Tab) | 951 | 585 / 620 |
| Innen, zwei Fenster nebeneinander (je) | 385 | 571 / 609 |

- **⚠ Abweichung:** Der Plan rechnete mit ~466 (außen) und ~626 (innen). Tatsächlich: außen **382** (Safari legt seine Bedienleiste seitlich; Webinhalt läuft laut WebKit nicht hinter diesen Streifen, Safari füllt ihn mit der Seiten-Hintergrundfarbe), innen hochkant **669**.
- **Falz/Segmente:** Safari 27.1 hat die **Device Posture API** (`device-posture: continuous | folded`) und die **Viewport Segments API** (`horizontal-viewport-segments`, `env(viewport-segment-*)`) nur als Vorschau hinter Feature-Flags, standardmäßig aus. Halb aufgeklappt („Buch“) zeigt Safari PDFs zweiseitig. – https://developer.apple.com/documentation/safari-release-notes/safari-27_1-release-notes · WebKit-Blog oben – **geprüft**
- **Nicht prüfbar:** Viewport-Maße für **Home-Bildschirm-Apps** (standalone) auf dem Duo; genaue Lage der Falz in CSS-px; User-Agent-String (WebKit nennt ihn nicht, rät zu Feature-Erkennung). Test über den iPhone-Duo-Simulator in Xcode 27.1 (Device Hub) möglich.

## F8b · Folge für den Umbruchpunkt
- **Ableitung:** Innen hochkant 669 px und quer 951 px. Mit dem einzigen Umbruchpunkt des Prototyps bei 768 px bekommt das aufgeklappte Duo **hochkant das Handy-Layout**, **quer das breite Layout**. Außen (382 px) entspricht einem normalen iPhone. Grundlage: F8 (WebKit-Tabelle). – **Ableitung aus geprüften Werten**

## F9 · Lizenzen von Bibliotheken und Schriften
- **GSAP:** Eigene Lizenz „Standard ‚no charge‘ license“ (Webflow), keine Open-Source-Lizenz. Kostenlos auch kommerziell, inklusive aller früheren Bonus-Plugins. Verboten ohne Zustimmung: Nutzung in No-Code-Werkzeugen, die mit Webflows visuellem Animations-Baukasten konkurrieren; Entfernen von Hinweisen; Webflow kann die Bedingungen ändern und die Nutzung bei Verstoß entziehen. Copyright „GreenSock. All rights reserved.“; npm-Feld `license` verweist auf diese Lizenz (Version 3.15.1). – https://gsap.com/standard-license · https://github.com/greensock/GSAP (README, `package.json`) – **geprüft**
- **GSAP mit GPL/AGPL:** Die GSAP-Lizenz erwähnt GPL/AGPL nicht. Die FSF schreibt: Wer ein GPL-Programm mit einer GPL-inkompatiblen, nicht freien Bibliothek verbindet, muss als Rechteinhaber eine **Zusatzerlaubnis nach GPL-3.0 § 7** in jede betroffene Datei schreiben; fremden GPL-Code kann man so nicht freigeben. – https://www.gnu.org/licenses/gpl-faq.en.html#GPLIncompatibleLibs · https://www.gnu.org/licenses/gpl-faq.en.html#FSWithNFLibs – **geprüft** (Quellen). **Ableitung:** GSAP ist wegen der Nutzungsbeschränkungen nicht GPL-kompatibel. Bei AGPL/GPL wäre also eine § 7-Ausnahme für GSAP nötig (geht, solange nur eigener Code betroffen ist) oder eine freie Alternative; bei MIT entsteht kein Lizenzkonflikt, die GSAP-Bedingungen gelten aber weiter für alle, die das Projekt nutzen. Keine Rechtsberatung.
- **web-push:** MPL-2.0 (npm 4.0.0; Lizenzdatei im Repo). MPL-2.0 § 3.3 erlaubt die Kombination mit GPL-2.0+, LGPL-2.1+ und AGPL-3.0+. – https://github.com/web-push-libs/web-push/blob/master/LICENSE · https://www.gnu.org/licenses/license-list.en.html#MPL-2.0 – **geprüft**
- **sharp:** Apache-2.0 (npm 0.35.5). Die mitgelieferten libvips-Binärpakete (`@img/sharp-libvips-*`, 1.3.4) stehen unter **LGPL-3.0-or-later**; libvips selbst laut GitHub LGPL-2.1. Apache-2.0 ist mit GPL-3.0 vereinbar (nicht mit GPL-2.0). – https://github.com/lovell/sharp · https://registry.npmjs.org/@img/sharp-libvips-linux-x64/latest · https://github.com/libvips/libvips · https://www.gnu.org/licenses/license-list.en.html#apache2 – **geprüft**
- **Lucide:** ISC (lucide-react 1.77.0); einige von Feather abgeleitete Icons stehen zusätzlich unter dem Feather-Hinweis in derselben Lizenzdatei. ISC ist laut FSF GPL-kompatibel. – https://github.com/lucide-icons/lucide/blob/main/LICENSE · https://www.gnu.org/licenses/license-list.en.html#ISC – **geprüft**
- **Schriften:** Inter, Space Grotesk und Geist Mono stehen unter der SIL Open Font License 1.1. Die FSF nennt die OFL eine freie Lizenz für Schriften. – https://github.com/rsms/inter · https://github.com/floriankarsten/space-grotesk · https://github.com/vercel/geist-font · https://github.com/google/fonts/tree/main/ofl · https://www.gnu.org/licenses/license-list.en.html#SILOFL – **geprüft**

## F10 · Anthropic: Modelle, Preise, Structured Outputs, Bild-Tokens
- **Modelle und IDs:** Claude Sonnet 5.5 = `claude-sonnet-5-5`, Claude Haiku 5.5 = `claude-haiku-5-5` (datumslose IDs sind feste Snapshots). Beide: Bild-Eingabe, 1 Mio. Token Kontext, 128k Ausgabe. Abschaltung frühestens 28.09.2027 (Sonnet 5.5) bzw. 07.10.2027 (Haiku 5.5). – https://platform.claude.com/docs/en/about-claude/models/overview – **geprüft**
- **Preise (Stand 2026-11-22, USD je 1 Mio. Token):**
  - Sonnet 5.5: Eingabe 2 $, Ausgabe 10 $, Cache-Treffer 0,10 $.
  - Haiku 5.5 (Prompt bis 100.000 Token): Eingabe 0,10 $, Ausgabe 0,50 $. Über 100.000 Token: 0,50 $ / 2,50 $.
  - Batch-API: −50 %.
  - US-only-Inferenz (`inference_geo: "us"`): ×1,1.
  - Quelle: https://platform.claude.com/docs/en/about-claude/pricing – **geprüft**. Hinweis: Haiku 5.5 hat als einziges Modell gestaffelte Preise nach Prompt-Länge.
- **Structured Outputs:** `output_config.format` mit `type: "json_schema"`. Im TypeScript-SDK `zodOutputFormat()` + `client.messages.parse()` (Ergebnis in `parsed_output`). Unterstützt für Sonnet 5.5 und Haiku 5.5. Wichtige Schema-Grenzen:
  - nicht unterstützt: rekursive Schemas, `oneOf` (stattdessen `anyOf`), `not`, `minimum`/`maximum`/`multipleOf`, `minLength`/`maxLength`;
  - `minItems` nur 0 oder 1;
  - `additionalProperties` muss `false` sein;
  - `z.record()` liefert nur `{}`.
  - Die SDK-Helfer verschieben nicht unterstützte Grenzen in die Feldbeschreibung und prüfen sie lokal nach.
  - Das Schema wird bis zu 24 h gecacht.
  - Quelle: https://platform.claude.com/docs/en/build-with-claude/structured-outputs – **geprüft**
- **Bild-Tokens:** Kosten = `⌈Breite/28⌉ × ⌈Höhe/28⌉` Token (28×28-px-Felder). Claude 4.7 und neuer (also auch Sonnet/Haiku 5.5): lange Kante höchstens 2576 px, höchstens 4784 Token; größere Bilder werden verkleinert. Formate JPEG, PNG, GIF, WebP; höchstens 10 MB je Bild (base64), 8000 × 8000 px. – https://platform.claude.com/docs/en/build-with-claude/vision – **geprüft** (deckt sich mit `research/26`).

## F11 · Anthropic: Datenschutz
- **Kein Training:** „Retained data is never used for model training without your express permission.“ – https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention – **geprüft**
- **Aufbewahrung:** Die Datenschutz-Hilfe nennt für API-Ein- und -Ausgaben automatische Löschung „within 30 days of receipt or generation“; von Sicherheitssystemen markierte Inhalte bis zu 2 Jahre. – https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data – **geprüft**. Hinweis: Die API-Doku formuliert inzwischen, Gesprächsinhalte würden standardmäßig nicht gespeichert (Ausnahme „Covered Models“ wie Fable/Mythos mit 30 Tagen). Für die Seiten vorsichtig formulieren: „höchstens 30 Tage“. Zero Data Retention nur auf Anfrage beim Vertrieb.
- **Datenresidenz:** `inference_geo` kennt nur `"global"` (Standard) und `"us"`; Workspace-Speicherort nur `"us"`. **Keine EU-Residenz.** – https://platform.claude.com/docs/en/manage-claude/data-residency – **geprüft** (bestätigt `01`)

## F12 · iOS: Web-Push, Kamera, VPN aus
- **Web-Push:** ab iOS/iPadOS 16.4, nur für zum Home-Bildschirm hinzugefügte Web-Apps. Die Erlaubnis muss durch eine direkte Nutzeraktion (Tippen) angefragt werden. Läuft über Apple Push Notification Service (`*.push.apple.com`), kein Apple-Entwicklerkonto nötig. Standards: Push API, Notifications API, Service Worker. – https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ – **geprüft**
- **Kamera nur über HTTPS:** `getUserMedia()` gibt es nur in sicheren Kontexten (HTTPS oder localhost); sonst ist `navigator.mediaDevices` `undefined`. – https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia – **geprüft**
- **Kamera in der Home-Bildschirm-App:** WebKit-Bug 185448 („getUserMedia not working in apps added to home screen“) ist seit iOS 13.4 als behoben geschlossen. – https://bugs.webkit.org/show_bug.cgi?id=185448 – **geprüft** (historisch). Für das aktuelle iOS 27 gibt es keine eigene Herstelleraussage → auf echtem Gerät testen. – **nicht prüfbar** (aktueller Stand)
- **Verhalten, wenn das Tailscale-VPN aus ist:** keine Primärquelle. – **nicht prüfbar**

## F13 · Push bei reinem Tailscale-Betrieb
- **Geprüft:** Web-Push auf iOS läuft über Apples Push-Server (`*.push.apple.com`). Der Server muss diese also erreichen können. – https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- **Ableitung:** Der Worker auf dem NAS braucht ausgehenden Internetzugang zu den Push-Diensten. Die Benachrichtigung kommt auch ohne VPN an, weil sie über Apple läuft. Beim Öffnen lädt die App aber vom NAS, das geht nur mit aktivem Tailscale. Keine Herstellerquelle für diesen Gesamtablauf. – **Ableitung, nicht prüfbar als Ganzes**

## F14 · PostgreSQL 18 und Node 24 im Docker
- **PostgreSQL-Datenpfad:** Ab PostgreSQL 18 ist `PGDATA` im offiziellen Image versionsabhängig (`/var/lib/postgresql/18/docker`), das Volume liegt eine Ebene höher (`/var/lib/postgresql`). Bei 17 und älter: `/var/lib/postgresql/data`. – https://hub.docker.com/_/postgres – **geprüft**
- **Architekturen `postgres:18`:** amd64, arm64/v8, arm/v7, arm/v5, 386, ppc64le, riscv64, s390x (Alpine-Variante zusätzlich arm/v6). – Docker-Hub-API https://hub.docker.com/v2/repositories/library/postgres/tags/18 – **geprüft**
- **Architekturen `node:24`:** `24-bookworm-slim`: amd64, arm64/v8, ppc64le. `24-alpine`: amd64, arm64/v8, s390x. **Kein 32-Bit-ARM.** – https://hub.docker.com/v2/repositories/library/node/tags/24-bookworm-slim · https://hub.docker.com/v2/repositories/library/node/tags/24-alpine – **geprüft**. Folge: 32-Bit-ARM-NAS scheiden aus (bestätigt die Vermutung im Plan); x86-64 und ARM64 gehen.
- **Mindest-Kernel alter NAS-Geräte:** keine Herstellerangabe für diese Images gefunden. – **nicht prüfbar**

## F15 · Mermaid
- **Diagrammtypen (Mermaid-Doku):** u. a. Flowchart, Sequence, Class, State, Entity Relationship (`erDiagram`), User Journey, Gantt, Pie, Quadrant, Requirement, GitGraph, C4, Mindmap, Timeline, Sankey, XY Chart, Block, Packet, Kanban, Architecture, Radar, Treemap und weitere (teils Beta). – https://mermaid.js.org/intro/syntax-reference.html – **geprüft**
- **Hell/dunkel:** Mermaid hat Themes wie `default`, `neutral`, `dark`, `forest`, `base` (anpassbar über `themeVariables`) und weitere. Ein automatischer Wechsel nach `prefers-color-scheme` ist **nicht dokumentiert**; das Theme wird über `mermaid.initialize`, Frontmatter oder `%%{init}%%` gesetzt. – https://mermaid.js.org/config/theming.html – **geprüft**
- **Darstellung in der Claude-Artifact-Ansicht** (welche Typen gerendert werden, ob sie dem Theme folgen): keine öffentliche Quelle. – **nicht prüfbar** → AP1 testet mit der Musterseite.

## F16 · BLE/BBK-Mengen und DGE-Werte
- Laut Plan kein Auftrag für AP0. In den Seiten nicht als Tatsache nennen. – **nicht geprüft (außerhalb des Umfangs)**
- **Nachtrag 2026-11-22:** an den Primärquellen geprüft im Prüfblatt `docs/quellen/EMPFEHLUNGSWERTE.md` (#19). Die Freigabe durch den Maintainer steht aus.

## F17 · GitHub-Issue #1
- **Aussage:** Issue #1 heißt „Einrichtungsanleitung: Preposaurus auf dem NAS mit Tailscale“ und enthält 11 Listenpunkte. – https://github.com/polygonhunter/preposaurus/issues/1 (gelesen über `gh`) – **geprüft**
