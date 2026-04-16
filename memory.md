# Memory - e-SnackCRM Project State

## Key Decisions

1. **Auth strategy**: Better Auth with magic link (admin) + email/password (affiliate registration). Admin plugin manages roles: "user", "admin", "affiliate"
2. **Schema extension**: CRM tables added to existing schema.ts alongside clients/clientConfig tables. No breaking changes to existing tables
3. **Middleware**: Extended to protect /dashboard, /admin, /api/crm. Public routes: /join, /profil, /auth
4. **Commission model**: Direct (N1) at affiliate's commissionRate, indirect (N2) at fixed 1%. Calculated on payment creation, paid manually by admin
5. **Pipeline steps**: A(Prospection) -> B(Qualification) -> C(Proposition) -> D(Negociation) -> E(Cloture). Sequential, no skipping
6. **Grade progression**: Based on completed deals (step E). STARTER(0-5), SILVER(5-15), GOLD(15-30), PLATINUM(30-50), DIAMOND(50+)
7. **Parrainage codes**: 8-char alphanumeric, generated at registration, unique per affiliate

## Architecture Notes

- Layouts: /dashboard uses affiliate sidebar, /admin uses admin sidebar. Both query DB for user role/grade
- API routes use `auth.api.getSession({ headers: await headers() })` pattern
- Admin pages check `dbUser.role === "admin"`, redirect to /dashboard if not
- Affiliate pages check role is "affiliate" or "admin"
- All affiliate queries filter on `affiliateId = session.user.id`
- Admin actions write to auditLog table

## What Has Been Built

### Existing (friend's code)
- Next.js 16 + Drizzle + Better Auth setup
- Client management dashboard (/(app)/ routes)
- Docker deployment tooling
- Tables: user, session, account, verification, clients, clientConfig, managedContainers

### Phase 1 - Specs
- 14 specification documents in /docs/specs/

### Phase 2 - CRM Code
- DB schema extended with CRM tables (leads, payments, badges, userBadges, documents, comments, timelineEvents, notifications, auditLog)
- Dashboard layout + 7 pages (overview, leads, lead detail, new lead, network, badges, finances, profile)
- Admin layout + 7 pages (overview, pipeline kanban, leads, affiliates, payments, badges, audit)
- Public pages (login, join/[code], profil/[code])
- API routes (leads, register, payments, comments, notifications, profile)

## What Remains

- [ ] Components: pipeline step forms (StepB-E), StepGuard, ConfirmDialog
- [ ] lib/commission.ts - Commission calculation engine
- [ ] lib/badges.ts - Badge auto-attribution logic
- [ ] lib/validations.ts - Zod schemas for each pipeline step
- [ ] Server actions for step transitions
- [ ] Email templates (Resend)
- [ ] Notification system
- [ ] Loading/error states for all pages
- [ ] Zustand stores
- [ ] Tests
