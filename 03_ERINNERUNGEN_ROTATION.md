# Erinnerungen & Rotation – Konzept (Entwurf v0.1, 2026-10-07)

Ziel: Der Vorrat bleibt „lebendig“, also wird verbraucht, bevor er abläuft, und nachgekauft. Ohne Nerven-Spam.

## 1. Verbrauchen (Entnahme)
- Pro Produkt ein Button **„1 entnehmen“**. Die App nimmt automatisch die Packung mit dem **frühesten MHD** (FIFO). Die Auswahl lässt sich ändern.
- Entnommene Einheiten werden nicht gelöscht, sondern bekommen den Status `verbraucht` oder `weggeworfen` mit Datum. Das ergibt eine Historie und später Statistik („2026: 0,4 kg weggeworfen“).
- Nach der Entnahme fragt die App optional: „Auf die Einkaufsliste setzen?“

## 2. Ampel pro Einheit
| Farbe | Bedeutung | Standard-Schwelle |
|---|---|---|
| 🟢 Grün | ok | > 3 Monate |
| 🟡 Gelb | bald verbrauchen | ≤ 3 Monate |
| 🟠 Orange | dringend | ≤ 4 Wochen |
| 🔴 Rot | abgelaufen (MHD: prüfen, oft noch gut / Verbrauchsdatum: weg damit) | < heute |

Die Schwellen sind in den Einstellungen änderbar. Beim MHD steht ein freundlicher Hinweis („MHD ist kein Wegwerfdatum: anschauen, riechen, probieren“). Beim Verbrauchsdatum steht er nicht.

## 3. Erinnerungen
**Kanal:** Web-Push (PWA). Auf dem iPhone muss die App dafür zum Home-Bildschirm hinzugefügt sein; das Onboarding erklärt das.
Ausweichkanäle (in den Einstellungen): E-Mail-Zusammenfassung, später ntfy.

**Prinzip: gebündelt statt einzeln.** Keine Benachrichtigung pro Packung.

| Art | Wann | Inhalt (Beispiel) |
|---|---|---|
| **Wochen-Digest** | 1×/Woche, Tag+Uhrzeit wählbar (Standard: Sa 10:00) | „3 Artikel bald verbrauchen · Ziel: 6 von 10 Tagen · diese Woche kaufen: 6 l Wasser“ |
| **Dringend** | sofort, max. 1×/Tag | „Thunfisch läuft in 7 Tagen ab“ |
| **Ziel-Etappe** | bei Erreichen / 2 Wochen vor Zieldatum | „Geschafft: 3 Tage versorgt 🎉“ / „Noch 2 Wochen bis 31.12.: es fehlen 4 Tage“ |
| **Inventur** | alle 3 Monate (wählbar) | „Kurzer Vorrats-Check? Dauert ca. 5 Minuten“ |

Jeder Nutzer stellt eigene Benachrichtigungen ein (z. B. nur der Digest).

## 4. Ansichten
- **„Bald verbrauchen“**: alles Gelbe und Orange, sortiert nach Datum. Gedacht für den Blick vor dem Kochen.
- **Inventur-Modus**: Produkt für Produkt durchgehen und Menge bestätigen oder korrigieren. Ziel: in 5 Minuten fertig.
- Später: Rezeptvorschläge aus „Bald verbrauchen“ (per KI).

## 5. Einkaufsliste
- Füllt sich automatisch aus Ziel-Lücke + „nachkaufen“ nach Entnahme. Einträge lassen sich auch manuell ergänzen.
- Gemeinsam für alle Nutzer des Haushalts.
- Abhaken → direkt in die Erfassung (Foto/manuell).

## 6. DB-Skizze
`einheit.status` (vorrat | verbraucht | weggeworfen) + `einheit.entnommen_am` + `einheit.entnommen_von` (FK nutzer)
`benachrichtigung_einstellung` (nutzer, art, aktiv, zeitplan) · `push_abo` (nutzer, endpoint, keys)
`einkaufsliste_eintrag` (warengruppe/produkt, menge, quelle: ziel|nachkauf|manuell, erledigt)

## Entscheidungen (2026-10-07)
- **Ampel** wie oben: ja.
- **Statistiken** gewünscht:
  - Erfüllungsgrad in % der Empfehlung (100 %, 110 %, 120 % … Übererfüllung sichtbar)
  - „So viele Tage haltet ihr durch“
  - Check-in-Serie (wöchentlich/monatlich erledigt)
  - Verbraucht vs. weggeworfen
- **Check-in-Mails**: regelmäßig (wöchentlich/monatlich), freundlicher Ton: „Wie sieht’s aus? Zeit für einen Blick in den Vorrat: X ist abgelaufen, Y bald fällig.“
- **Einkaufsliste**: ja, aber bewusst schlank als **„Nachkaufen“-Liste** für den Vorrat, keine allgemeine Einkaufslisten-App.
- **UI-Prototypen**: 5 komplett unterschiedliche, animierte Designs mit **Next.js + GSAP** in `prototypes/`, „richtig cool, aber funktional“.

## Status-Ansichten & Filter (2026-10-08)
Im Vorrat zusätzlich zum Kategorie- und Behälterfilter ein **Status-Filter**:

| Filter | Zeigt |
|---|---|
| Im Vorrat | alle aktiven Einheiten (Standard) |
| Bald fällig | gelb + orange |
| Abgelaufen | rot (MHD überschritten, noch nicht entschieden) |
| Nachkaufen | Produkte auf der Nachkaufen-Liste |
| Verbraucht | Historie: entnommen und gegessen |
| Entsorgt | Historie: weggeworfen (mit Datum, wer) |

- **Aktionen pro Einheit:** „Verbraucht“ · „Entsorgt“ · „Noch gut“ (MHD geprüft → bleibt im Vorrat, Hinweis „geprüft am …“).
- Abgelaufene Einheiten zählen nicht mehr zu „versorgt“, bleiben aber sichtbar, bis man entscheidet.
- Historie (verbraucht/entsorgt) ist filterbar nach Zeitraum und speist die Statistik.
- DB: `einheit.status` (vorrat | verbraucht | entsorgt) + `einheit.geprueft_am?`; „bald fällig“/„abgelaufen“ werden aus dem MHD berechnet, nicht gespeichert.
