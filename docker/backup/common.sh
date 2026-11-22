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
# Ergebnis des letzten Laufs ("ok …" oder "fehler …"), liest der Healthcheck
STATUS_FILE="$BACKUP_DIR/.letzter-lauf"
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

write_status() {
  echo "$1 $(date -Iseconds) $2" > "$STATUS_FILE"
}

# Nie zwei Läufe gleichzeitig: Sichern, Probe und Wiederherstellen schließen sich aus.
acquire_lock() {
  exec 9> "$LOCK_FILE"
  flock -n 9 || fail "Es läuft schon eine Sicherung, Probe oder Wiederherstellung."
}
