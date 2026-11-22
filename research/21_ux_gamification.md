# UX, Onboarding, Retention und Gamification für Preposaurus

> **Kurzfazit:** Der Aufbau des Vorrats ist ein klares Projekt mit Ende. Die Pflege danach ist dagegen eine Aufgabe mit wenig Anlässen: Ein Notvorrat dreht sich langsam, ein MHD läuft oft erst nach Jahren ab. Deshalb passen tägliche Streaks à la Duolingo schlecht. Gut belegt sind dagegen drei Hebel: **sichtbarer Fortschritt mit Startvorsprung** (Endowed Progress, Goal Gradient), **wenige, wertvolle und gut getimte Benachrichtigungen** (Permission im Kontext, Kanäle, ehrliche Dringlichkeit) und **Selbstwirksamkeit statt Angst** (Fear-Appeal-Forschung). Onboarding sollte nur das Nötige abfragen (Haushalt, Quelle, Ziel) und den ersten Fortschritt sofort zeigen. Belastbare Retention-Zahlen speziell für Vorrats- oder Pantry-Apps gibt es öffentlich nicht. Das muss Preposaurus selbst messen.

Hinweis zur Methodik: Das Websuche-Kontingent dieser Sitzung war zu Beginn bereits aufgebraucht. Die Recherche lief deshalb über gezielte Direktabrufe bekannter Primärquellen (Apple, Google/Android, NN/g, Duolingo, BLE). Mehrere Quellen waren nicht abrufbar (403/429). Betroffene Aussagen sind als **[nicht verifiziert]** markiert. App-Beispiele stammen zum Teil aus den Schwester-Reports 01, 02, 03 und 06.

---

## Ergebnisse

### 1. Verhaltenspsychologische Grundlagen

