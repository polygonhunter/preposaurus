# Eine Sicherung (UMSETZUNG M13-03, technik.html „Backups“):
# - Datenbank mit pg_dump -Fc (Version 18 wie die Datenbank)
# - Fotos versioniert: Jeder Stand ist ein vollständiger Ordner. Unveränderte Dateien sind feste
#   Links auf den Vortag und kosten keinen Platz. Ein gelöschtes Foto bleibt in älteren Ständen.
# Ein Stand entsteht erst unter .laufend-… und wird erst am Ende umbenannt. Ein abgebrochener
# Lauf hinterlässt also nie einen halben Stand.

run_backup() {
  today=$(date +%F)
  work="$DAILY_DIR/.laufend-$today"
  mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"
  rm -rf "$work"
  mkdir -p "$work"
  log "Sicherung startet: taeglich/$today"

  pg_dump --format=custom --file="$work/$DUMP_FILE"

  previous=$(latest_daily)
  if [ -n "$previous" ]; then
    rsync -a --delete --link-dest="$DAILY_DIR/$previous/fotos" "$PHOTO_DIR/" "$work/fotos/"
  else
    rsync -a --delete "$PHOTO_DIR/" "$work/fotos/"
  fi

  rm -rf "${DAILY_DIR:?}/$today"
  mv "$work" "$DAILY_DIR/$today"
  keep_weekly_copy "$today"
  prune_old "$DAILY_DIR" "$KEEP_DAILY"
  prune_old "$WEEKLY_DIR" "$KEEP_WEEKLY"
  hand_over_ownership
  log "Sicherung fertig: taeglich/$today ($(du -sh "$DAILY_DIR/$today" | cut -f1))"
}

# Am Stichtag wird der Tagesstand zusätzlich als Wochenstand behalten (feste Links, kein Platz).
keep_weekly_copy() {
  [ "$(date +%u)" = "$WEEKLY_DAY" ] || return 0
  week=$(date +%G-W%V)
  rm -rf "${WEEKLY_DIR:?}/$week"
  cp -al "$DAILY_DIR/$1" "$WEEKLY_DIR/$week"
  log "Wochenstand behalten: woechentlich/$week"
}

# Die Stände sollen dem Nutzer gehören, dem auch fotos gehört, damit er sie am NAS öffnen kann.
hand_over_ownership() {
  [ -n "${BACKUP_OWNER:-}" ] || return 0
  chown -R "$BACKUP_OWNER" "$DAILY_DIR" "$WEEKLY_DIR"
}
