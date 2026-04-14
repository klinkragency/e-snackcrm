import { z } from "zod"

export const createClientSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  slug: z
    .string()
    .min(1, "Slug requis")
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
  domain: z.string().min(1, "Domaine requis"),
  ownerEmail: z.string().email("Email invalide"),
  ownerName: z.string().min(1, "Nom du contact requis"),
  ownerPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),

  // Seed values for the client's e-Snack instance
  initialAdminEmail: z.string().email("Email admin restaurant invalide"),
  initialAdminPassword: z
    .string()
    .min(12, "Minimum 12 caractères (requis par e-snack en production)"),
  initialAdminName: z.string().min(1, "Nom admin requis"),
  initialRestaurantName: z.string().min(1, "Nom restaurant requis"),
  initialRestaurantSlug: z
    .string()
    .min(1, "Slug restaurant requis")
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),

  mollieApiKey: z.string().optional().or(z.literal("")),
  resendApiKey: z.string().optional().or(z.literal("")),
  emailFromAddress: z.string().email("Email expéditeur invalide"),
})

export const updateClientSchema = createClientSchema.partial()

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
