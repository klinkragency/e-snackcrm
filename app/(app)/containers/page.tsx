import { getCurrentUser } from "@/lib/auth/server"
import { Toaster } from "sonner"
import { ContainersGrid } from "@/components/containers-grid"

export default async function ContainersPage() {
  const currentUser = await getCurrentUser()
  const canWrite = currentUser?.role === "admin"

  return (
    <div>
      <Toaster position="top-center" />
      <ContainersGrid canWrite={canWrite} />
    </div>
  )
}