| Prinzip | Kernaussage | Beleg | Relevanz für Preposaurus |
|---|---|---|---|
| **Fogg Behavior Model (B = MAP)** | Verhalten tritt nur auf, wenn Motivation, Fähigkeit und ein Auslöser (Prompt) zur selben Zeit zusammenkommen. | [1] | Erinnerung (Prompt) allein reicht nicht. Die Aktion muss sehr leicht sein (Fähigkeit), z. B. „1 Tipp: verbraucht ✓ / nachgekauft ✓". |
| **Endowed Progress Effect** (Nunes & Drèze 2006) | Eine Aufgabe mit 10 Schritten, bei der 2 schon erledigt sind, wird öfter und schneller abgeschlossen als eine mit 8 Schritten ohne Vorsprung. Ob der Effekt greift, hängt von der Begründung für den Vorsprung und von der „Währung" ab, in der Fortschritt gemessen wird. | [2] | Gleich im Onboarding den vorhandenen Vorrat schätzen lassen („Was habt ihr schon?"). Die meisten Haushalte starten damit nicht bei 0 %. Die oft zitierten Zahlen der Waschanlagen-Studie (34 % vs. 19 %) habe ich in der Primärquelle **nicht** prüfen können **[nicht verifiziert]**. |
| **Goal-Gradient-Effekt** (Kivetz, Urminsky & Zheng 2006) | Je näher das Ziel, desto mehr Einsatz. Gezeigt wurde das an Kaffee-Stempelkarten. | [3] **[nicht verifiziert]**: Primärquelle nicht abrufbar (403), Inhalt aus Fachwissen | Zwischenziele (3 → 5 → 7 → 10 Tage) machen den Weg kürzer. So ist man öfter „kurz vor dem Ziel". |
| **Habit-Bildung** (Lally et al. 2009) | Bis eine Handlung automatisch abläuft, vergehen im Schnitt 66 Tage, bei sehr großer Streuung (18–254 Tage). | [4] (Sekundärquelle Wikipedia; Originalartikel nicht abrufbar) | Eine tägliche Gewohnheit lohnt sich hier nicht. Besser ist es, an bestehende Gewohnheiten anzudocken: Wocheneinkauf, Einräumen nach dem Einkauf, Saisonwechsel. |
| **Selbstbestimmungstheorie (SDT)** | Die stabilste Motivation entsteht, wenn Autonomie, Kompetenz und soziale Eingebundenheit unterstützt werden. Externe Belohnungen werden nur teilweise verinnerlicht. | [5] | Ziel und Quelle selbst wählen lassen (Autonomie), Fortschritt verständlich zeigen (Kompetenz), Haushalt gemeinsam pflegen (Eingebundenheit). Punkte und Badges sind höchstens Beiwerk. |
| **Fear Appeals / EPPM** (Witte) | Angstbotschaften wirken nur, wenn Menschen sich zutrauen, etwas zu tun (Selbstwirksamkeit), und die Maßnahme für wirksam halten. Sonst kommt es zu Abwehr und Verdrängung. Eine Meta-Analyse rät zur Vorsicht bei Angstappellen. | [6] | Keine Katastrophen-Rhetorik. Jede Risiko-Info braucht einen konkreten, kleinen nächsten Schritt („Mit 2 Kisten Wasser seid ihr bei 3 Tagen"). Das deckt sich mit den Nutzerstimmen in Report 06. |

### 2. Onboarding

| Empfehlung | Quelle |
|---|---|
| Onboarding möglichst vermeiden. Lieber die Oberfläche selbsterklärend machen. Swipe-Tutorials („Deck of Cards") werden **nicht empfohlen**. | NN/g [7] |
| Sinnvoll ist Onboarding nur, wenn (a) wichtige Daten gebraucht werden, (b) die App sich darauf anpasst oder (c) eine Funktion wirklich neu ist. Dann knapp bleiben und erklären, wozu die Daten dienen. | NN/g [7] |
| Hilfe dort zeigen, wo sie gebraucht wird (kontextuelle Tipps), nicht vorab. | NN/g [7] |
| Optische Personalisierung (Themes etc.) gehört nicht ins Onboarding. | NN/g [7] |

**Abgeleitet für Preposaurus (Fall a und b treffen zu):** Haushalt, Quelle und Ziel sind echte Pflichtdaten, weil davon der Bedarf abhängt. Alles andere kommt später.

### 3. Benachrichtigungen: Plattformregeln und Best Practices

| Thema | iOS (Apple) | Android (Google) | NN/g |
|---|---|---|---|
| **Wann um Erlaubnis fragen** | Im Kontext, z. B. nachdem jemand die erste Aufgabe angelegt hat, nicht beim ersten Start [8][9] | Nicht direkt beim Start, sondern nach einer passenden Aktion oder nach dem 3.–4. Start, mit Erklärung des Nutzens [10] | Erst in einer späteren Sitzung fragen, vorher erklären, worum es in den Benachrichtigungen geht [11] |
| **Weichere Alternative** | **Provisorische Erlaubnis**: Benachrichtigungen landen leise in der Mitteilungszentrale mit „Behalten / Deaktivieren", ohne vorherigen Dialog [9] | Wegwischen des Dialogs lässt den Status offen. Neu gefragt wird erst nach Update oder Neuinstallation [10]. Die Chance ist also knapp | – |
| **Dringlichkeit** | 4 Stufen: Passiv / Aktiv / Zeitkritisch / Kritisch. „Zeitkritisch" nur für Ereignisse jetzt oder innerhalb einer Stunde. „Kritisch" braucht eine Sonderberechtigung. Dringlichkeit ehrlich angeben, sonst leidet das Vertrauen [8] | **Kanäle** (ab Android 8): Nutzer steuern jeden Kanal einzeln (Ton, Vibration, Wichtigkeit). Die App kann das Verhalten danach nicht mehr ändern. Zusätzlich Systemkategorien wie `CATEGORY_REMINDER` [12] | – |
| **Marketing** | Nur mit ausdrücklicher Einwilligung, nie als „Zeitkritisch", Einstellungen in der App anbieten [8] | Nutzer sehen, wie viele Benachrichtigungen pro Tag kommen, und können sie jederzeit abschalten [10] | Weniger, aber relevante Benachrichtigungen. Mehrere bündeln. Einstellungen in der App anbieten [11] |

**Duolingo als Praxisbeleg für Reminder-Optimierung:** In einem KDD-Paper beschreibt Duolingo, wie es Erinnerungstexte per Bandit-Algorithmus auswählt. Zwei Befunde: „Frische" Vorlagen, die jemand länger nicht gesehen hat, wirken stärker, und der immer gleiche Text stumpft ab. Ergebnis: **+0,5 % tägliche aktive Nutzer und +2 % Retention bei Neunutzern** gegenüber einer starken Vergleichsgruppe [13]. Für Preposaurus heißt das: Textvarianten rotieren und Bedingungen nutzen, also nur passende Vorlagen schicken.

**Keine verifizierten Zahlen:** Für Opt-in-Raten (iOS vs. Android) und Abmeldungen durch zu viele Pushes gibt es Benchmark-Reports (z. B. Airship 2026). Die Zahlen liegen aber hinter einem Formular und konnten nicht geprüft werden [14] **[nicht verifiziert]**.

### 4. Streaks, Meilensteine und Gamification: was belegt ist

| Mechanik | Befund | Quelle | Eignung für Notvorrat |
|---|---|---|---|
| Tägliche **Streak** | Duolingo: Wer 7 Tage Streak erreicht, schließt einen Kurs 3,6-mal so häufig ab. Kurze Streaks belohnen durch den prozentualen Zuwachs, lange wirken über Verlustaversion. | [15] | **Gering.** Ein Notvorrat braucht keine tägliche Handlung. Eine tägliche Streak würde künstliche Pflichten erzeugen und widerspricht „nicht nerven". Achtung: Die 3,6× sind eine Korrelation (Selbstselektion), kein Kausalbeweis. |
| **Streak Freeze / Spielraum** | Bis zu 2 Freezes: +0,38 % tägliche aktive Lernende. Duolingo beruft sich auf Forschung, dass etwas „Spielraum" bei Zielen motivierender ist als starre Regeln. | [15] | **Hoch als Prinzip:** Wird eine Monats-Routine verpasst, gibt es keinen „Absturz". Fortschritt bleibt erhalten. |
| **Meilenstein-Animationen** | Neue Meilenstein-Animationen brachten bei Neulingen +1,7 % Retention nach 7 Tagen. | [15] | **Hoch:** 3 / 7 / 10 / 14 Tage versorgt, „Wasser komplett", „erste Rotation geschafft". |
| **Quiz, Punkte, Spielwelt** | Die Tokyo-Bosai-App (Stadtregierung Tokio) kombiniert Vorrats-Checkliste mit MHD-Alarm, Quiz mit Punkten und einem Spielelement („Bosai City"). | Report 02 [16] | Mittel. Wissens-Quiz (z. B. „Wie viel Wasser pro Person?") kann den Einstieg erleichtern. Wirkung auf die Retention ist **nicht belegt**. |
| **Score / „Tage Abdeckung"** | BeaglePrep („Prep Score"), Provision Planner, PPantry, ProvidentPrep (Ziele 3 Monate / 1 Jahr, Fortschritt je Kategorie) nutzen Abdeckungs-Kennzahlen. | Report 02/03 [16][17] | **Hoch.** Das ist die zentrale Kennzahl und gleichzeitig das wichtigste Motivationselement. |
| **Dark Patterns** | Nörgeln (Nagging), Confirmshaming, falsche Dringlichkeit und „Addictive Design" gelten als täuschende Muster. | [18] | Bewusst vermeiden. Gerade bei einem Sicherheitsthema wäre falsche Dringlichkeit ein Vertrauensbruch. |

**Fehlende Evidenz:** Belastbare, öffentliche Retention-Zahlen für Pantry- oder Prepper-Apps habe ich nicht gefunden (so auch Report 03). Meta-Analysen zur Gamification-Wirkung (z. B. Sailer & Homner 2020) waren nicht abrufbar **[nicht verifiziert]**.

### 5. Ziele mit Zieldatum und Budget: Muster aus anderen Domänen

| Muster | Beispiel | Status |
|---|---|---|
| „Betrag X bis Datum Y" → App rechnet den Monatsbedarf aus und färbt den Fortschritt ein | YNAB Targets, Spar-Ziele in Banking-Apps | Konzept allgemein bekannt. Die YNAB-Doku war nicht abrufbar (404) **[nicht verifiziert]** |
| Tägliche Ringe schließen, Ziele anpassbar | Apple Activity Rings | Doku-Abruf fehlgeschlagen **[nicht verifiziert]** |
| Amtlicher Rechner ohne Fortschritt | Der BLE-Vorratskalkulator rechnet für 1–10 Personen und 1–28 Tage auf Basis von 2.200 kcal pro Person und Tag. **Es gibt keinen Fortschritt, keine Einkaufsliste und keinen Stufenplan.** | [19] |

Übertragen auf Preposaurus: **„10 Tage bis 01.12."** → App rechnet die Lücke aus (kg/kcal/Liter je Kategorie) → verteilt sie auf N Einkäufe (z. B. wöchentlich) → Budget pro Einkauf (Report 06 nennt laut VZ Sachsen „unter 100 € pro Person für 10 Tage") → Ampel „im Plan / leicht hinten / deutlich hinten".

