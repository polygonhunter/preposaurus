# Eine Sicherung (UMSETZUNG M13-03, technik.html „Backups“):
# - Datenbank mit pg_dump -Fc (Version 19 wie die Datenbank)
# - Fotos versioniert: Jeder Stand ist ein vollständiger Ordner. Unveränderte Dateien sind feste
#   Links auf den jeweils neuesten Stand jeder Art und kosten keinen Platz. Ein gelöschtes Foto
#   bleibt in älteren Ständen.
# Dump und Fotos entstehen nacheinander, nicht im selben Augenblick. Ein Foto, das genau dazwischen
# gelöscht wird, fehlt im Stand. Nachts ist das vertretbar.
# Ein Stand entsteht unter .laufend-… und wird erst am Ende umbenannt. Reste abgebrochener Läufe
# räumt der nächste Lauf weg. Nach dem Lauf steht der Name in LAST_STAND.
#   run_backup <art>   Stand anlegen, alte Stände rotieren, Status schreiben

run_backup() {
  create_stand "$1"
  apply_retention
  finish_backup
}

# Legt den Stand an, ohne alte Stände zu löschen. Das Sicherheitsnetz beim Wiederherstellen
# rotiert erst nach dem Zurückspielen, sonst könnte es genau den gewählten Stand löschen.
create_stand() {
  kind=$1
  kind_dir="$BACKUP_DIR/$kind"
  name=$(new_stand_name)
  work="$kind_dir/.laufend-$name"
  remove_unfinished
  mkdir -p "$work"
  log "Sicherung startet: $kind/$name"

  pg_dump --format=custom --file="$work/$DUMP_FILE"
  # shellcheck disable=SC2046 # die Optionen sollen einzeln ankommen, Pfade ohne Leerzeichen
  rsync -a --delete $(link_dest_options) "$PHOTO_DIR/" "$work/fotos/"

  mv "$work" "$kind_dir/$name"
  LAST_STAND="$kind/$name"
  [ "$kind" != taeglich ] || keep_weekly_copy "$kind_dir/$name"
}

finish_backup() {
  hand_over_ownership
  write_status ok "$LAST_STAND"
  log "Sicherung fertig: $LAST_STAND ($(du -sh "$BACKUP_DIR/$LAST_STAND" | cut -f1))"
}

remove_unfinished() {
  find "$BACKUP_DIR" -mindepth 2 -maxdepth 2 -name '.laufend-*' -exec rm -rf {} +
}

link_dest_options() {
  for link_kind in $STAND_KINDS; do
    newest=$(newest_in "$BACKUP_DIR/$link_kind")
    [ -z "$newest" ] || printf -- '--link-dest=%s ' "$BACKUP_DIR/$link_kind/$newest/fotos"
  done
}

# Am Stichtag wird der Tagesstand zusätzlich als Wochenstand behalten (feste Links, kein Platz).
keep_weekly_copy() {
  [ "$(date +%u)" = "$WEEKLY_DAY" ] || return 0
  week=$(date +%G-W%V)
  mkdir -p "$BACKUP_DIR/woechentlich"
  rm -rf "$BACKUP_DIR/woechentlich/$week"
  cp -al "$1" "$BACKUP_DIR/woechentlich/$week"
  log "Wochenstand behalten: woechentlich/$week"
}

# vor-update fehlt hier mit Absicht: Diese Stände löscht nur der Mensch.
apply_retention() {
  prune_old "$BACKUP_DIR/taeglich" "$KEEP_DAILY"
  prune_old "$BACKUP_DIR/woechentlich" "$KEEP_WEEKLY"
  prune_old "$BACKUP_DIR/manuell" "$KEEP_MANUAL"
  prune_old "$BACKUP_DIR/vor-wiederherstellung" "$KEEP_BEFORE_RESTORE"
}

# Die Stände sollen dem Nutzer gehören, dem auch fotos gehört, damit er sie am NAS öffnen kann.
hand_over_ownership() {
  [ -n "${BACKUP_OWNER:-}" ] || return 0
  for owned_kind in $STAND_KINDS; do
    [ ! -d "$BACKUP_DIR/$owned_kind" ] || chown -R "$BACKUP_OWNER" "$BACKUP_DIR/$owned_kind"
  done
}

# Für den Healthcheck: krank nach einem Fehlschlag oder wenn die letzte Sicherung über 26 Stunden
# alt ist. Ohne bisherigen Lauf (frisch eingerichtet) gilt der Container als gesund.
check_health() {
  [ -f "$STATUS_FILE" ] || return 0
  if [ "$(cut -d ' ' -f 1 "$STATUS_FILE")" != ok ]; then
    cat "$STATUS_FILE"
    return 1
  fi
  if [ -n "$(find "$STATUS_FILE" -mmin +1560)" ]; then
    echo "Die letzte Sicherung ist älter als 26 Stunden: $(cat "$STATUS_FILE")"
    return 1
  fi
}
