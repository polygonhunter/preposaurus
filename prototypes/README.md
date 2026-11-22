# Preposaurus – Design-Prototyp

Klickbarer Design-Prototyp aus der Konzeptphase. Er diente dazu, Varianten der Oberfläche zu vergleichen (`/d2` bis `/d6`, gewählt wurde `/d6` „Glas-Cockpit“).

**Dieser Ordner ist nicht Teil der App.** Er wird nicht weiterentwickelt, nicht ausgeliefert und nicht in die App übernommen. Alle Zahlen, Produkte und Personen darin sind erfundene Beispieldaten und keine geprüften Empfehlungswerte.

## Starten

```bash
cd prototypes
npm install --ignore-scripts
npm run dev
```

Dann <http://localhost:3000/d6> öffnen.

## Lizenzhinweis (abweichend vom Rest des Repositorys)

Der Rest des Repositorys steht unter der GNU AGPL-3.0-or-later (siehe `../LICENSE`). **Der Ordner `prototypes/` ist davon ausgenommen**, weil er die Animations-Bibliothek [GSAP](https://gsap.com) nutzt.

- GSAP und `@gsap/react` stehen unter der [GSAP Standard „No Charge“ License](https://gsap.com/standard-license) von Webflow. Das ist keine Open-Source-Lizenz und nicht mit der AGPL vereinbar. GSAP selbst liegt nicht im Repository, es wird nur als npm-Abhängigkeit installiert. Für die Nutzung gelten die Bedingungen von Webflow.
- Der eigene Code in diesem Ordner darf als Anschauungsmaterial gelesen und lokal ausgeführt werden. Er wird ohne Gewähr und ohne Open-Source-Lizenz bereitgestellt; alle Rechte bleiben beim Maintainer des Projekts.
- Dateien aus der Next.js-Vorlage (`create-next-app`, z. B. `public/*.svg`, `app/favicon.ico`) stehen unter der MIT-Lizenz von Vercel. Die Logos von Next.js und Vercel sind Marken von Vercel.

Die App selbst (ab Meilenstein M0) animiert ohne GSAP, mit CSS bzw. Motion (MIT).
