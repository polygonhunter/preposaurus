# Wiederherstellen (UMSETZUNG M13-03): spielt einen Stand zurück und setzt den Ordner fotos auf
# den Stand der Sicherung. Vorher muss die App gestoppt sein (docker compose stop web worker).
#   wiederherstellen <stand> [--ja]     Stand z. B. manuell/2026-11-22_010000
#   pruefen <stand>                     Probe in eine Wegwerf-Datenbank, der Betrieb läuft weiter
# Sicherheitsnetz: Zuerst entsteht ein Stand vor-wiederherstellung/… des aktuellen Zustands. Der
# Stand wird in eine neue Datenbank eingespielt, erst danach ersetzt sie die alte (über <db>_alt,
# gelöscht erst nach den Fotos).
# Scheitert das Einspielen, bleibt alles, wie es war. Alte Stände rotieren erst ganz am Ende, damit
# das Sicherheitsnetz nicht den gewählten Stand löscht (z. B. den ältesten unter vor-wiederherstellung).

resolve_stand() {
  for candidate in "$BACKUP_DIR/$1" $(for kind in $STAND_KINDS; do echo "$BACKUP_DIR/$kind/$1"; done); do
    if [ -f "$candidate/$DUMP_FILE" ]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

confirm_restore() {
  [ "${2:-}" = "--ja" ] && return 0
  [ -t 0 ] || fail "Ohne Terminal bitte --ja anhängen."
  echo "Die Datenbank \"$PGDATABASE\" und der Ordner fotos werden durch den Stand $1 ersetzt."
  echo "Der jetzige Zustand wird vorher unter vor-wiederherstellung/ gesichert."
  printf 'Zum Fortfahren "ja" eingeben: '
  read -r answer
  [ "$answer" = "ja" ] || fail "Abgebrochen, nichts geändert."
}

# Nach "docker compose stop web worker" schließen App-Pool und pg-boss ihre Verbindungen nicht immer
# sofort (#247). So lange wird darauf gewartet, bevor das Zurückspielen abbricht.
CONNECTION_WAIT_SECONDS=10

# Verbindungen anderer Prozesse zur Betriebs-DB als "name (anzahl), …", leer, wenn keine offen ist.
# Die App meldet sich als preposaurus-web bzw. preposaurus-worker und pgboss:preposaurus-worker (#261).
# Der Name der Datenbank geht als psql-Variable hinein, nicht in den SQL-Text.
open_connections() {
  psql --dbname=postgres -tA -v ON_ERROR_STOP=1 -v db="$PGDATABASE" <<'SQL'
select coalesce(string_agg(name || ' (' || connections || ')', ', ' order by name), '')
from (
  select coalesce(nullif(application_name, ''), 'ohne Namen') as name, count(*) as connections
  from pg_stat_activity
  where datname = :'db' and pid <> pg_backend_pid()
  group by 1
) as apps
SQL
}

# Läuft die App noch, würde sie mitten im Einspielen schreiben.
ensure_no_connections() {
  waited=0
  remaining=$(open_connections)
  while [ -n "$remaining" ] && [ "$waited" -lt "$CONNECTION_WAIT_SECONDS" ]; do
    [ "$waited" -gt 0 ] || log "Warte bis zu $CONNECTION_WAIT_SECONDS s, bis sich die Verbindungen schließen: $remaining"
    sleep 1
    waited=$((waited + 1))
    remaining=$(open_connections)
  done
  [ -z "$remaining" ] ||
    fail "Die App ist noch verbunden: $remaining. Bitte zuerst: docker compose stop web worker"
}

# Spielt einen Dump in eine frische Datenbank. Scheitert es, ist die Datenbank wieder weg.
# Ohne Eigentümer und Rechte aus dem Dump: Ein Stand aus einer anderen Installation (z. B. vor dem
# Umzug auf eine neue PostgreSQL-Version, #250) kennt andere Rollen.
restore_into() {
  dropdb --maintenance-db=postgres --if-exists "$1"
  createdb --maintenance-db=postgres "$1"
  if ! pg_restore --dbname="$1" --no-owner --no-privileges --exit-on-error --single-transaction "$2"; then
    dropdb --maintenance-db=postgres --if-exists "$1"
    return 1
  fi
}

# Beide Umbenennungen in einer Transaktion: Bei einem Abbruch gibt es die Betriebs-DB immer, nur
# eine Kopie unter <db>_alt kann übrig bleiben. Die räumt der nächste Lauf vorher weg.
swap_in_new_database() {
  dropdb --maintenance-db=postgres --if-exists "${PGDATABASE}_alt"
  psql --dbname=postgres -v ON_ERROR_STOP=1 --single-transaction \
    -c "alter database \"$PGDATABASE\" rename to \"${PGDATABASE}_alt\"" \
    -c "alter database \"${PGDATABASE}_neu\" rename to \"$PGDATABASE\"" > /dev/null
}

# Nur Aufräumen nach den Fotos: Scheitert es, ist der Stand trotzdem zurück, und die nächste
# Wiederherstellung räumt <db>_alt weg (die tägliche Sicherung nicht). Deshalb kein Abbruch über set -e.
drop_old_database() {
  dropdb --maintenance-db=postgres "${PGDATABASE}_alt" ||
    log "Hinweis: Die alte Datenbank ${PGDATABASE}_alt ist noch da. Die nächste Wiederherstellung räumt sie weg."
}

# Die Datenbank ist hier schon getauscht. Scheitert der Abgleich (Platte voll, Strg+C), nennt die
# Meldung den Weg zurück, auch wenn set -e das Skript beendet.
restore_photos() {
  photos_hint="Die Fotos sind nur zum Teil zurückgespielt, die Datenbank schon. Erneut zurückspielen:"
  photos_hint="$photos_hint wiederherstellen $1. Der Zustand davor liegt unter $3."
  trap 'log "FEHLER: $photos_hint" >&2' EXIT
  trap 'exit 1' INT TERM
  rsync -a --delete "$2/fotos/" "$PHOTO_DIR/"
  trap - EXIT INT TERM
}

run_restore() {
  [ -n "${1:-}" ] || fail "Aufruf: wiederherstellen <stand> [--ja], Stände zeigt: liste"
  stand_dir=$(resolve_stand "$1") || fail "Den Stand $1 gibt es nicht. Stände zeigt: liste"
  confirm_restore "$1" "${2:-}"
  ensure_no_connections
  log "Sichere zuerst den jetzigen Zustand"
  create_stand vor-wiederherstellung
  finish_backup
  safety_stand=$LAST_STAND
  log "Spiele $1 in eine neue Datenbank ein"
  restore_into "${PGDATABASE}_neu" "$stand_dir/$DUMP_FILE" ||
    fail "Der Stand $1 lässt sich nicht einspielen. Nichts geändert."
  ensure_no_connections
  swap_in_new_database
  restore_photos "$1" "$stand_dir" "$safety_stand"
  drop_old_database
  apply_retention
  log "Wiederhergestellt. Der Zustand davor liegt unter $safety_stand."
  log "Jetzt die App starten (spielt auch neuere Migrationen ein): docker compose up -d"
}

run_check() {
  [ -n "${1:-}" ] || fail "Aufruf: pruefen <stand>, Stände zeigt: liste"
  stand_dir=$(resolve_stand "$1") || fail "Den Stand $1 gibt es nicht. Stände zeigt: liste"
  probe="${PGDATABASE}_probe"
  restore_into "$probe" "$stand_dir/$DUMP_FILE" || fail "Der Stand $1 lässt sich nicht einspielen."
  tables=$(psql --dbname="$probe" -tAc \
    "select count(*) from information_schema.tables where table_schema = 'public'")
  dropdb --maintenance-db=postgres "$probe"
  photos=$(find "$stand_dir/fotos" -type f | wc -l)
  log "Probe in Ordnung: $1 lässt sich einspielen ($tables Tabellen, $photos Fotodateien)."
}

list_stands() {
  for kind in $STAND_KINDS; do
    [ -d "$BACKUP_DIR/$kind" ] || continue
    ls -1 "$BACKUP_DIR/$kind" | grep -E '^[0-9]{4}-' | sort | while IFS= read -r name; do
      echo "$kind/$name"
    done
  done
}
