#!/usr/bin/env bash
# CI-Test für den Umzug auf eine neue PostgreSQL-Hauptversion (#250), Schritt für Schritt wie in
# docs/INSTALLATION.md §12.1: Eine alte Installation (PostgreSQL 18, Ordner db/18) sichert mit
# pg_dump 18 nach vor-update/…. Der Ordner db wandert nach db-pg18, die neue Version startet eine
# frische Datenbank (db/19), der Backup-Dienst spielt den Stand zurück, die Zeilenzahlen sind gleich.
# Die alte Installation entspricht compose.yaml vor #146: Superuser preposaurus, Backup-Image auf
# postgres:18. Die neue nutzt die Rollen preposaurus_app und preposaurus_backup (#146).
# Aufruf aus dem Repo-Ordner, beide Images (…:ci) müssen gebaut sein.
set -euo pipefail
repo_dir=$(pwd)
# shellcheck source=docker/test/lib.sh
. "$repo_dir/docker/test/lib.sh"

OLD_MAJOR=18
OLD_POSTGRES_IMAGE=postgres:18.7-trixie
OLD_BACKUP_IMAGE=preposaurus-backup:pg$OLD_MAJOR
OLD_DB=preposaurus-alt-db
OLD_NETWORK=preposaurus-alt
NEW_MAJOR=$(grep -Eo '^FROM postgres:[0-9]+' "$repo_dir/docker/backup/Dockerfile" | grep -Eo '[0-9]+$')
[ "$NEW_MAJOR" -gt "$OLD_MAJOR" ] || fail "Das Backup-Image ist nicht neuer als PostgreSQL $OLD_MAJOR"

prepare_install_dir "$repo_dir"
cleanup() {
  docker rm -f "$OLD_DB" > /dev/null 2>&1 || true
  docker network rm "$OLD_NETWORK" > /dev/null 2>&1 || true
  docker compose down --volumes > /dev/null 2>&1 || true
}
trap cleanup EXIT
old_password=$(openssl rand -hex 24)

old_psql() {
  docker exec "$OLD_DB" psql -U preposaurus -d preposaurus -tAc "$1"
}

# Das alte Backup-Image: dieselben Skripte, nur mit pg_dump der alten Hauptversion.
sed "s|^FROM postgres:.*|FROM $OLD_POSTGRES_IMAGE|" "$repo_dir/docker/backup/Dockerfile" |
  docker build -q -t "$OLD_BACKUP_IMAGE" -f - "$repo_dir/docker/backup" > /dev/null

# Alte Installation: Datenbank im Ordner db wie bisher, Migrationen und Stammdaten der App.
docker network create "$OLD_NETWORK" > /dev/null
docker run -d --name "$OLD_DB" --network "$OLD_NETWORK" -v "$PWD/db:/var/lib/postgresql" \
  -e POSTGRES_USER=preposaurus -e POSTGRES_PASSWORD="$old_password" -e POSTGRES_DB=preposaurus \
  "$OLD_POSTGRES_IMAGE" > /dev/null
# Über TCP, weil die Datenbank beim ersten Start kurz nur über den Socket erreichbar ist.
for _ in $(seq 1 30); do
  if docker exec "$OLD_DB" pg_isready -q -h 127.0.0.1 -U preposaurus; then break; fi
  sleep 2
done
old_url="postgres://preposaurus:$old_password@$OLD_DB:5432/preposaurus"
docker run --rm --network "$OLD_NETWORK" -e NODE_ENV=production -e DATABASE_URL="$old_url" \
  -e APP_SECRET="$(openssl rand -base64 32)" ghcr.io/polygonhunter/preposaurus:ci migrate
old_psql "insert into nutzer (id, name, benutzername, email)
  values ('00000000-0000-4000-8000-000000000001', 'Alt', 'alt', 'alt@nutzer.invalid')" > /dev/null
