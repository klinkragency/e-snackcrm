import { db } from "@/lib/db"
import { badges } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { BadgeDefinition } from "@/types"

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ─── PREMIERS_PAS ──────────────────────────────────────────────────
  {
    slug: "first-lead",
    name: "Premier Pas",
    description: "Soumettez votre premier lead",
    category: "PREMIERS_PAS",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>',
    conditionText: "Soumettre 1 lead",
    isManual: false,
  },
  {
    slug: "first-conversion",
    name: "Premiere Vente",
    description: "Convertissez votre premier lead en client",
    category: "PREMIERS_PAS",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
    conditionText: "Convertir 1 lead (etape E)",
    isManual: false,
  },
  {
    slug: "first-commission",
    name: "Premier Gain",
    description: "Recevez votre premiere commission",
    category: "PREMIERS_PAS",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>',
    conditionText: "Recevoir une commission > 0",
    isManual: false,
  },
  {
    slug: "first-recruit",
    name: "Premier Filleul",
    description: "Parrainez votre premier affilie",
    category: "PREMIERS_PAS",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
    conditionText: "Parrainer 1 affilie",
    isManual: false,
  },
  {
    slug: "profile-complete",
    name: "Profil Complet",
    description: "Completez toutes les informations de votre profil",
    category: "PREMIERS_PAS",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    conditionText: "Remplir tous les champs du profil",
    isManual: false,
  },
  {
    slug: "one-week-active",
    name: "Une Semaine",
    description: "Soyez actif pendant une semaine",
    category: "PREMIERS_PAS",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>',
    conditionText: "7 jours depuis l'inscription",
    isManual: false,
  },
  {
    slug: "one-month-active",
    name: "Un Mois",
    description: "Soyez actif pendant un mois",
    category: "PREMIERS_PAS",
    rarity: "RARE",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>',
    conditionText: "30 jours depuis l'inscription",
    isManual: false,
  },

  // ─── PERFORMANCE ───────────────────────────────────────────────────
  {
    slug: "10-leads",
    name: "Prospecteur",
    description: "Soumettez 10 leads",
    category: "PERFORMANCE",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
    conditionText: "Soumettre 10 leads",
    isManual: false,
  },
  {
    slug: "25-leads",
    name: "Chasseur",
    description: "Soumettez 25 leads",
    category: "PERFORMANCE",
    rarity: "RARE",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
    conditionText: "Soumettre 25 leads",
    isManual: false,
  },
  {
    slug: "50-leads",
    name: "Expert",
    description: "Soumettez 50 leads",
    category: "PERFORMANCE",
    rarity: "EPIC",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>',
    conditionText: "Soumettre 50 leads",
    isManual: false,
  },
  {
    slug: "100-leads",
    name: "Legende",
    description: "Soumettez 100 leads",
    category: "PERFORMANCE",
    rarity: "LEGENDARY",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z"/></svg>',
    conditionText: "Soumettre 100 leads",
    isManual: false,
  },
  {
    slug: "5-conversions",
    name: "Closer",
    description: "Convertissez 5 leads",
    category: "PERFORMANCE",
    rarity: "RARE",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>',
    conditionText: "Convertir 5 leads",
    isManual: false,
  },
  {
    slug: "10-conversions",
    name: "Machine a Vendre",
    description: "Convertissez 10 leads",
    category: "PERFORMANCE",
    rarity: "EPIC",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>',
    conditionText: "Convertir 10 leads",
    isManual: false,
  },
  {
    slug: "ca-5000",
    name: "5K Club",
    description: "Atteignez 5 000 EUR de chiffre d'affaires",
    category: "PERFORMANCE",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 6.2L6.8 4 12 9.2 17.2 4 19 6.2l-7 8.8z"/><path d="M5 13.2L6.8 11 12 16.2 17.2 11 19 13.2l-7 8.8z"/></svg>',
    conditionText: "5 000 EUR de CA cumule",
    isManual: false,
  },
  {
    slug: "ca-15000",
    name: "15K Club",
    description: "Atteignez 15 000 EUR de chiffre d'affaires",
    category: "PERFORMANCE",
    rarity: "RARE",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    conditionText: "15 000 EUR de CA cumule",
    isManual: false,
  },
  {
    slug: "ca-50000",
    name: "50K Club",
    description: "Atteignez 50 000 EUR de chiffre d'affaires",
    category: "PERFORMANCE",
    rarity: "EPIC",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
    conditionText: "50 000 EUR de CA cumule",
    isManual: false,
  },
  {
    slug: "ca-100000",
    name: "100K Club",
    description: "Atteignez 100 000 EUR de chiffre d'affaires",
    category: "PERFORMANCE",
    rarity: "LEGENDARY",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm1-10C9.79 6 8 7.79 8 10h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>',
    conditionText: "100 000 EUR de CA cumule",
    isManual: false,
  },

  // ─── RESEAU ────────────────────────────────────────────────────────
  {
    slug: "3-recruits",
    name: "Recruteur",
    description: "Parrainez 3 affilies",
    category: "RESEAU",
    rarity: "COMMON",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
    conditionText: "Parrainer 3 affilies",
    isManual: false,
  },
  {
    slug: "5-recruits",
    name: "Leader",
    description: "Parrainez 5 affilies",
    category: "RESEAU",
    rarity: "RARE",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>',
    conditionText: "Parrainer 5 affilies",
    isManual: false,
  },
  {
    slug: "10-recruits",
    name: "Capitaine",
    description: "Parrainez 10 affilies",
    category: "RESEAU",
    rarity: "EPIC",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
    conditionText: "Parrainer 10 affilies",
    isManual: false,
  },
  {
    slug: "grade-silver",
    name: "Argent",
    description: "Atteignez le grade Silver",
    category: "RESEAU",
    rarity: "RARE",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 21.5L3 17l1.4-1.4 3.1 3.1 7.6-7.6L16.5 12.5z M7.5 12.5L3 8l1.4-1.4 3.1 3.1 7.6-7.6L16.5 3.5z"/></svg>',
    conditionText: "Atteindre le grade Silver",
    isManual: false,
  },
  {
    slug: "grade-gold",
    name: "Or",
    description: "Atteignez le grade Gold",
    category: "RESEAU",
    rarity: "EPIC",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    conditionText: "Atteindre le grade Gold",
    isManual: false,
  },

  // ─── MANUEL (admin only) ───────────────────────────────────────────
  {
    slug: "admin-special",
    name: "Distinction Speciale",
    description: "Badge decerne par l'administration pour une contribution exceptionnelle",
    category: "MANUEL",
    rarity: "LEGENDARY",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    conditionText: "Attribue manuellement par un administrateur",
    isManual: true,
  },
  {
    slug: "admin-ambassador",
    name: "Ambassadeur",
    description: "Reconnu comme ambassadeur de la marque",
    category: "MANUEL",
    rarity: "LEGENDARY",
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>',
    conditionText: "Attribue manuellement par un administrateur",
    isManual: true,
  },
]

/**
 * Seed all badges into the database. Idempotent: skips badges whose slug already exists.
 */
export async function seedBadges(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0

  for (const badge of BADGE_DEFINITIONS) {
    const existing = await db
      .select({ id: badges.id })
      .from(badges)
      .where(eq(badges.slug, badge.slug))
      .limit(1)

    if (existing.length > 0) {
      skipped++
      continue
    }

    await db.insert(badges).values({
      id: crypto.randomUUID(),
      slug: badge.slug,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      rarity: badge.rarity,
      iconSvg: badge.iconSvg,
      conditionText: badge.conditionText,
      isManual: badge.isManual,
    })

    inserted++
  }

  console.log(`[seed-crm] Badges: ${inserted} inserted, ${skipped} skipped`)
  return { inserted, skipped }
}
