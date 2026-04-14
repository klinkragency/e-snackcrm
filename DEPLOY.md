# Deploying the Klinkragency Dashboard

Single-VPS deploy. Docker Compose for the app + Postgres, system-level Caddy for TLS.

## Prerequisites

- Ubuntu 22.04+ VPS with a public IP
- A domain (or subdomain) pointing to that IP via an A record
- Docker Engine + Compose plugin (use `curl -fsSL https://get.docker.com | sh`)
- Caddy v2 installed via `apt` (official Cloudsmith repo)
- UFW allowing 22, 80, 443
- A Resend account with a verified sender domain

## One-shot deploy

```bash
# 1. Clone the repo
git clone https://github.com/klinkragency/e-snackcrm.git ~/dashboard
cd ~/dashboard

# 2. Populate .env
cp .env.production.example .env
# Edit .env, in particular:
#   - BETTER_AUTH_URL = https://your-domain
#   - POSTGRES_PASSWORD = `openssl rand -hex 16`
#   - BETTER_AUTH_SECRET = `openssl rand -hex 32`
#   - RESEND_API_KEY = re_xxx
#   - INITIAL_DASHBOARD_ADMIN_EMAIL = your email
nano .env

# 3. Build and start the Docker stack (postgres + migrate + app)
docker compose --profile prod up -d --build

# 4. Verify the app responds on port 3000 locally
curl -I http://127.0.0.1:3000/login

# 5. Install Caddy config (replace example.com with your domain)
export DOMAIN=admin.example.com
sudo env DOMAIN="$DOMAIN" cp Caddyfile /etc/caddy/Caddyfile
sudo sed -i "s/{\\$DOMAIN}/$DOMAIN/g" /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl restart caddy

# 6. Open the site in a browser
# Caddy fetches a Let's Encrypt cert on first request (takes ~5 seconds)
# https://admin.example.com/login
```

## Updating

```bash
cd ~/dashboard
git pull
docker compose --profile prod up -d --build
```

Migrations run automatically on startup via the `migrate` one-shot service.

## Debugging

```bash
docker compose ps
docker compose logs -f app
docker compose logs migrate       # if the stack failed to start
sudo journalctl -u caddy -n 50    # TLS issues

# psql into the app database
docker compose exec postgres psql -U esnackcrm -d esnackcrm_db
```

## Rolling back

```bash
cd ~/dashboard
git log --oneline -10
git reset --hard <commit-sha>
docker compose --profile prod up -d --build
```
