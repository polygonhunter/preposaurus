# syntax=docker/dockerfile:1
# App-Image von Preposaurus (UMSETZUNG M13-01): ein Image, Befehle web, migrate und worker.
# Bauen aus dem Repo-Ordner: docker build -f docker/Dockerfile -t preposaurus .
# Jede Architektur (amd64, arm64) wird nativ gebaut, damit sharp die passenden Binärdateien bekommt.

ARG NODE_IMAGE=node:24.22.3-trixie-slim

FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
# Ohne Skripte: "prepare" würde lefthook installieren, das im Image keinen Sinn hat.
RUN npm ci --ignore-scripts
COPY . .
# next build für den Webserver, build:cli für migrate, seed und admin (siehe scripts/build-cli.ts)
RUN npm run build && npm run build:cli

FROM ${NODE_IMAGE} AS runtime
LABEL org.opencontainers.image.title="Preposaurus" \
      org.opencontainers.image.description="Notvorrat nach offiziellen Empfehlungen, selbst gehostet" \
      org.opencontainers.image.source="https://github.com/polygonhunter/preposaurus" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later"
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PHOTO_STORAGE_DIR=/data/fotos
# Der Code gehört root und ist für den laufenden Nutzer nur lesbar.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/dist/cli ./scripts
COPY --from=build /app/db/migrations ./db/migrations
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/preposaurus
# Schreibbar sind nur der Next-Cache und der Fotoordner (dort liegt im Betrieb ein Bind-Mount).
RUN mkdir -p .next/cache /data/fotos && chown node:node .next/cache /data/fotos
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
ENTRYPOINT ["preposaurus"]
CMD ["web"]
