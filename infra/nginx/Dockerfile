# Web image: compiles frontend/ with `ng build` and serves it with nginx (ADR-0003, ADR-0007 E1).
# Build context: repository root (docker-compose.yml: context ".", dockerfile infra/nginx/Dockerfile).
# Ignore rules: infra/nginx/Dockerfile.dockerignore (host node_modules never enter the image).

# ---------- build: Angular production build ----------
FROM node:24.22.3-trixie-slim AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx ng build --configuration production

# ---------- runtime: nginx ----------
FROM nginx:1.30-alpine AS runtime
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY infra/nginx/snippets/ /etc/nginx/snippets/
# @angular/build:application writes the browser bundle to dist/<project>/browser.
COPY --from=build /app/dist/car-insurance-quote/browser/ /usr/share/nginx/html/
# No `RUN nginx -t` here: the upstream host "cms" only resolves on the compose network,
# so the config is validated when the container starts.
EXPOSE 80
