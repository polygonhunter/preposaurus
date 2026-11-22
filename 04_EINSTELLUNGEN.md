# Einstellungen & Nutzerverwaltung – Konzept (Entwurf v0.1, 2026-10-08)

## Grundsatz
- **Dashboard = anzeigen. Einstellungen = ändern.** Im Dashboard stehen nur Zustände (read-only) mit einem dezenten „Bearbeiten →“, das direkt in den passenden Einstellungsbereich springt.
- Erreichbar über ein **Zahnrad im Header** (oder Profil-Avatar), nicht als eigener Tab in der Tabbar. Die Tabbar bleibt für den Alltag: Übersicht · Vorrat · Neu · Statistik · Nachkaufen.
- Klare Trennung zwischen **Haushalt** (gilt für alle, nur Admins ändern) und **Mein Konto** (gilt nur für mich).

## Rollen
| Rolle | Darf |
|---|---|
| **Admin** | alles: Haushalt, Mitglieder, Ziel/Quelle, Stammdaten, KI, Nutzerverwaltung, Daten & System |
| **Mitglied** | Vorrat pflegen (erfassen, entnehmen, entsorgen), Nachkaufen, eigene Kontoeinstellungen |

Der erste Nutzer bei der Einrichtung ist Admin. Mindestens ein Admin muss immer bestehen bleiben.

## Struktur

### Haushalt (Admin)
1. **Mitglieder**
   - Liste, anlegen, bearbeiten, entfernen
   - Felder: Name, Piktogramm, Typ, Geburtsjahr, Geschlecht, Aktivität, Gewicht, schwanger/stillend, **Ernährungsform** (Standard „wie Haushalt“), Allergien
   - Haustiere: später
2. **Ernährung**: Haushalts-Standard (alles · vegetarisch · vegan)
3. **Ziel & Empfehlung**: Quelle (BBK/BLE, Stand + Link), Rechenmodus (offiziell/individuell), Zieldauer, Zieldatum, Etappen
4. **Vorrat-Stammdaten**: Kategorien (eigene anlegen, Piktogramm, Warengruppe zuordnen, ausblenden, sortieren), Lagerorte, Schlagwörter
5. **Ampel & Regeln**: Schwellen gelb/orange, Inventur-Intervall
6. **Foto-Erkennung**
   - KI an/aus
   - Modell je Foto-Art (Verpackung · Nährwerte · MHD)
   - Status „API-Schlüssel hinterlegt ✓“ (der Schlüssel selbst nur in `.env`, nie in der UI)
   - Datenschutzhinweis „Fotos werden zur Erkennung an Anthropic (USA) gesendet“
   - Kostenübersicht des Monats

### Nutzerverwaltung (Admin)
- Nutzer **anlegen/einladen** (Einladungslink oder Startpasswort), Rolle setzen, deaktivieren, entfernen
- **Nutzer ≠ Haushaltsmitglied:** Ein Login-Nutzer kann optional mit einem Mitglied verknüpft sein (Alex ↔ Mitglied Alex). Mitglieder ohne Login sind normal (z. B. Kinder).
- Übersicht: letzter Login, aktive Geräte/Sitzungen, Sitzung beenden
- Passwort zurücksetzen (lokal, ohne E-Mail-Zwang)

### Mein Konto (jeder Nutzer)
- Profil: Name, E-Mail, Passwort ändern, **Passkey** hinzufügen, Geräte/Sitzungen
- **Benachrichtigungen**
  - Push an/aus je Gerät
  - Wochenübersicht (Tag + Uhrzeit)
  - Dringend
  - Etappen
  - Check-in-Mail (wöchentlich/monatlich/aus)
- **Darstellung**
  - Hell/Dunkel (Standard hell)
  - Animationen reduzieren
  - Startansicht

### Daten & System (Admin)
- **Export** (JSON komplett, CSV Vorrat) und **Import**
- Backup-Status (letztes DB-Backup)
- Verlauf leeren / alte Historie archivieren
- Version, Lizenz, verwendete Quellen (BBK/BLE mit Stand), Open-Food-/Icon-Lizenzen

## Was aus dem Dashboard rausfliegt
| Bisher im Dashboard | Neu |
|---|---|
| Ernährungsform-Umschalter + Chips pro Mitglied | Einstellungen → Haushalt. Dashboard-Kachel zeigt nur Mitglieder + Ernährungsform als Text |
| Hell/Dunkel-Umschalter im Header | Einstellungen → Mein Konto → Darstellung |
| Ziel ändern (implizit) | Einstellungen → Ziel & Empfehlung; Dashboard zeigt Ziel nur an |

**Bleibt im Dashboard/Vorrat** (Alltagsaktionen): erfassen, entnehmen, verbraucht/entsorgt/noch gut, Nachkaufen abhaken, Filter.

## DB-Skizze
`nutzer` (id, haushalt_id, name, email, rolle: admin|mitglied, aktiv, mitglied_id? FK) · Sessions/Passkeys über Better Auth
`nutzer_einstellung` (nutzer_id, theme, animationen_reduziert, startansicht)
`benachrichtigung_einstellung` (nutzer_id, art, aktiv, zeitplan) · `push_abo` (nutzer_id, geraet, endpoint, keys)
`haushalt_einstellung` (haushalt_id, standard_ernaehrungsform, ampel_gelb_tage, ampel_orange_tage, inventur_intervall, ki_aktiv, ki_modell_verpackung, ki_modell_naehrwerte, ki_modell_mhd)
