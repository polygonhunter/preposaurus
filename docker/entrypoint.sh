#!/bin/sh
# Ein Image, mehrere Befehle (UMSETZUNG M13-01). Compose wählt den Befehl je Dienst.
#   web      Next-Server (Standard)
#   migrate  Migrationen und Stammdaten einspielen, danach Ende
#   worker   kommt mit M11-01
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
    echo "Der Worker ist in dieser Version noch nicht enthalten (kommt mit M11-01)." >&2
    exit 64
    ;;
  *)
    exec "$@"
    ;;
esac
