#!/bin/sh
# Backup-Container von Preposaurus (UMSETZUNG M13-03). Befehle:
#   zeitplan                     täglich um BACKUP_TIME sichern (Standard im Compose-Dienst)
#   jetzt                        sofort einmal sichern
#   liste                        vorhandene Stände zeigen
#   pruefen <stand>              Stand probeweise in eine Wegwerf-Datenbank einspielen
#   wiederherstellen <stand>     Stand zurückspielen (vorher die App stoppen)
set -eu
LIB=/usr/local/lib/preposaurus
. "$LIB/common.sh"
. "$LIB/rotate.sh"
. "$LIB/backup.sh"
. "$LIB/restore.sh"

BACKUP_TIME=${BACKUP_TIME:-03:00}

seconds_until_next_run() {
  now=$(date +%s)
  next=$(date -d "today $BACKUP_TIME" +%s)
  [ "$next" -gt "$now" ] || next=$(date -d "tomorrow $BACKUP_TIME" +%s)
  echo $((next - now))
}

run_schedule() {
  echo "$BACKUP_TIME" | grep -Eq '^([01][0-9]|2[0-3]):[0-5][0-9]$' ||
    fail "BACKUP_TIME muss eine Uhrzeit wie 03:00 sein, nicht \"$BACKUP_TIME\"."
  # docker stop schickt TERM. Ohne trap würde sleep bis zum harten Abbruch weiterlaufen.
  trap 'exit 0' TERM INT
  while true; do
    wait_seconds=$(seconds_until_next_run)
    log "Nächste Sicherung um $BACKUP_TIME (in $((wait_seconds / 60)) Minuten)"
    sleep "$wait_seconds" &
    wait $!
    # Eigener Prozess, damit set -e dort greift. Ein Fehlschlag beendet den Zeitplan nicht,
    # der nächste Tag versucht es wieder.
    "$0" jetzt || log "FEHLER: Sicherung fehlgeschlagen, siehe Meldungen oben"
  done
}

command=${1:-zeitplan}
[ $# -gt 0 ] && shift
case "$command" in
  zeitplan) run_schedule ;;
  jetzt) run_backup ;;
  liste) list_stands ;;
  pruefen) run_check "$@" ;;
  wiederherstellen) run_restore "$@" ;;
  *) exec "$command" "$@" ;;
esac
