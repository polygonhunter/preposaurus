# Gemeinsame Helfer der Compose-Tests in der CI (UMSETZUNG M13-02, M13-03).
# Die Tests laufen in einem eigenen Ordner wie bei einer echten Installation, nicht im Repo,
# weil der Bind-Mount ./db sonst auf den Ordner db/ mit den Migrationen zeigen würde.

fail() {
  echo "FEHLER: $*" >&2
  exit 1
}

# Legt einen Installationsordner mit Compose-Dateien und .env an und wechselt hinein.
prepare_install_dir() {
  repo_dir=$1
  install_dir=$(mktemp -d)
  cp "$repo_dir/compose.yaml" "$repo_dir/compose.tailscale.yaml" "$install_dir/"
  mkdir -p "$install_dir/docker/tailscale" "$install_dir/db" "$install_dir/fotos" "$install_dir/backups"
  cp "$repo_dir/docker/tailscale/serve.json" "$install_dir/docker/tailscale/"
  # Wegwerf-Werte nur für diesen Lauf
  {
    echo "PREPOSAURUS_VERSION=${PREPOSAURUS_VERSION:-ci}"
    echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
    echo "APP_SECRET=$(openssl rand -base64 32)"
    echo "PREPOSAURUS_UID=$(id -u)"
    echo "PREPOSAURUS_GID=$(id -g)"
  } > "$install_dir/.env"
  cd "$install_dir"
}

# Zeilenzahl je Tabelle, z. B. "kategorie=10,nutzer=1,…"
# shellcheck disable=SC2034 # genutzt von den Tests, die diese Datei einbinden
ROW_COUNTS="select string_agg(table_schema || '.' || table_name || '=' || (xpath('/row/c/text()',
  query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text,
  ',' order by table_schema, table_name)
  from information_schema.tables where table_schema in ('public', 'drizzle') and table_type = 'BASE TABLE'"

wait_for_health() {
  for _ in $(seq 1 60); do
    if curl -fsS http://127.0.0.1:3000/api/health > /dev/null 2>&1; then return 0; fi
    sleep 2
  done
  docker compose logs
  fail "/api/health hat nicht geantwortet"
}

psql_value() {
  docker compose exec -T db psql -U preposaurus -d preposaurus -tAc "$1"
}
