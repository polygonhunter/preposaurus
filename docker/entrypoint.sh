#!/bin/sh
# Ein Image, mehrere Befehle (UMSETZUNG M13-01). Compose wählt den Befehl je Dienst.
#   web      Next-Server (Standard)
#   migrate  Migrationen und Stammdaten einspielen, danach Ende
#   worker   Warteschlange und Zeitpläne (Erinnerungen, Aufräumen), läuft dauerhaft
# Alles andere wird unverändert ausgeführt, z. B. "node scripts/admin.mjs …" oder "sh".
set -eu

case "${1:-web}" in
  web)
    exec node server.js
    ;;
  migrate)
    node scripts/migrate.mjs
    exec node scripts/seed.mjs
    ;;
  worker)
    # exec: Node bekommt SIGTERM von Compose direkt und beendet sich sauber.
    exec node scripts/worker.mjs
    ;;
  *)
    exec "$@"
    ;;
esac