### 6. Lebendiger Vorrat, Rotation und Verbrauchen statt Wegwerfen

| Quelle / App | Inhalt |
|---|---|
| BLE / Ernährungsvorsorge [20][21] | Vorratsplan führen, **FIFO** (neue Ware nach hinten), MHD regelmäßig kontrollieren, Selbstgemachtes und Eingefrorenes datieren, Sichtprüfung (aufgewölbte Dosen nicht essen). Standardempfehlung: 10 Tage. |
| Japan „Rolling Stock" (Report 02) [16] | Apps wie おすそぐら und 備蓄Widget nutzen Ampelfarben (orange < 1 Monat, rot = abgelaufen) und Widgets auf Home- und Sperrbildschirm. |
| Pantry-Apps (Report 03) [17] | Rezepte aus bald ablaufenden Artikeln (CozZo, Fridgely, Shelfze, Grocy). Einkaufsliste aus Verbrauchtem. |
| SuperCook [22] | „Zero Waste"-Rezeptgenerator: Rezepte aus vorhandenen Zutaten. |
| Report 03 | Weil Notvorrat langsam dreht, ist eine Vorwarnung von **3–6 Monaten** sinnvoller als „läuft morgen ab". |
| Report 10/11 | Behördliche Prüfrhythmen: 2× jährlich (FR, LT, Queensland), jährlich (CA, AU Red Cross), Wasser alle 6 Monate tauschen (CDC/Ready.gov). |

