# Klinkragency Dashboard — Design Spec

**Date:** 2026-04-13
**Scope:** Chunk 2 from master brainstorm — internal control plane to manage e-Snack client instances
**Target:** Local development only for now; production deploy deferred

## Context

Klinkragency resells the e-Snack food-ordering template as a turnkey service to restaurateurs. Each client gets their own isolated e-Snack instance deployed on a VPS. This dashboard is the internal cockpit for the Klinkragency team (1-5 admins) to manage clients, store their deployment config, and generate the commands needed to provision / update / debug their instances.

Future chunks deferred:
- Chunk 3: automated SSH/k8s deployment from the dashboard
- Chunk 4: plugin marketplace for client instances

## Architectural decisions

| Decision | Value |
|----------|-------|
| Repo | `/Users/moneyprinter/Documents/bara/dashboard/` (local, no remote yet) |
| Framework | Next.js 16 (App Router, React 19, TypeScript strict) |
| Styling | Tailwind v4 + Radix UI + lucide-react + sonner |
| Database | PostgreSQL 16 (dedicated container for dashboard, not shared with e-Snack clients) |
| ORM | Drizzle ORM + drizzle-kit (migrations via SQL files) |
| Auth | Better Auth with magic link plugin, `disableSignUp: true` |
| Email | Resend in prod; console.log fallback in dev when `RESEND_API_KEY` is empty |
| Deployment | Local only for v1 — `docker compose up` starts Postgres + Next.js dev server |
| Scope level | B from brainstorm — CRM + deployment helper (no SSH automation) |

## Data model

### Better Auth auto-managed tables (generated via `npx auth@latest generate`)

- `user` — admin users (Klinkragency team)
- `session` — signed Better Auth sessions, cookie-based
- `account` — unused in v1 (no social login)
- `verification` — magic link tokens (managed by Better Auth)

### App-specific tables

#### `clients`

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid pk | |
| `slug` | text unique | Used for VPS directory name (`esnack-<slug>`) |
| `name` | text | "Chez Mario" — display name |
| `status` | enum(`draft`, `provisioned`, `deployed`, `paused`) | Manual, updated by admin |
| `domain` | text | `chez-mario.fr` |
| `owner_email` | text | Restaurateur contact |
| `owner_name` | text | |
| `owner_phone` | text nullable | |
| `notes` | text nullable | Free-form admin notes |
| `created_at`, `updated_at` | timestamp | |
| `deployed_at` | timestamp nullable | Manually set via "Mark as deployed" |

#### `client_config` (1:1 with clients)

| Field | Type | Notes |
|-------|------|-------|
| `client_id` | uuid pk, fk → clients | |
| `initial_admin_email` | text | Restaurant admin email |
| `initial_admin_password` | text | Plaintext (internal tool, single-tenant VPS) |
| `initial_admin_name` | text | |
| `initial_restaurant_name` | text | |
| `initial_restaurant_slug` | text | |
| `mollie_api_key` | text nullable | If null → on-site payment only |
| `resend_api_key` | text nullable | |
| `email_from_address` | text | |
| `jwt_secret` | text | Auto-generated at client creation |
| `cookie_secret` | text | Auto-generated |
| `postgres_password` | text | Auto-generated |
| `minio_root_password` | text | Auto-generated |

**Secrets in cleartext:** Justified for v1 because (a) single-tenant internal VPS, (b) pg_crypto adds KEK complexity without meaningfully raising the security bar, (c) whoever has DB access already owns the machine. Defer encryption to later if threat model changes.

## Pages

```
/ (redirect → /clients if authed, /login otherwise)
/login                            Email input → "link sent" confirmation
/verify                           Better Auth callback handles token; redirect based on result
/clients                          List of clients with status + search
/clients/new                      Create form (client + initial config)
/clients/[id]                     Detail view (summary + "Deploy helper" button)
/clients/[id]/edit                Edit client + config
/clients/[id]/deploy              Multi-tab modal page: Initial | Update | Debug | Rollback | Uninstall
/settings                         Team management (list admins, add/remove)
/api/auth/[...all]                Better Auth handler
/api/clients/                     CRUD endpoints
/api/admins/                      Admin management endpoints
```

## Deploy helper tabs

Each tab shows a copy-ready code block, pre-filled with the client's slug/domain/config:

1. **Déploiement initial** — full `.env` content + SSH setup + `git clone` + `docker compose up`
2. **Mise à jour** — `cd ~/clients/<slug> && git pull && docker compose up -d --build`
3. **Debug** — `docker compose logs -f api`, `docker compose ps`, psql connect string, etc.
4. **Rollback** — `git reset --hard <prev-commit> && docker compose up -d --build`
5. **Supprimer l'instance** — `docker compose down -v && rm -rf ~/clients/<slug>`

All snippets are plain string templates, no backend automation in v1.

## Auth flow

```
User visits /login
  ↓ enters email
  ↓ POST /api/auth/sign-in/magic-link (Better Auth)
  ↓   - disableSignUp: true → if email is not in user table, returns error silently
  ↓   - sendMagicLink callback: if RESEND_API_KEY set → email; else console.log the URL
  ↓
User clicks link → /verify?token=...
  ↓ Better Auth verifies token, creates session, sets signed cookie
  ↓ redirect to /clients
  ↓
Middleware (middleware.ts) guards /(app)/* routes:
  ↓ read session cookie → valid? proceed. invalid? redirect /login
```

## First-boot seed

At Next.js boot (via a server-side init helper), check if `user` table is empty. If yes AND `INITIAL_DASHBOARD_ADMIN_EMAIL` env var is set → insert that user row (Better Auth user row). This allows the owner to log in via magic link on first run.

## Success criteria

1. `docker compose up` spins up Postgres + Next.js dev server, ready in <30s
2. Navigate to `localhost:3000/login`, enter pre-seeded email, receive magic link in console (or email if Resend set), click it, arrive at `/clients` logged in
3. Create a new client via form, see it in the list with `status=draft`
4. Open client detail, click "Deploy helper", see 5 tabs with pre-filled, copy-ready commands
5. Edit client, change domain, see update reflected
6. `npx tsc --noEmit` passes cleanly

## Non-goals (v1)

- No automated SSH/deploy — commands are copy-paste only
- No branding asset storage (logos/banners — client uploads these via their own e-Snack admin post-deploy)
- No billing / subscription tracking
- No audit log (who did what when)
- No secret encryption at rest
- No production deployment (dev only)
- No collaborator invitation via UI form — v1 adds admins by `INSERT INTO user` or via settings page (basic form, no invite email)
- No real-time health monitoring of client instances
- No mobile support (dashboard is desktop-only)
