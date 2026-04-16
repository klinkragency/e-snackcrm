import { z } from "zod/v4"

// ─── Step A: Prospection — basic lead info ─────────────────────────────

export const stepASchema = z.object({
  clientFirstname: z.string().min(2, { error: "Le prenom doit contenir au moins 2 caracteres" }),
  clientLastname: z.string().min(2, { error: "Le nom doit contenir au moins 2 caracteres" }),
  clientEmail: z.email({ error: "Email invalide" }),
  clientPhone: z.string().min(8, { error: "Numero de telephone invalide" }),
  clientCity: z.string().optional(),
  clientPostal: z.string().optional(),
  clientCountry: z.string().default("FR"),
  clientCompany: z.string().optional(),
  clientSector: z.string().optional(),
  clientWebsite: z.url({ error: "URL invalide" }).optional().or(z.literal("")),
  clientLinkedin: z.url({ error: "URL LinkedIn invalide" }).optional().or(z.literal("")),
  source: z.string().optional(),
  initialNote: z.string().optional(),
})

// ─── Step B: Qualification — needs and scoring ─────────────────────────

export const stepBSchema = z.object({
  solution: z.string().min(1, { error: "La solution est requise" }),
  budgetEstimated: z.number().positive({ error: "Le budget doit etre positif" }).optional(),
  scoring: z.enum(["HOT", "WARM", "COLD"], { error: "Scoring invalide" }),
  mainNeed: z.string().min(1, { error: "Le besoin principal est requis" }),
  delayWanted: z.string().optional(),
  decisionMaker: z.boolean().optional(),
  decisionMakerName: z.string().optional(),
  competitiveContext: z.string().optional(),
  objections: z.string().optional(),
})

// ─── Step C: Proposition — quote details ───────────────────────────────

export const stepCSchema = z.object({
  quoteAmount: z.number().positive({ error: "Le montant doit etre positif" }),
  quoteUrl: z.url({ error: "URL du devis invalide" }).optional().or(z.literal("")),
  quoteValidity: z.string().optional(),
  quoteDiscount: z.number().min(0).max(100).optional(),
  quoteFeedback: z.string().optional(),
  quoteFollowup: z.string().optional(),
})

// ─── Step D: Negotiation — mockup and negotiation ──────────────────────

export const stepDSchema = z.object({
  mockupUrl: z.url({ error: "URL maquette invalide" }).optional().or(z.literal("")),
  mockupPresentedAt: z.string().optional(),
  mockupRevisions: z.number().int().min(0).optional(),
  mockupValidated: z.string().optional(),
  mockupFeedback: z.string().optional(),
})

// ─── Step E: Closing — contract and final amount ───────────────────────

export const stepESchema = z.object({
  finalAmount: z.number().positive({ error: "Le montant final doit etre positif" }),
  contractNumber: z.string().optional(),
  contractUrl: z.url({ error: "URL du contrat invalide" }).optional().or(z.literal("")),
  signedAt: z.string().optional(),
})

// ─── Registration (affiliate joins via parrainage code) ────────────────

export const registrationSchema = z.object({
  name: z.string().min(2, { error: "Le nom complet est requis" }),
  firstName: z.string().min(2, { error: "Le prenom est requis" }),
  lastName: z.string().min(2, { error: "Le nom est requis" }),
  email: z.email({ error: "Email invalide" }),
  password: z.string().min(8, { error: "Le mot de passe doit contenir au moins 8 caracteres" }),
  phone: z.string().min(8, { error: "Numero de telephone invalide" }).optional(),
  city: z.string().optional(),
  parrainageCode: z
    .string()
    .regex(/^[A-Z]{4}-\d{4}$/, { error: "Code de parrainage invalide (format: XXXX-0000)" })
    .optional(),
})

// ─── Profile Update ────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, { error: "Le prenom est requis" }).optional(),
  lastName: z.string().min(2, { error: "Le nom est requis" }).optional(),
  phone: z.string().min(8, { error: "Numero invalide" }).optional(),
  city: z.string().optional(),
  bio: z.string().max(500, { error: "La bio ne doit pas depasser 500 caracteres" }).optional(),
  avatarUrl: z.url({ error: "URL invalide" }).optional().or(z.literal("")),
  iban: z
    .string()
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/, { error: "IBAN invalide" })
    .optional()
    .or(z.literal("")),
})

// ─── Mark Payment Paid ─────────────────────────────────────────────────

export const markPaymentPaidSchema = z.object({
  paymentId: z.string().min(1, { error: "L'identifiant du paiement est requis" }),
  paidAt: z.string().optional(),
  adminNote: z.string().optional(),
})

// ─── Comments ──────────────────────────────────────────────────────────

export const commentSchema = z.object({
  leadId: z.string().min(1, { error: "L'identifiant du lead est requis" }),
  content: z
    .string()
    .min(1, { error: "Le commentaire ne peut pas etre vide" })
    .max(2000, { error: "Le commentaire ne doit pas depasser 2000 caracteres" }),
})

// ─── Type exports ──────────────────────────────────────────────────────

export type StepAData = z.infer<typeof stepASchema>
export type StepBData = z.infer<typeof stepBSchema>
export type StepCData = z.infer<typeof stepCSchema>
export type StepDData = z.infer<typeof stepDSchema>
export type StepEData = z.infer<typeof stepESchema>
export type RegistrationData = z.infer<typeof registrationSchema>
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>
export type MarkPaymentPaidData = z.infer<typeof markPaymentPaidSchema>
export type CommentData = z.infer<typeof commentSchema>
