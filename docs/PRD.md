# PRD - e-SnackCRM Affiliate Platform

## Vision

e-SnackCRM is a CRM platform enabling affiliate-based lead management with a 5-step pipeline (A through E), multi-level commission tracking (N1 direct, N2 indirect), gamification via badges, and grade progression (STARTER to DIAMOND).

## Users

1. **Affiliates** (role="affiliate") - Manage their leads through the pipeline, track commissions, recruit sub-affiliates, earn badges
2. **Admins** (role="admin") - Full pipeline visibility, payment management, badge attribution, audit trail
3. **Public visitors** - View affiliate profiles, register via sponsor codes

## Core Features

### Pipeline (5 Steps)
- **A - Prospection**: Initial lead capture (name, email, phone, company, source)
- **B - Qualification**: Scoring (HOT/WARM/COLD), need analysis, budget estimation
- **C - Proposition**: Quote creation, mockup presentation, revision tracking
- **D - Negociation**: Final amount, contract negotiation, objection handling
- **E - Cloture**: Contract signed, payments scheduled, commission triggered

### Commission System
- Direct commission (N1): affiliate.commissionRate * payment.amount on their own leads
- Indirect commission (N2): 1% of payments from their recruits' leads
- Three payment types: ACOMPTE, INTERMEDIAIRE, SOLDE
- Admin manually marks payments as PAID

### Gamification
- 4 badge categories: PREMIERS_PAS, PERFORMANCE, RESEAU, MANUEL
- 4 rarity levels: COMMON, RARE, EPIC, LEGENDARY
- Auto-awarded on conditions (first lead, first deal, etc.) or manually by admin
- Grade progression based on deal count: STARTER(0-5), SILVER(5-15), GOLD(15-30), PLATINUM(30-50), DIAMOND(50+)

### Network (MLM-lite)
- Each affiliate has a unique parrainage code
- Registration via /join/[code] links sponsor to recruit (parentId)
- N1 = direct recruits, N2 = recruits of recruits
- Public profile at /profil/[code] with badges, stats, join CTA

## Technical Stack
- Next.js 16 (App Router, Server Components)
- Drizzle ORM + PostgreSQL
- Better Auth (magic link + email/password + admin plugin)
- Tailwind CSS
- Zod validation
- Lucide React icons

## Auth Flow
- Admin: magic link login only
- Affiliate: email/password registration via /join/[code], then magic link login
- Middleware protects /dashboard, /admin, /api/crm routes
- Public: /join/[code], /profil/[code], /auth/* are unprotected

## API Routes
- POST/GET /api/crm/leads - Create and list leads
- POST /api/crm/register - Affiliate registration
- POST /api/crm/payments - Mark payment as paid (admin)
- POST /api/crm/comments - Add comment to lead
- GET /api/crm/notifications - List user notifications
- GET/PATCH /api/crm/profile - Read/update profile