---

## Bedeutung für Preposaurus

### A) Onboarding in unter 2 Minuten bis zum ersten Aha-Moment
1. **3 Fragen, 3 Screens:** (1) Wer lebt im Haushalt? (Piktogramm-Zähler: Erwachsene, Kinder, Senior:innen, Haustier) (2) Nach welcher Empfehlung? (Standard je nach Land, z. B. BBK, mit Quelle und Datum sichtbar) (3) Ziel: 3 / 10 / 14 Tage + optional Zieldatum.
2. **Endowed-Progress-Schritt:** „Was habt ihr schon ungefähr da?" mit Grob-Schiebern je Kategorie (Wasser-Kisten, Nudeln/Reis, Konserven). Ergebnis sofort: **„Ihr seid schon für ca. 2,5 Tage versorgt."** Das ist ehrlich und motiviert. Später wird es durch echte Erfassung genauer.
3. **Kein Tutorial-Karussell, kein Account-Zwang.** Hilfe erscheint kontextuell beim ersten Scan, beim ersten MHD usw.
4. **Benachrichtigungen nicht im Onboarding abfragen.** Erst beim ersten erfassten Artikel mit MHD: „Sollen wir dich 3 Monate vorher erinnern, damit nichts verfällt?" Auf iOS optional provisorisch starten.

