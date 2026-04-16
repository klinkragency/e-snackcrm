import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { auditLog, user } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export default async function AuditPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (dbUser?.role !== "admin") redirect("/dashboard")

  const logs = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      targetId: auditLog.targetId,
      targetType: auditLog.targetType,
      details: auditLog.details,
      createdAt: auditLog.createdAt,
      adminName: user.name,
      adminEmail: user.email,
    })
    .from(auditLog)
    .innerJoin(user, eq(auditLog.adminId, user.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(200)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Journal d&apos;audit</h1>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-500">Aucune action enregistree.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Admin
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Action
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Cible
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-neutral-500">
                    {log.createdAt.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium">{log.adminName}</p>
                    <p className="text-xs text-neutral-400">{log.adminEmail}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-600">
                    {log.targetType && (
                      <span className="text-neutral-400">{log.targetType}: </span>
                    )}
                    {log.targetId ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-500">
                    {log.details ? (
                      <pre className="max-w-xs truncate font-mono text-[10px]">
                        {JSON.stringify(log.details)}
                      </pre>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
