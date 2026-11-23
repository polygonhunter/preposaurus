# Gemeinsame Einstellungen und Helfer des Backup-Containers (UMSETZUNG M13-03).
# Die Datenbank-Verbindung kommt aus PGHOST, PGUSER, PGPASSWORD und PGDATABASE.
#
# Arten von Ständen, je ein Ordner unter /backups. Jeder Stand heißt nach seinem Zeitpunkt
# (2026-11-22_030000), mehrere am selben Tag überschreiben sich also nie.
#   taeglich               Zeitplan, die neuesten KEEP_DAILY bleiben
#   woechentlich           Kopie des Tagesstands am WEEKLY_DAY (2026-W47), KEEP_WEEKLY bleiben
#   manuell                "jetzt", die neuesten KEEP_MANUAL bleiben
#   vor-update             "jetzt vor-update", wird nie automatisch gelöscht
#   vor-wiederherstellung  automatisch vor "wiederherstellen", KEEP_BEFORE_RESTORE bleiben

BACKUP_DIR=${BACKUP_DIR:-/backups}
PHOTO_DIR=${PHOTO_DIR:-/fotos}
STAND_KINDS="taeglich woechentlich manuell vor-update vor-wiederherstellung"
KEEP_DAILY=${KEEP_DAILY:-7}
KEEP_WEEKLY=${KEEP_WEEKLY:-4}
KEEP_MANUAL=${KEEP_MANUAL:-5}
KEEP_BEFORE_RESTORE=${KEEP_BEFORE_RESTORE:-5}
# ISO-Wochentag des wöchentlichen Stands, 7 = Sonntag
WEEKLY_DAY=${WEEKLY_DAY:-7}
DUMP_FILE=datenbank.dump
# Status für Healthcheck und App (#147), eigener Ordner, den der Container web nur lesend sieht.
# Die Dateien enthalten nur Zeitpunkt und Art, deshalb lesbar für alle (644), anders als die Stände.
#   letzter-lauf      Ergebnis des letzten Laufs: "ok <zeit> <art>/<stand>" oder "fehler <zeit> <art>"
#   letzte-sicherung  nur nach Erfolg: "<zeit> <art>/<stand>"
STATUS_DIR="$BACKUP_DIR/status"
STATUS_FILE="$STATUS_DIR/letzter-lauf"
LAST_BACKUP_FILE="$STATUS_DIR/letzte-sicherung"
LOCK_FILE="$BACKUP_DIR/.sperre"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') backup: $*"
}

fail() {
  log "FEHLER: $*" >&2
  exit 1
}

new_stand_name() {
  date +%Y-%m-%d_%H%M%S
}

# Neuester Stand (Ordnername) in einem Ordner oder leer
newest_in() {
  [ -d "$1" ] || return 0
  ls -1 "$1" | grep -E '^[0-9]{4}-' | sort -r | head -n 1
}

# Schreibt erst in eine neue Datei und ersetzt dann, damit die App nie eine halbe Zeile liest.
write_status_line() {
  printf '%s\n' "$2" > "$1.neu"
  chmod 644 "$1.neu"
  [ -z "${BACKUP_OWNER:-}" ] || chown "$BACKUP_OWNER" "$1.neu"
  mv "$1.neu" "$1"
}

write_status() {
  mkdir -p "$STATUS_DIR"
  chmod 755 "$STATUS_DIR"
  [ -z "${BACKUP_OWNER:-}" ] || chown "$BACKUP_OWNER" "$STATUS_DIR"
  now=$(date -Iseconds)
  write_status_line "$STATUS_FILE" "$1 $now $2"
  [ "$1" != ok ] || write_status_line "$LAST_BACKUP_FILE" "$now $2"
  # Bis Version 0.1 lag der Status in backups/.letzter-lauf
  rm -f "$BACKUP_DIR/.letzter-lauf"
}

# Nie zwei Läufe gleichzeitig: Sichern, Probe und Wiederherstellen schließen sich aus.
acquire_lock() {
  exec 9> "$LOCK_FILE"
  flock -n 9 || fail "Es läuft schon eine Sicherung, Probe oder Wiederherstellung."
}
