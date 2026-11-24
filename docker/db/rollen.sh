#!/bin/sh
# Rollen der Datenbank (#146), läuft einmal beim ersten Start des Dienstes db, wenn der Ordner
# db/<version> noch leer ist (/docker-entrypoint-initdb.d des offiziellen Images).
#   preposaurus_app     App, migrate, worker. Eigentümer der Datenbank und damit von public und
#                       allen Tabellen, die migrate und pg-boss anlegen. Kein Superuser, kein CREATEDB.
#   preposaurus_backup  Backup. Erbt die Rechte von preposaurus_app (pg_dump liest alles, dropdb und
#                       Umbenennen als Eigentümer) und hat CREATEDB für die neue Datenbank beim
#                       Wiederherstellen. Darf sie preposaurus_app übergeben (SET).
#   postgres            Superuser des Images. Ohne Passwort: Anmelden geht nur im Container über den
#                       Socket (docker compose exec db psql -U postgres), nie übers Netz.
# Die Passwörter gehen als psql-Variablen hinein, nicht in den Text des Skripts, und stehen in
# keinem Log (log_statement bleibt aus).
# Nur -e: Ohne Ausführungsrecht bindet das Image die Datei per "." ein, -u gälte dann auch dort.
set -e

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD fehlt}"
: "${POSTGRES_BACKUP_PASSWORD:?POSTGRES_BACKUP_PASSWORD fehlt in .env}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v db="$POSTGRES_DB" -v superuser="$POSTGRES_USER" \
  -v app_password="$POSTGRES_PASSWORD" -v backup_password="$POSTGRES_BACKUP_PASSWORD" <<'SQL'
create role preposaurus_app login nosuperuser nocreatedb nocreaterole noreplication
  password :'app_password';
create role preposaurus_backup login nosuperuser createdb nocreaterole noreplication
  password :'backup_password';
grant preposaurus_app to preposaurus_backup with inherit true, set true;
alter database :"db" owner to preposaurus_app;
alter role :"superuser" password null;
SQL
echo "Rollen preposaurus_app und preposaurus_backup angelegt"
