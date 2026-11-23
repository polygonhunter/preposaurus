# PoC Foto-Erkennung: Anleitung

Das Messskript (`npm run poc:recognition`, #103) schickt eigene Testfotos über die echte Erkennung der App an die KI, vergleicht das Ergebnis mit den Werten, die tatsächlich auf der Packung stehen, und schreibt einen Bericht. Damit entscheidet der Maintainer, welches Modell je Foto-Rolle genutzt wird (#104, #105).

Alles liegt im Ordner `poc/` im Projekt. Er ist git-ignoriert, weil Fotos Standortdaten (EXIF/GPS) enthalten können. Fotos, Erwartungswerte und Berichte kommen nie ins Repository.

## 1. Fotos ablegen (#104)

```
poc/
├─ erwartungen.json      die richtigen Werte je Foto
├─ fotos/
│  ├─ verpackung/        Vorderseite: Art, Behälter, Füllmenge
│  ├─ naehrwerte/        Nährwerttabelle
│  └─ mhd/               Datumsaufdruck
└─ berichte/             legt das Skript selbst an
```

- Ziel laut Plan: etwa 15 Verpackungs-, 10 Nährwert- und 30 MHD-Fotos.
- Schwierige Fälle gehören dazu: geprägt, schräg, spiegelnd, nur Monat und Jahr, „zu verbrauchen bis“, unlesbar.
- Formate wie in der App: JPEG, PNG, WebP, HEIC. Die Fotos laufen durch dieselbe Bildverarbeitung wie ein Upload (verkleinert auf 1600 px, ohne EXIF). Die KI sieht also genau das, was sie auch in der App sähe.
- Die Unterordner sind ein Vorschlag. Maßgeblich ist der Pfad in `erwartungen.json`.

## 2. Erwartungswerte eintragen

Vorlage mit erfundenen Werten: [`docs/poc/erwartungen.beispiel.json`](poc/erwartungen.beispiel.json). Kopieren nach `poc/erwartungen.json` und je Foto einen Eintrag anlegen:

```json
{
  "toleranz": { "relativ": 0.05, "absolut": 0.5 },
  "fotos": [
    {
      "datei": "mhd/bohnen-nur-monat.jpg",
      "rolle": "mhd",
      "notiz": "nur Monat und Jahr",
      "erwartet": { "datum": "2029-11" }
    }
  ]
}
```

| Feld | Bedeutung |
|---|---|
| `datei` | Pfad unter `poc/fotos/`, ohne `..` |
| `rolle` | `verpackung`, `naehrwerte` oder `mhd` |
| `notiz` | frei, nur für dich (z. B. „geprägt“) |
| `erwartet` | was wirklich auf der Packung steht, siehe unten |
| `toleranz` | optional. Inhalt und Nährwerte gelten als Treffer, wenn sie höchstens um max(absolut, relativ × Erwartung) abweichen. Standard: 5 %, mindestens 0,5 |

**Regel für jedes Feld in `erwartet`:**
- Feld weggelassen: wird nicht bewertet.
- `null`: steht nicht drauf oder ist unlesbar. Richtig ist dann nur „nichts erkannt“.
- Wert: so steht es drauf.

| Rolle | Felder in `erwartet` |
|---|---|
| `verpackung` | `lebensmittelart` (Schlüssel aus den Stammdaten, z. B. `nudeln`, `thunfisch`; Liste in `db/seeds/stammdaten/arten/`), `behaelter` (`dose`, `glas`, `packung`, `flasche`, `tetrapak`, `beutel`), `inhalt` (`{ "wert": 500, "einheit": "g" }`, Einheit `g` oder `ml`) |
| `naehrwerte` | `kcal`, `eiweiss_g`, `kohlenhydrate_g`, `fett_g`, immer **je 100 g bzw. 100 ml** (steht nur „je Portion“ drauf, selbst umrechnen) |
| `mhd` | `datum` (Pflicht): `JJJJ-MM-TT` bei Tag, `JJJJ-MM` bei nur Monat, `JJJJ` bei nur Jahr, `null` bei unlesbar. Optional `art`: `mhd` oder `verbrauchen_bis` |

Dasselbe Foto darf für mehrere Rollen eingetragen sein (je Rolle ein Eintrag).

## 3. Schlüssel setzen und starten

In `.env` im Projektordner:

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-…
```

`AI_PROVIDER=fake` aus `.env.example` ergibt nur einen **Trockenlauf** mit Fake-KI (keine Kosten, keine echten Werte, im Bericht deutlich markiert). Ohne Schlüssel bricht das Skript mit einer Meldung ab. Statt `.env` zu ändern, geht auch `AI_PROVIDER=anthropic npm run poc:recognition`.

```bash
npm run poc:recognition                                   # Haiku und Sonnet, alle Rollen
npm run poc:recognition -- --rollen mhd                   # nur MHD
npm run poc:recognition -- --modelle haiku --modelle-mhd haiku,sonnet,opus
npm run poc:recognition -- --hilfe                        # alle Optionen
```

- Je Rolle läuft jedes gewählte Modell einzeln (beim MHD ohne Zweitversuch).
- Beim MHD läuft zusätzlich die **Standard-Strategie** der App (#114): Haiku, bei Sicherheit „niedrig“ oder ohne Datum ein Zweitversuch mit Sonnet. `--ohne-standard` lässt sie weg.
- Die Fotos laufen nacheinander. Vor dem ersten KI-Aufruf werden alle Fotos geladen, ein fehlendes Foto bricht also ab, bevor Kosten entstehen.
- Kosten grob: Haiku 5.5 liegt bei Bruchteilen eines Cents je Foto, Sonnet 5.5 etwa beim Zwanzigfachen. Der Bericht nennt die tatsächliche Schätzung.

## 4. Bericht lesen (#105)

Das Skript schreibt `poc/berichte/bericht-<Zeitpunkt>.md` (zum Lesen) und `.json` (alle Einzelergebnisse, z. B. für eine Tabelle). Beide enthalten nur Dateinamen, nie Bildinhalte.

Je Rolle:
- **Übersicht je Variante:** Trefferquote (Anteil richtiger Felder), Fotos ganz richtig, leere Felder, Fehler (Zeitlimit, Anbieter, Antwort außerhalb des Schemas), beim MHD erfundene MHDs und Zweitversuche, Ø Dauer je Foto, Tokens, Kosten gesamt und je Foto.
- **Treffer je Feld:** z. B. `lebensmittelart 12/15 (2 leer)`.
- **Erfundene MHDs** mit Foto-Namen: Kennzahl Nr. 1. Erfunden heißt: Die KI nennt ein Datum, das so nicht aufgedruckt ist, also bei unlesbarem Aufdruck, ein anderes Datum, genauer als aufgedruckt (Tag statt nur Monat) oder ungenauer (nur Monat statt Tag: Die App zeigt dann das Monatsende, also ein späteres Datum als aufgedruckt).
- **Abweichungen:** jedes falsche, leere, erfundene oder gescheiterte Feld mit Erwartung und Antwort.

Begriffe: **Treffer** = richtig gelesen oder richtig „nichts lesbar“. **Leer** = lesbar, aber nicht erkannt (harmlos: Der Nutzer trägt es selbst ein). **Falsch** = anderer Wert. **Erfunden** = Wert, obwohl nichts lesbar ist.

Bewertet wird der Vorschlag so, wie die App ihn zeigt (nach dem Mapping in `capture/domain`): Ein unplausibler Wert, den die App verwirft, zählt als leer.

Das Ergebnis (Empfehlung je Rolle, jedes erfundene MHD mit Foto-Name) kommt danach in `docs/poc/FOTO_ERKENNUNG.md`, die Entscheidung des Maintainers in `05_STATUS_ENTSCHEIDUNGEN.md` (M14-03).
