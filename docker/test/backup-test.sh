#!/usr/bin/env bash
# CI-Test für Sicherung und Wiederherstellung (UMSETZUNG M13-03): sichern, danach Daten und Fotos
# ändern, den Stand zurückspielen und die Zeilenzahlen aller Tabellen vergleichen. Dazu Arten von
# Ständen, Rechte, Healthcheck und das Sicherheitsnetz beim Wiederherstellen.
# Aufruf aus dem Repo-Ordner, beide Images (…:ci) müssen gebaut sein.
set -euo pipefail
repo_dir=$(pwd)
# shellcheck source=docker/test/lib.sh
. "$repo_dir/docker/test/lib.sh"
prepare_install_dir "$repo_dir"
trap 'docker compose down --volumes > /dev/null 2>&1 || true' EXIT

# Zeilenzahl je Tabelle, z. B. "kategorie=10,nutzer=1,…"
ROW_COUNTS="select string_agg(table_schema || '.' || table_name || '=' || (xpath('/row/c/text()',
  query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text,
  ',' order by table_schema, table_name)
  from information_schema.tables where table_schema in ('public', 'drizzle') and table_type = 'BASE TABLE'"

backup() {
  docker compose run --rm -T "$@"
}

newest() {
  backup backup liste | grep "^$1/" | tail -n 1
}

add_user() {
  psql_value "insert into nutzer (id, name, benutzername, email)
    values ('00000000-0000-4000-8000-00000000000$1', 'Nutzer $1', 'nutzer$1', 'n$1@nutzer.invalid')" > /dev/null
}

docker compose up -d
wait_for_health

add_user 1
mkdir -p fotos/haushalt
echo "foto-1" > fotos/haushalt/eins.jpg
before=$(psql_value "$ROW_COUNTS")

# Täglicher Lauf wie aus dem Zeitplan, am Stichtag mit Wochenstand. Ein Rest eines abgebrochenen
# Laufs wird dabei aufgeräumt.
mkdir -p backups/taeglich/.laufend-alt
backup -e WEEKLY_DAY="$(date +%u)" backup zeitplan-lauf
stand=$(newest taeglich)
[ -n "$stand" ] || fail "Kein täglicher Stand angelegt"
[ ! -e backups/taeglich/.laufend-alt ] || fail "Der halbe Stand eines alten Laufs ist noch da"
[ -s "backups/$stand/datenbank.dump" ] || fail "Der Dump fehlt in backups/$stand"
[ -f "backups/$stand/fotos/haushalt/eins.jpg" ] || fail "Das Foto fehlt in backups/$stand"
[ -n "$(newest woechentlich)" ] || fail "Kein Wochenstand am Stichtag"
[ "$(stat -c %u "backups/$stand")" = "$(id -u)" ] || fail "Der Stand gehört nicht dem Nutzer von fotos"
[ "$(stat -c %a "backups/$stand")" = "700" ] || fail "Der Stand ist für andere lesbar"
[ "$(stat -c %a "backups/$stand/datenbank.dump")" = "600" ] || fail "Der Dump ist für andere lesbar"

# Mehrere Stände am selben Tag überschreiben sich nicht. vor-update bleibt beim Rotieren.
backup backup jetzt
sleep 1
backup backup jetzt
[ "$(backup backup liste | grep -c '^manuell/')" = "2" ] || fail "Zwei manuelle Stände erwartet"
backup -e KEEP_MANUAL=1 backup jetzt vor-update
[ -n "$(newest vor-update)" ] || fail "Kein Stand vor-update"
[ "$(backup backup liste | grep -c '^manuell/')" = "1" ] || fail "manuell wurde nicht rotiert"
backup backup jetzt quatsch && fail "Ein unbekannter Zusatz muss abgelehnt werden"

backup backup pruefen "$stand" | tee probe.log
grep -q 'Probe in Ordnung' probe.log || fail "Die Probe hat den Stand nicht eingespielt"

docker compose exec -T backup backup gesund || fail "Healthcheck nach erfolgreicher Sicherung krank"
docker compose exec -T backup sh -c 'echo "fehler test" > /backups/.letzter-lauf'
docker compose exec -T backup backup gesund && fail "Healthcheck muss einen Fehlschlag melden"

# Nach der Sicherung: neue Zeile, gelöschtes und neues Foto. Alles das soll verschwinden.
add_user 2
rm fotos/haushalt/eins.jpg
echo "foto-2" > fotos/haushalt/zwei.jpg
changed=$(psql_value "$ROW_COUNTS")
[ "$changed" != "$before" ] || fail "Die Testdaten haben sich nicht geändert"

# Ohne --ja und ohne Terminal: Abbruch ohne Änderung.
backup backup wiederherstellen "$stand" && fail "Ohne --ja und ohne Terminal darf nichts passieren"

# Eine offene Verbindung steht für eine laufende App: Dann darf das Zurückspielen nicht starten.
docker compose exec -T -d db psql -U preposaurus -d preposaurus -c 'select pg_sleep(60)'
sleep 2
backup backup wiederherstellen "$stand" --ja && fail "Bei offener Verbindung darf nichts passieren"
docker compose stop web
psql_value "select pg_terminate_backend(pid) from pg_stat_activity
  where query like '%pg_sleep(60)%' and pid <> pg_backend_pid()" > /dev/null

# Ein kaputter Stand: Das Einspielen scheitert, Datenbank und Fotos bleiben unverändert.
mkdir -p backups/manuell/2026-01-01_000000/fotos
echo "kein dump" > backups/manuell/2026-01-01_000000/datenbank.dump
backup backup wiederherstellen manuell/2026-01-01_000000 --ja && fail "Ein kaputter Stand darf nicht gelingen"
[ "$(psql_value "$ROW_COUNTS")" = "$changed" ] || fail "Ein gescheitertes Einspielen hat Daten verändert"
[ -f fotos/haushalt/zwei.jpg ] || fail "Ein gescheitertes Einspielen hat Fotos verändert"

backup backup wiederherstellen "$stand" --ja | tee restore.log
after=$(psql_value "$ROW_COUNTS")
[ "$after" = "$before" ] || fail "Zeilenzahlen weichen ab: vorher $before, nachher $after"
[ "$(cat fotos/haushalt/eins.jpg)" = "foto-1" ] || fail "Das gesicherte Foto ist nicht zurück"
[ ! -e fotos/haushalt/zwei.jpg ] || fail "Das spätere Foto ist noch da"

# Das Sicherheitsnetz hält den Zustand vor dem Zurückspielen fest.
safety=$(newest vor-wiederherstellung)
[ -f "backups/$safety/fotos/haushalt/zwei.jpg" ] || fail "Die Sicherung vor dem Zurückspielen fehlt"
grep -q "$safety" restore.log || fail "Die Meldung nennt die Sicherung davor nicht"

docker compose up -d
wait_for_health
echo "Zeilenzahlen gleich: $after"
echo "Backup-Test bestanden"
