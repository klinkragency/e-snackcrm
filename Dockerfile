# ─── Builder stage ────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Prune devDependencies after the build
RUN npm prune --omit=dev

# ─── Runtime stage ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install runtime tools the app shells out to:
# - git: clone e-snack template for per-client instances
# - docker CLI + compose plugin: orchestrate client stacks on the host's Docker daemon
RUN apk add --no-cache git curl ca-certificates && \
    curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-28.5.0.tgz | tar xz -C /tmp && \
    mv /tmp/docker/docker /usr/local/bin/ && \
    rm -rf /tmp/docker && \
    mkdir -p /usr/local/libexec/docker/cli-plugins && \
    curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
      -o /usr/local/libexec/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/libexec/docker/cli-plugins/docker-compose && \
    docker --version && docker compose version

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/drizzle ./drizzle

# Runs as root so it can read /var/run/docker.sock mounted from the host
# (socket is root:docker on the host, no way to match GIDs reliably across
# hosts). The container already has Docker API access which is effectively
# root equivalent — running as root inside doesn't lower the security bar.
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
