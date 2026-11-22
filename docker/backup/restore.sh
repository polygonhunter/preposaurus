# Wiederherstellen (UMSETZUNG M13-03): spielt einen Stand in eine leere Datenbank zurück und
# setzt den Ordner fotos auf den Stand der Sicherung.
#   wiederherstellen <stand> [--ja]     Stand z. B. taeglich/2026-11-22 oder woechentlich/2026-W47
# Vorher muss die App gestoppt sein: docker compose stop web (später auch worker)
#   pruefen <stand>                     Probe in eine Wegwerf-Datenbank, der Betrieb läuft weiter

resolve_stand() {
  for candidate in "$BACKUP_DIR/$1" "$DAILY_DIR/$1" "$WEEKLY_DIR/$1"; do
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
  printf 'Zum Fortfahren "ja" eingeben: '
  read -r answer
  [ "$answer" = "ja" ] || fail "Abgebrochen, nichts geändert."
}

# Läuft die App noch, würde sie mitten im Einspielen schreiben.
ensure_no_connections() {
  open=$(psql --dbname=postgres -tAc \
    "select count(*) from pg_stat_activity where datname = '$PGDATABASE' and pid <> pg_backend_pid()")
  [ "$open" = "0" ] || fail "Die App ist noch verbunden. Bitte zuerst: docker compose stop web"
}

run_restore() {
  [ -n "${1:-}" ] || fail "Aufruf: wiederherstellen <stand> [--ja], Stände zeigt: liste"
  stand_dir=$(resolve_stand "$1") || fail "Den Stand $1 gibt es nicht. Stände zeigt: liste"
  confirm_restore "$1" "${2:-}"
  ensure_no_connections
  log "Stelle wieder her: $stand_dir"
  dropdb --maintenance-db=postgres --if-exists "$PGDATABASE"
  createdb --maintenance-db=postgres "$PGDATABASE"
  pg_restore --dbname="$PGDATABASE" --no-owner --exit-on-error --single-transaction \
    "$stand_dir/$DUMP_FILE"
  rsync -a --delete "$stand_dir/fotos/" "$PHOTO_DIR/"
  log "Wiederhergestellt. Jetzt die App starten: docker compose start web"
}

# Probe ohne Eingriff in den Betrieb: spielt den Stand in eine Wegwerf-Datenbank und zählt nach.
run_check() {
  [ -n "${1:-}" ] || fail "Aufruf: pruefen <stand>, Stände zeigt: liste"
  stand_dir=$(resolve_stand "$1") || fail "Den Stand $1 gibt es nicht. Stände zeigt: liste"
  probe="${PGDATABASE}_probe"
  dropdb --maintenance-db=postgres --if-exists "$probe"
  createdb --maintenance-db=postgres "$probe"
  pg_restore --dbname="$probe" --no-owner --exit-on-error --single-transaction \
    "$stand_dir/$DUMP_FILE" || {
    dropdb --maintenance-db=postgres --if-exists "$probe"
    fail "Der Stand $1 lässt sich nicht einspielen."
  }
  tables=$(psql --dbname="$probe" -tAc \
    "select count(*) from information_schema.tables where table_schema = 'public'")
  dropdb --maintenance-db=postgres "$probe"
  photos=$(find "$stand_dir/fotos" -type f | wc -l)
  log "Probe in Ordnung: $1 lässt sich einspielen ($tables Tabellen, $photos Fotodateien)."
}

list_stands() {
  for dir in "$DAILY_DIR" "$WEEKLY_DIR"; do
    [ -d "$dir" ] || continue
    ls -1 "$dir" | grep -E '^[0-9]{4}-' | sort | while IFS= read -r name; do
      echo "$(basename "$dir")/$name"
    done
  done
}
