# Gemeinsame Einstellungen und Helfer des Backup-Containers (UMSETZUNG M13-03).
# Die Datenbank-Verbindung kommt aus PGHOST, PGUSER, PGPASSWORD und PGDATABASE.

BACKUP_DIR=${BACKUP_DIR:-/backups}
PHOTO_DIR=${PHOTO_DIR:-/fotos}
DAILY_DIR="$BACKUP_DIR/taeglich"
WEEKLY_DIR="$BACKUP_DIR/woechentlich"
KEEP_DAILY=${KEEP_DAILY:-7}
KEEP_WEEKLY=${KEEP_WEEKLY:-4}
# ISO-Wochentag des wöchentlichen Stands, 7 = Sonntag
WEEKLY_DAY=${WEEKLY_DAY:-7}
DUMP_FILE=datenbank.dump

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') backup: $*"
}

fail() {
  log "FEHLER: $*" >&2
  exit 1
}

# Neuester täglicher Stand (Ordnername) oder leer
latest_daily() {
  [ -d "$DAILY_DIR" ] || return 0
  ls -1 "$DAILY_DIR" | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort -r | head -n 1
}
