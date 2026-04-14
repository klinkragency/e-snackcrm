import type { Client, ClientConfig } from "@/lib/db/schema"

const ESNACK_REPO = "https://github.com/klinkragency/e-snack.git"

export function buildEnvFile(client: Client, config: ClientConfig): string {
  const lines = [
    "# ═══════════════════════════════════════════════════════════════",
    `# ${client.name} — generated ${new Date().toISOString()}`,
    "# ═══════════════════════════════════════════════════════════════",
    "",
    "# Tier 1 — Infrastructure",
    `DOMAIN=${client.domain}`,
    `PUBLIC_URL=https://${client.domain}`,
    `POSTGRES_USER=esnack`,
    `POSTGRES_PASSWORD=${config.postgresPassword}`,
    `POSTGRES_DB=esnack_db`,
    `JWT_SECRET=${config.jwtSecret}`,
    `COOKIE_SECRET=${config.cookieSecret}`,
    `BACKEND_URL=http://api:8080`,
    "",
    "# Tier 2 — First-boot seed",
    `INITIAL_ADMIN_EMAIL=${config.initialAdminEmail}`,
    `INITIAL_ADMIN_PASSWORD=${config.initialAdminPassword}`,
    `INITIAL_ADMIN_NAME=${config.initialAdminName}`,
    `INITIAL_RESTAURANT_NAME=${config.initialRestaurantName}`,
    `INITIAL_RESTAURANT_SLUG=${config.initialRestaurantSlug}`,
    "",
    "# Tier 3 — Recommandés",
    `EMAIL_FROM_ADDRESS=${config.emailFromAddress}`,
    `RESEND_API_KEY=${config.resendApiKey ?? ""}`,
    `MOLLIE_API_KEY=${config.mollieApiKey ?? ""}`,
    `MINIO_ROOT_USER=minio`,
    `MINIO_ROOT_PASSWORD=${config.minioRootPassword}`,
    `MINIO_BUCKET=uploads`,
    "",
    "# Tier 4 — Features flags (frontend)",
    `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=false`,
    `NEXT_PUBLIC_APPLE_OAUTH_ENABLED=false`,
    `NEXT_PUBLIC_AI_IMPORT_ENABLED=false`,
    "",
  ]
  return lines.join("\n")
}

export function buildInitialDeployScript(client: Client, config: ClientConfig): string {
  const env = buildEnvFile(client, config)
  return `# ─── Déploiement initial de ${client.name} ───
# À exécuter sur le VPS (SSH requis)

set -euo pipefail

SLUG=${client.slug}
CLIENT_DIR=~/clients/$SLUG

mkdir -p $CLIENT_DIR
cd $CLIENT_DIR

# Clone e-Snack si pas déjà présent
if [ ! -d .git ]; then
  git clone ${ESNACK_REPO} .
fi

# Écrit le .env
cat > .env << 'EOF'
${env}EOF

# Build et démarre
docker compose up -d --build

# Vérifie
docker compose ps
echo "✅ Instance déployée sur https://${client.domain}"
`
}

export function buildUpdateScript(client: Client): string {
  return `# ─── Mise à jour de ${client.name} ───
# Pull la dernière version du template e-Snack et relance les containers.

cd ~/clients/${client.slug}
git fetch --all
git pull origin main

# Rebuild et redémarre (zero downtime en théorie si Caddy route déjà)
docker compose up -d --build

# Vérifie
docker compose ps
docker compose logs --tail=30 api | grep -i "migration\\|✅\\|seed"
`
}

export function buildDebugScript(client: Client): string {
  return `# ─── Debug de ${client.name} ───

cd ~/clients/${client.slug}

# Statut des containers
docker compose ps

# Logs live (API)
docker compose logs -f api

# Logs live (frontend)
docker compose logs -f frontend

# Logs live (migrations — si bloqué au boot)
docker compose logs migrate

# Accès psql à la base
docker compose exec postgres psql -U esnack -d esnack_db

# Santé HTTP
curl -I https://${client.domain}/api/v1/health || echo "endpoint /health absent — testez /"

# Inspection volumes
docker volume ls | grep ${client.slug}
`
}

export function buildRollbackScript(client: Client): string {
  return `# ─── Rollback de ${client.name} ───
# À lancer si un déploiement récent a cassé quelque chose.

cd ~/clients/${client.slug}

# Liste les derniers commits du template
git log --oneline -10

# ⚠ Remplace <commit-sha> par le SHA sur lequel tu veux revenir
COMMIT_SHA=<commit-sha>
git reset --hard $COMMIT_SHA

# Rebuild et relance
docker compose up -d --build

# Vérifie
docker compose ps
`
}

export function buildUninstallScript(client: Client): string {
  return `# ─── Suppression complète de ${client.name} ───
# ⚠ DANGER : supprime les containers, volumes et données. Non réversible.

cd ~/clients/${client.slug}

# Arrêt + suppression containers ET volumes (données DB, images, uploads)
docker compose down -v

# Supprime le dossier
cd ..
rm -rf ${client.slug}

echo "✅ Instance ${client.slug} supprimée. Retire le DNS de ${client.domain} si besoin."
`
}
