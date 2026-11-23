# Hinweise zu Drittanbieter-Lizenzen

Preposaurus selbst steht unter der [AGPL-3.0-or-later](LICENSE). Diese Datei nennt fremde Bestandteile mit eigener Lizenz. npm-Abhängigkeiten werden nicht im Repository mitgeliefert, sondern bei der Installation geladen; ihre Lizenztexte liegen in den jeweiligen Paketen. Die vollständige Liste der Produktionsabhängigkeiten prüft `npm run licenses` gegen eine Erlaubnisliste (MIT, MIT-0, Apache-2.0, ISC, 0BSD, BSD-2-Clause, BSD-3-Clause) und die begründeten Ausnahmen in `scripts/license-exceptions.json`.

## Ausnahmen von der Erlaubnisliste

| Bestandteil | Lizenz | Hinweis |
|---|---|---|
| libvips (`@img/sharp-libvips-*`, über sharp) | LGPL-3.0-or-later | dynamisch gelinkte Bibliothek für die Bildverarbeitung, mit der AGPL vereinbar |
| caniuse-lite | CC-BY-4.0 | Browser-Daten, die Next.js zur Build-Zeit liest. © Alexis Deveria und Beitragende, <https://github.com/browserslist/caniuse-lite> |
| lightningcss (über vite und vitest, optionale Peer-Abhängigkeit von better-auth) | MPL-2.0 | nur Werkzeug, läuft nicht zur Laufzeit. MPL-2.0 § 3.3 erlaubt die Kombination mit der AGPL-3.0 |
| fast-sha256 (über standardwebhooks, Abhängigkeit von `@anthropic-ai/sdk`) | Unlicense | Freigabe in die Gemeinfreiheit, mit der AGPL vereinbar. Lädt mit dem SDK und ist ab M6-06 Teil des Images, auch wenn die App die Webhook-Helfer nicht aufruft |
| web-push (geplant) | MPL-2.0 | MPL-2.0 § 3.3 erlaubt die Kombination mit der AGPL-3.0 |

## Weitere Bestandteile

| Bestandteil | Lizenz | Hinweis |
|---|---|---|
| Next.js und Dateien aus der Vorlage `create-next-app` | MIT | © Vercel, Inc. Die Logos von Next.js und Vercel sind Marken von Vercel |
| Lucide (Symbole) | ISC | einige von Feather abgeleitete Symbole zusätzlich unter dem Feather-Hinweis (MIT) in der Lizenzdatei des Pakets |
| Schriften Inter, Space Grotesk, Geist Mono | SIL Open Font License 1.1 | die Konzept-Seiten in `docs/konzept/` laden Inter und Space Grotesk von Google Fonts |
| Fluent Emoji (geplant) | MIT | © Microsoft Corporation |
| Open Food Facts (nur falls genutzt) | Datenbank ODbL 1.0, Inhalte DbCL 1.0 | Namensnennung „Daten von Open Food Facts (ODbL)“ in der App |

## Eigene Datenlisten

| Bestandteil | Lizenz | Hinweis |
|---|---|---|
| Liste häufiger Passwörter (`src/features/auth/domain/common-passwords.json`) | wie die App (AGPL-3.0-or-later) | **selbst zusammengestellt**, keine übernommene Datei. Grundlage sind allgemein bekannte Muster aus öffentlich berichteten Ranglisten häufiger Passwörter (Ziffernfolgen, Tastaturmuster, „passwort“, „hallo“, „ichliebedich“, Vereine, Städte, Vornamen) und daraus abgeleitete Varianten mit typischen Anhängseln. Einzelne Passwörter sind als bloße Wörter und Zeichenfolgen nicht schutzfähig; eine fremde Liste (z. B. aus SecLists, MIT) wurde bewusst nicht kopiert, damit kein Lizenzhinweis Dritter nötig ist. Begründung in `05_STATUS_ENTSCHEIDUNGEN.md` (#174) |

## Nur im Design-Prototyp (`prototypes/`)

| Bestandteil | Lizenz | Hinweis |
|---|---|---|
| GSAP, `@gsap/react` | GSAP Standard „No Charge“ License (Webflow) | **keine Open-Source-Lizenz**, nicht mit der AGPL vereinbar. Deshalb ist `prototypes/` von der AGPL ausgenommen, siehe [`prototypes/README.md`](prototypes/README.md). Die App selbst nutzt kein GSAP |

## Empfehlungswerte und zitierte Quellen

Zahlen aus den Empfehlungen von BBK, BLE, DGE und anderen Stellen werden als Fakten mit Quelle, Stand und Link wiedergegeben. Texte, Grafiken und Logos dieser Herausgeber sind nicht im Repository enthalten; die Rechte daran liegen bei den Herausgebern. Siehe [`research/README.md`](research/README.md).
