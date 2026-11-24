# syntax=docker/dockerfile:1
# Backup-Image von Preposaurus (UMSETZUNG M13-03): pg_dump und pg_restore in Version 19 aus dem
# offiziellen Image der Datenbank, dazu rsync für die versionierte Sicherung der Fotos.
# Bauen aus dem Repo-Ordner: docker build -t preposaurus-backup docker/backup
FROM postgres:19.0-trixie
LABEL org.opencontainers.image.title="Preposaurus Backup" \
      org.opencontainers.image.description="Tägliche Sicherung von Datenbank und Fotos für Preposaurus" \
      org.opencontainers.image.source="https://github.com/polygonhunter/preposaurus" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later"
RUN apt-get update \
  && apt-get install -y --no-install-recommends rsync \
  && rm -rf /var/lib/apt/lists/*
COPY common.sh rotate.sh backup.sh restore.sh /usr/local/lib/preposaurus/
COPY --chmod=755 entrypoint.sh /usr/local/bin/backup
# Krank nach einer fehlgeschlagenen Sicherung oder wenn die letzte über 26 Stunden alt ist.
HEALTHCHECK --interval=5m --timeout=10s --start-period=1m CMD ["backup", "gesund"]
ENTRYPOINT ["backup"]
CMD ["zeitplan"]
