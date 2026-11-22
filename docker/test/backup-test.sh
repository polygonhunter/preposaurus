#!/usr/bin/env bash
# CI-Test für Sicherung und Wiederherstellung (UMSETZUNG M13-03): sichern, danach Daten und Fotos
# ändern, den Stand in eine leere DB zurückspielen und die Zeilenzahlen aller Tabellen vergleichen.
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

docker compose up -d
wait_for_health

psql_value "insert into nutzer (id, name, benutzername, email)
  values ('00000000-0000-4000-8000-000000000001', 'Alex', 'alex', 'alex@nutzer.invalid')" > /dev/null
mkdir -p fotos/haushalt
echo "foto-1" > fotos/haushalt/eins.jpg
before=$(psql_value "$ROW_COUNTS")

docker compose run --rm -T -e WEEKLY_DAY="$(date +%u)" backup jetzt
stand=$(docker compose run --rm -T backup liste | grep '^taeglich/' | tail -n 1)
[ -n "$stand" ] || fail "Kein täglicher Stand angelegt"
[ -s "backups/$stand/datenbank.dump" ] || fail "Der Dump fehlt in backups/$stand"
[ -f "backups/$stand/fotos/haushalt/eins.jpg" ] || fail "Das Foto fehlt in backups/$stand"
ls backups/woechentlich | grep -q 'W' || fail "Kein Wochenstand am Stichtag"
docker compose run --rm -T backup pruefen "$stand" | tee probe.log
grep -q 'Probe in Ordnung' probe.log || fail "Die Probe hat den Stand nicht eingespielt"
[ "$(stat -c %u "backups/$stand")" = "$(id -u)" ] || fail "Der Stand gehört nicht dem Nutzer von fotos"

# Nach der Sicherung: neue Zeile, gelöschtes und neues Foto. Alles das soll verschwinden.
psql_value "insert into nutzer (id, name, benutzername, email)
  values ('00000000-0000-4000-8000-000000000002', 'Sam', 'sam', 'sam@nutzer.invalid')" > /dev/null
rm fotos/haushalt/eins.jpg
echo "foto-2" > fotos/haushalt/zwei.jpg
[ "$(psql_value "$ROW_COUNTS")" != "$before" ] || fail "Die Testdaten haben sich nicht geändert"

# Eine offene Verbindung steht für eine laufende App: Dann darf das Zurückspielen nicht starten.
docker compose exec -T -d db psql -U preposaurus -d preposaurus -c 'select pg_sleep(60)'
sleep 2
if docker compose run --rm -T backup wiederherstellen "$stand" --ja; then
  fail "Bei offener Verbindung darf das Zurückspielen nicht starten"
fi
docker compose stop web
psql_value "select pg_terminate_backend(pid) from pg_stat_activity
  where query like '%pg_sleep(60)%' and pid <> pg_backend_pid()" > /dev/null
docker compose run --rm -T backup wiederherstellen "$stand" --ja

after=$(psql_value "$ROW_COUNTS")
[ "$after" = "$before" ] || fail "Zeilenzahlen weichen ab: vorher $before, nachher $after"
[ "$(cat fotos/haushalt/eins.jpg)" = "foto-1" ] || fail "Das gesicherte Foto ist nicht zurück"
[ ! -e fotos/haushalt/zwei.jpg ] || fail "Das spätere Foto ist noch da"

docker compose start web
wait_for_health
echo "Zeilenzahlen gleich: $after"
echo "Backup-Test bestanden"