mkdir -p fotos/haushalt
echo "foto-alt" > fotos/haushalt/alt.jpg
before=$(old_psql "$ROW_COUNTS")
[ -d "db/$OLD_MAJOR/docker" ] || fail "Die alte Datenbank liegt nicht unter db/$OLD_MAJOR"

# Schritt 1 der Anleitung: mit der alten Version vor dem Update sichern.
docker run --rm --network "$OLD_NETWORK" -v "$PWD/backups:/backups" -v "$PWD/fotos:/fotos" \
  -e PGHOST="$OLD_DB" -e PGUSER=preposaurus -e PGPASSWORD="$old_password" -e PGDATABASE=preposaurus \
  -e BACKUP_OWNER="$(id -u):$(id -g)" "$OLD_BACKUP_IMAGE" jetzt vor-update
stand=$(find backups/vor-update -mindepth 1 -maxdepth 1 -type d -name '20*' -printf 'vor-update/%f\n')
[ -n "$stand" ] || fail "Kein Stand vor-update aus der alten Version"
docker rm -f "$OLD_DB" > /dev/null

# Ohne Schritt 2 startet die neue Datenbank nicht, mit der Meldung aus der Fehlersuche (§14).
docker compose up -d --wait --wait-timeout 30 db > /dev/null 2>&1 &&
  fail "Die neue Datenbank darf neben Daten von $OLD_MAJOR nicht starten"
docker compose logs db | grep -q "there appears to be PostgreSQL data in" ||
  fail "Die Meldung zu den alten Daten fehlt im Log von db"
docker compose down > /dev/null 2>&1

# Schritt 2: Der alte Ordner db wandert beiseite.
mv db "db-pg$OLD_MAJOR"
mkdir db
# Schritte 3 und 4: neue Version, nur die Datenbank starten.
if ! docker compose up -d --wait db; then
  docker compose logs db
  fail "Die neue Datenbank startet nicht"
fi
[ -d "db/$NEW_MAJOR/docker" ] || fail "Die neue Datenbank liegt nicht unter db/$NEW_MAJOR"
[ -d "db-pg$OLD_MAJOR/$OLD_MAJOR/docker" ] || fail "Der alte Ordner db-pg$OLD_MAJOR ist nicht mehr da"
[ "$(psql_value 'show server_version_num')" -ge "${NEW_MAJOR}0000" ] ||
  fail "Die Datenbank läuft nicht mit PostgreSQL $NEW_MAJOR"
docker compose run --rm -T --entrypoint pg_restore backup -l "/backups/$stand/datenbank.dump" |
  grep -q "Dumped by pg_dump version: $OLD_MAJOR\." || fail "Der Stand stammt nicht von pg_dump $OLD_MAJOR"

# Schritt 5: zurückspielen, Schritt 6: alles starten (migrate läuft dabei noch einmal).
docker compose run --rm -T backup wiederherstellen "$stand" --ja | tee upgrade.log
grep -q 'Wiederhergestellt' upgrade.log || fail "Der Stand der alten Version ließ sich nicht einspielen"
docker compose up -d
wait_for_health
after=$(psql_value "$ROW_COUNTS")
[ "$after" = "$before" ] || fail "Zeilenzahlen weichen ab: vorher $before, nachher $after"
# Die alte Installation hatte nur den Superuser preposaurus, die neue gehört preposaurus_app (#146).
foreign=$(psql_value "$FOREIGN_OWNED")
[ -z "$foreign" ] || fail "Nach dem Umzug gehören Objekte nicht preposaurus_app: $foreign"
[ "$(psql_value "select name from nutzer where benutzername = 'alt'")" = "Alt" ] ||
  fail "Der Nutzer aus der alten Version fehlt"
[ "$(cat fotos/haushalt/alt.jpg)" = "foto-alt" ] || fail "Das Foto aus der alten Version fehlt"

echo "Zeilenzahlen gleich: $after"
echo "Umzug von PostgreSQL $OLD_MAJOR auf $NEW_MAJOR bestanden"