### B) Fortschritt als Herzstück
- **Hauptkennzahl „Für X Tage versorgt"**, getrieben von der knappsten Kategorie (Wasser ist meist der Engpass). Dazu Ringe oder Balken je Kategorie.
- **Zwischenziele** im Sinne des Goal-Gradient-Effekts: 3 Tage (entspricht etwa der EU-72h-Empfehlung) → 5 → 7 → 10 → 14.
- **Zieldatum-Ampel** wie bei Spar-Zielen: „Noch 8 Wochen, pro Woche ca. 12 € / 3 Artikel" → grün, gelb oder rot.
- **Budgetierte Einkaufsliste** über N Wochen. Pro Woche eine kleine, realistische Liste, die in den normalen Wocheneinkauf passt („1–2 Packungen extra", siehe BMEL-Wochenimpuls in Report 08).

### C) Benachrichtigungs-Konzept („wenig, wertvoll, ehrlich")
| Kanal (Android-Channel / iOS-Kategorie) | Inhalt | Standard | Dringlichkeit |
|---|---|---|---|
| **MHD-Vorwarnung** | Gebündelt: „3 Artikel laufen in den nächsten 3 Monaten ab. Diese Woche einbauen?" | an, max. 1× pro Woche als Sammel-Push | Aktiv |
| **Wochen-Einkauf** | „Dein Plan für diese Woche: 2× Wasser, 1× Reis" am bevorzugten Einkaufstag | an, wenn Zieldatum gesetzt | Passiv/Aktiv |
| **Vorrats-Check** | Halbjährlich oder nach Quelle (z. B. Warntag DE, AT-Probealarm 1. Samstag im Oktober, Zeitumstellung) | an | Passiv |
| **Meilensteine** | „Ihr habt 7 Tage erreicht!" | in der App, kein Push | – |
| **Tipps & Neuigkeiten** | Neue Empfehlung der Quelle, saisonale Hinweise | **aus** (Opt-in) | Passiv |

Regeln: nie „Zeitkritisch" oder „Kritisch" für Vorratsthemen, Texte in Varianten rotieren (Duolingo-Befund), Benachrichtigungen bündeln, Einstellungen in der App, keine Pushes nach Inaktivität im Stil von „Wir vermissen dich".

### D) Retention ohne tägliche Pflicht
- **Rhythmus statt Streak:** „Monats-Check erledigt" oder „Saison-Check" als Serie mit **eingebautem Spielraum** (Freeze-Prinzip). Wer einen Monat verpasst, verliert nichts.
- **Andocken an bestehende Gewohnheiten:** „Nach dem Einkauf einräumen → Schnell-Scan". Ein Widget mit „bald fällig" (Rolling-Stock-Vorbild) macht die App ohne Push präsent.
- **„Verbrauchen-Karte" im Alltag:** „Diese Woche dran: Linsen (MHD 01/2027) → 3 Rezeptideen", danach ein Tipp auf „verbraucht + nachkaufen". Das ist die Kernschleife des lebendigen Vorrats.
- **Wirkung sichtbar machen:** „Seit Start 14 Artikel rotiert, nichts weggeworfen, ca. 23 € gespart". Zahlen nur, wenn sie seriös berechenbar sind.
- **Haushalt gemeinsam:** Wer hat zuletzt aufgefüllt? Leichte soziale Eingebundenheit (SDT), keine Ranglisten.

### E) Gamification-Leitplanken
- **Ja:** Meilensteine, Fortschrittsringe, freundliche Animationen, Abzeichen für Wissen („Wasser-Profi"), optional Quiz zum Einstieg.
- **Nein:** tägliche Streak-Pflicht, Verlust-Drohungen, Confirmshaming („Willst du deine Familie wirklich ungeschützt lassen?"), Angst-Countdowns, Punkte ohne realen Bezug.
- **Ton:** ruhig, kompetent, alltagsnah. Jede Risikoaussage mit einem machbaren Schritt (EPPM).

### F) Rezepte und Verbrauchen
- MVP: einfache Vorschläge pro Kategorie, kuratiert („Notfallküche ohne Strom"-Tag).
- Später: Rezeptmatching aus bald ablaufenden Artikeln (Vorbild SuperCook, Grocy, CozZo), eventuell per LLM.

---

## Offene Fragen
1. **Wie oft wollen Nutzer überhaupt erinnert werden?** Wöchentlich, monatlich oder nur vor Ablauf? Das muss ein Prototyp-Test mit 5–10 Haushalten klären.
2. **Wie genau muss „Für X Tage versorgt" sein?** Grob-Schätzung im Onboarding vs. präzise Erfassung: Wie kommuniziert man Unsicherheit (z. B. „ca.", Spannbreite)?
3. **Welche Kennzahl treibt den Fortschritt?** kcal, kg je Gruppe oder die knappste Kategorie? Abstimmen mit Report 07/08/12.
4. **Opt-in-Raten und Retention-Benchmarks** für Utility-Apps in DACH: keine verifizierten Zahlen vorhanden.
5. **Gamification-Akzeptanz** bei der Zielgruppe „Familien, keine Prepper": Werden Abzeichen als kindisch empfunden?
6. **Budget-Daten:** Woher kommen Preise für die budgetierte Einkaufsliste (Durchschnittspreise, manuell, Händler-APIs)?
7. **Plattform-Abhängigkeit:** Lokale, geplante Benachrichtigungen und Widgets sprechen für native Apps oder Expo (siehe Report 17).
8. Nicht geprüft werden konnten: Kivetz 2006, Lally 2009 (Original), Sailer & Homner 2020, Airship-Benchmarks, YNAB- und Apple-Activity-Doku, Too Good To Go. Bei Bedarf in einer weiteren Runde nachholen.

---

## Quellen
Alle abgerufen am 2026-10-06, sofern nicht anders vermerkt.

1. Fogg, B. J.: Fogg Behavior Model (B=MAP). https://behaviormodel.org/
2. Nunes, J. C. & Drèze, X. (2006): The Endowed Progress Effect. Journal of Consumer Research 32(4), 504–512. https://academic.oup.com/jcr/article/32/4/504/1798066 (Abstract)
3. Kivetz, R., Urminsky, O. & Zheng, Y. (2006): The Goal-Gradient Hypothesis Resurrected. Journal of Marketing Research 43(1). https://journals.sagepub.com/doi/abs/10.1509/jmkr.43.1.39 (**Abruf 403, nicht verifiziert**)
4. Wikipedia: Habit (zitiert Lally et al. 2009, European Journal of Social Psychology). https://en.wikipedia.org/wiki/Habit ; Original: https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674 (Abruf 403)
5. Center for Self-Determination Theory: Theory. https://www.selfdeterminationtheory.org/theory/
6. Wikipedia: Fear appeal (EPPM nach Witte; Peters, Ruiter & Kok 2014). https://en.wikipedia.org/wiki/Fear_appeal
7. Nielsen Norman Group: Mobile-App Onboarding: An Analysis of Components and Techniques. https://www.nngroup.com/articles/mobile-app-onboarding/
8. Apple Human Interface Guidelines: Managing notifications. https://developer.apple.com/design/human-interface-guidelines/managing-notifications
9. Apple Developer Documentation: Asking permission to use notifications (Provisional Authorization). https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications
10. Android Developers: Notification runtime permission. https://developer.android.com/develop/ui/views/notifications/notification-permission
11. Nielsen Norman Group: Push Notifications (Leitfaden). https://www.nngroup.com/articles/push-notification/
12. Android Developers: Create and manage notification channels. https://developer.android.com/develop/ui/views/notifications/channels
13. Yancey, K. P. & Settles, B. (2020): A Sleeping, Recovering Bandit Algorithm for Optimizing Recurring Notifications. KDD '20. https://research.duolingo.com/papers/yancey.kdd20.pdf
14. Airship: Mobile App Push Notification Benchmarks (Landingpage, Daten hinter Formular). https://www.airship.com/resources/benchmark-report/mobile-app-push-notification-benchmarks-for-2025/ (**Zahlen nicht verifiziert**)
15. Duolingo Blog: How the Duolingo streak builds habit. https://blog.duolingo.com/how-duolingo-streak-builds-habit/
16. Preposaurus Report 02 „Konkurrenz international" (u. a. Disaster Preparedness Tokyo, BeaglePrep, japanische Rolling-Stock-Apps; dort mit Primärquellen). `research/02_konkurrenz_international.md`; Tokyo-App: https://apps.apple.com/us/app/-/id1290558619
17. Preposaurus Report 03 „Pantry-Apps und MHD". `research/03_pantry_apps_mhd.md`
18. Deceptive Patterns (Harry Brignull): Types of deceptive pattern. https://www.deceptive.design/types
19. BLE / Ernährungsvorsorge: Vorratskalkulator. https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratskalkulator/
20. BLE / Ernährungsvorsorge: Notvorrat. https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/
21. BLE / Ernährungsvorsorge: So pflegen Sie Ihren Lebensmittelvorrat. https://www.ernaehrungsvorsorge.de/private-vorsorge/empfehlungen-tipps/so-pflegen-sie-ihren-lebensmittelvorrat
22. SuperCook: Zero Waste Recipe Generator. https://www.supercook.com/

Weitere interne Bezüge: Report 06 (Nutzerstimmen), 08 (BMEL), 09 (AT/CH), 10/11 (Prüfrhythmen international), 17 (Plattform/Notifications).
