# Strapi 5.63 (SQLite) image. Debian slim base: better-sqlite3 is a native module (glibc).
# Dependencies are installed INSIDE the image; node_modules is never mounted from the host.

# ---------- build: install all deps, compile TypeScript and the admin panel ----------
FROM node:24.22.3-trixie-slim AS build
# Toolchain only as a fallback in case the better-sqlite3 prebuilt binary cannot be downloaded.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/app
ENV STRAPI_TELEMETRY_DISABLED=true \
    NODE_OPTIONS=--max-old-space-size=3072
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NODE_ENV=production
RUN npm run build \
 && npm prune --omit=dev --no-audit --no-fund

# ---------- runtime ----------
FROM node:24.22.3-trixie-slim AS runtime
WORKDIR /opt/app
ENV NODE_ENV=production \
    STRAPI_TELEMETRY_DISABLED=true \
    HOST=0.0.0.0 \
    PORT=1337
COPY --from=build --chown=node:node /opt/app ./
# .tmp holds the SQLite file; it is the mount point of the named volume. Creating it here
# with node ownership makes Docker initialise an empty volume with the same ownership.
RUN mkdir -p /opt/app/.tmp /opt/app/public/uploads \
 && chown node:node /opt/app/.tmp /opt/app/public/uploads
USER node
EXPOSE 1337
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:1337/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
