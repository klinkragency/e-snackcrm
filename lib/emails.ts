import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const emailFrom = process.env.EMAIL_FROM_ADDRESS || "no-reply@klinkragency.fr"
const appName = "Klinkr CRM"
const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"

// ─── Shared HTML wrapper ───────────────────────────────────────────────

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;color:#18181b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
<tr><td style="background:#18181b;padding:24px 32px;">
<span style="color:#fff;font-size:20px;font-weight:700;">${appName}</span>
</td></tr>
<tr><td style="padding:32px;">${body}</td></tr>
<tr><td style="padding:16px 32px;background:#fafafa;color:#71717a;font-size:12px;text-align:center;">
${appName} &mdash; <a href="${appUrl}" style="color:#3b82f6;">${appUrl}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Send helper ───────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`\n[email] (no RESEND_API_KEY) To: ${to}\n  Subject: ${subject}\n`)
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    })
    if (error) {
      console.warn(`[email] Resend error for ${to}:`, error.message)
    }
  } catch (err) {
    console.warn(`[email] Failed to send to ${to}:`, err)
  }
}

// ─── 1. Welcome Affiliate ──────────────────────────────────────────────

export async function sendWelcomeAffiliateEmail(params: {
  to: string
  name: string
  parrainageCode: string
}): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Bienvenue ${params.name} !</h2>
    <p>Votre compte affilie a ete cree avec succes sur ${appName}.</p>
    <p>Votre code de parrainage personnel :</p>
    <div style="background:#f4f4f5;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
      <span style="font-size:24px;font-weight:700;letter-spacing:2px;color:#18181b;">${params.parrainageCode}</span>
    </div>
    <p>Partagez ce code avec vos contacts pour developper votre reseau et gagner des commissions.</p>
    <a href="${appUrl}/dashboard" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Acceder au dashboard</a>
  `)
  await sendEmail(params.to, `Bienvenue sur ${appName}`, html)
}

// ─── 2. New Lead Submitted ─────────────────────────────────────────────

export async function sendNewLeadSubmittedEmail(params: {
  to: string
  affiliateName: string
  clientName: string
  leadId: string
}): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Nouveau lead soumis</h2>
    <p><strong>${params.affiliateName}</strong> a soumis un nouveau lead :</p>
    <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;"><strong>Client :</strong> ${params.clientName}</p>
    </div>
    <a href="${appUrl}/leads/${params.leadId}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Voir le lead</a>
  `)
  await sendEmail(params.to, `Nouveau lead : ${params.clientName}`, html)
}

// ─── 3. Lead Step Changed ──────────────────────────────────────────────

export async function sendLeadStepChangedEmail(params: {
  to: string
  clientName: string
  oldStep: string
  newStep: string
  leadId: string
}): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Lead avance dans le pipeline</h2>
    <p>Le lead <strong>${params.clientName}</strong> est passe de l'etape <strong>${params.oldStep}</strong> a <strong>${params.newStep}</strong>.</p>
    <a href="${appUrl}/leads/${params.leadId}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Voir le lead</a>
  `)
  await sendEmail(params.to, `Lead ${params.clientName} : etape ${params.newStep}`, html)
}

// ─── 4. Payment Confirmed ──────────────────────────────────────────────

export async function sendPaymentConfirmedEmail(params: {
  to: string
  affiliateName: string
  amount: number
  commissionAmount: number
  clientName: string
}): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Paiement confirme</h2>
    <p>Bonjour ${params.affiliateName},</p>
    <p>Un paiement a ete confirme pour le client <strong>${params.clientName}</strong> :</p>
    <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;"><strong>Montant :</strong> ${params.amount.toFixed(2)} EUR</p>
      <p style="margin:0;"><strong>Votre commission :</strong> ${params.commissionAmount.toFixed(2)} EUR</p>
    </div>
    <a href="${appUrl}/dashboard" style="display:inline-block;background:#10b981;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Voir mes commissions</a>
  `)
  await sendEmail(params.to, `Paiement confirme : ${params.commissionAmount.toFixed(2)} EUR de commission`, html)
}

// ─── 5. Badge Unlocked ─────────────────────────────────────────────────

export async function sendBadgeUnlockedEmail(params: {
  to: string
  userName: string
  badgeName: string
  badgeDescription: string
}): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Nouveau badge debloque !</h2>
    <p>Felicitations ${params.userName} !</p>
    <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:24px;text-align:center;margin:16px 0;">
      <p style="font-size:20px;font-weight:700;margin:0 0 8px;color:#92400e;">${params.badgeName}</p>
      <p style="margin:0;color:#78350f;">${params.badgeDescription}</p>
    </div>
    <a href="${appUrl}/badges" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Voir mes badges</a>
  `)
  await sendEmail(params.to, `Badge debloque : ${params.badgeName}`, html)
}

// ─── 6. New Recruit ────────────────────────────────────────────────────

export async function sendNewRecruitEmail(params: {
  to: string
  parrainName: string
  recruitName: string
  recruitEmail: string
}): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Nouveau filleul !</h2>
    <p>Bonjour ${params.parrainName},</p>
    <p>Un nouvel affilie a rejoint votre reseau grace a votre code de parrainage :</p>
    <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;"><strong>Nom :</strong> ${params.recruitName}</p>
      <p style="margin:0;"><strong>Email :</strong> ${params.recruitEmail}</p>
    </div>
    <p>Vous recevrez des commissions indirectes sur ses ventes selon votre grade actuel.</p>
    <a href="${appUrl}/reseau" style="display:inline-block;background:#8b5cf6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Voir mon reseau</a>
  `)
  await sendEmail(params.to, `Nouveau filleul : ${params.recruitName}`, html)
}

// ─── 7. Grade Upgrade Eligible ─────────────────────────────────────────

export async function sendGradeUpgradeEligibleEmail(params: {
  to: string
  affiliateName: string
  currentGrade: string
  nextGrade: string
}): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;">Montee en grade disponible !</h2>
    <p>Bonjour ${params.affiliateName},</p>
    <p>Vous remplissez les conditions pour passer du grade <strong>${params.currentGrade}</strong> au grade <strong>${params.nextGrade}</strong> !</p>
    <p>Votre taux de commission sera augmente automatiquement.</p>
    <a href="${appUrl}/dashboard" style="display:inline-block;background:#8b5cf6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Voir mon grade</a>
  `)
  await sendEmail(params.to, `Eligible au grade ${params.nextGrade}`, html)
}

// ─── 8. Affiliate Suspended ────────────────────────────────────────────

export async function sendAffiliateSuspendedEmail(params: {
  to: string
  affiliateName: string
  reason: string
}): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">Compte suspendu</h2>
    <p>Bonjour ${params.affiliateName},</p>
    <p>Votre compte affilie a ete suspendu pour la raison suivante :</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#991b1b;">${params.reason}</p>
    </div>
    <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un administrateur.</p>
  `)
  await sendEmail(params.to, `Compte suspendu - ${appName}`, html)
}
