#!/usr/bin/env bash
# Packt die Dateien für eine Installation (docs/INSTALLATION.md) in ein Archiv:
#   preposaurus-<version>/compose.yaml, compose.tailscale.yaml, docker/tailscale/serve.json,
#   env.beispiel (Vorlage für .env mit eingetragener Version)
# Aufruf: docker/release/pack-install-files.sh <version> <zielordner>
set -euo pipefail
version=${1:?Version fehlt, z. B. 0.1.0}
target=${2:?Zielordner fehlt}
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]] || {
  echo "Keine gültige Versionsnummer: $version" >&2
  exit 1
}

staging=$(mktemp -d)
bundle="$staging/preposaurus-$version"
mkdir -p "$bundle/docker/tailscale"
cp compose.yaml compose.tailscale.yaml "$bundle/"
cp docker/tailscale/serve.json "$bundle/docker/tailscale/"
sed "s/^PREPOSAURUS_VERSION=.*/PREPOSAURUS_VERSION=$version/" docker/compose.env.example > "$bundle/env.beispiel"
grep -q "^PREPOSAURUS_VERSION=$version$" "$bundle/env.beispiel"

tar -czf "$target/preposaurus-$version.tar.gz" -C "$staging" "preposaurus-$version"
echo "Gepackt: $target/preposaurus-$version.tar.gz"
