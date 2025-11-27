"use client"

import { useUserSector } from "@/lib/user-sector-context"
import RestrictedAccess from "./restricted-access"
import { Sidebar } from "./sidebar"
import { Loader2 } from "lucide-react"

export function SectorCheck({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useUserSector()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!isAuthorized) {
    return <RestrictedAccess />
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4">{children}</main>
    </div>
  )
} 