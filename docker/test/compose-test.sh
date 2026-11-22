#!/usr/bin/env bash
# CI-Rauchtest für compose.yaml (UMSETZUNG M13-02): db → migrate → web bis /api/health,
# Port nur an 127.0.0.1, web ohne root, Notfall-Befehl im Image.
# Aufruf aus dem Repo-Ordner, das Image ghcr.io/polygonhunter/preposaurus:ci muss gebaut sein.
set -euo pipefail
repo_dir=$(pwd)
# shellcheck source=docker/test/lib.sh
. "$repo_dir/docker/test/lib.sh"
prepare_install_dir "$repo_dir"
trap 'docker compose down --volumes > /dev/null 2>&1 || true' EXIT

# Dependabot löst keine ARG-Variablen in FROM auf. Beide Stufen nutzen dasselbe Basis-Image.
grep -q '^FROM \$' "$repo_dir/docker/Dockerfile" && fail "Basis-Image im Dockerfile über eine Variable"
[ "$(grep -Eo '^FROM node:[^ ]+' "$repo_dir/docker/Dockerfile" | sort -u | wc -l)" = "1" ] ||
  fail "Die Stufen im Dockerfile nutzen verschiedene Node-Images"

docker compose config --quiet
docker compose -f compose.yaml -f compose.tailscale.yaml config --quiet 2> /dev/null &&
  fail "Die Tailscale-Überlagerung muss ohne TS_HOSTNAME abbrechen"
TS_HOSTNAME=test docker compose -f compose.yaml -f compose.tailscale.yaml config > tailscale.yaml
grep -q 'network_mode: service:tailscale' tailscale.yaml || fail "web hängt nicht am Sidecar"
grep -q 'HOSTNAME: 127.0.0.1' tailscale.yaml || fail "web lauscht hinter dem Sidecar nicht nur auf 127.0.0.1"
grep -q 'published:' tailscale.yaml && fail "Mit Sidecar darf kein Port auf dem NAS offen sein"

docker compose config > merged.yaml
[ "$(grep -c 'no-new-privileges:true' merged.yaml)" -ge 4 ] || fail "no-new-privileges fehlt bei Diensten"
[ "$(docker compose config --format json | jq -r '.services.web.cap_drop[0]')" = "ALL" ] ||
  fail "web behält Capabilities"

docker compose up -d
wait_for_health
echo "/api/health: $(curl -fsS http://127.0.0.1:3000/api/health)"

[ "$(docker compose ps -a --format '{{.ExitCode}}' migrate)" = "0" ] || fail "migrate ist nicht sauber beendet"
[ "$(docker compose port web 3000)" = "127.0.0.1:3000" ] || fail "Port 3000 hängt nicht nur an 127.0.0.1"
[ "$(docker compose exec -T web id -u)" != "0" ] || fail "web läuft als root"
# Die CI startet web unter der Nutzer-ID des Runners (nicht 1000), wie ein NAS mit eigener ID.
docker compose exec -T web sh -c 'touch .next/cache/probe && rm .next/cache/probe' ||
  fail ".next/cache ist für PREPOSAURUS_UID nicht schreibbar"
docker compose exec -T web grep -q ' /app/.next/cache tmpfs ' /proc/mounts || fail ".next/cache ist kein tmpfs"
[ "$(docker compose exec -T web stat -c '%a %u' .next/cache)" = "700 $(id -u)" ] ||
  fail ".next/cache gehört nicht allein PREPOSAURUS_UID"
[ "$(docker run --rm --entrypoint stat ghcr.io/polygonhunter/preposaurus:ci -c %a .next/cache)" = "755" ] ||
  fail ".next/cache ist im Image für andere schreibbar"
[ "$(psql_value 'select count(*) from kategorie')" -gt 0 ] || fail "Stammdaten fehlen"

if docker compose exec -T web node scripts/admin.mjs passwort-zuruecksetzen niemand; then
  fail "Der Notfall-Befehl muss bei einem unbekannten Namen scheitern"
fi
psql_value "insert into nutzer (id, name, benutzername, email)
  values ('00000000-0000-4000-8000-000000000001', 'Admin', 'admin', 'admin@nutzer.invalid')" > /dev/null
psql_value "insert into anmelde_sperre (id, schluessel, fehlversuche)
  values (gen_random_uuid(), 'global', 100), (gen_random_uuid(), 'ip:100.64.0.1', 20)" > /dev/null
docker compose exec -T web node scripts/admin.mjs passwort-zuruecksetzen admin | tee reset.log
grep -q 'Neues vorläufiges Passwort' reset.log || fail "Kein neues Passwort ausgegeben"
[ "$(psql_value 'select count(*) from anmelde_sperre')" = "0" ] || fail "Sperren sind nicht aufgehoben"
[ "$(psql_value "select count(*) from konto where provider_id = 'credential' and password is not null")" = "1" ] ||
  fail "Kein Passwort-Hash gespeichert"
docker compose logs web > web.log
grep -q 'Passwort per Kommandozeile zurückgesetzt' web.log || fail "Die Spur fehlt im Log von web"

echo "Compose-Test bestanden"
