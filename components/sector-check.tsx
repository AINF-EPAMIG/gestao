"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import RestrictedAccess from "./restricted-access"
import { Sidebar } from "./sidebar"
import { Loader2 } from "lucide-react"

async function getUserInfo(email: string) {
  try {
    const res = await fetch(`/api/funcionarios?action=userInfo&email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Failed to fetch user info');
    return res.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

export function SectorCheck({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    async function checkUserSector() {
      if (session?.user?.email) {
        const userInfo = await getUserInfo(session.user.email)
        setIsAuthorized(userInfo?.secao === "ASTI")
      }
      setIsLoading(false)
    }

    if (status === "authenticated") {
      checkUserSector()
    } else if (status === "unauthenticated") {
      setIsLoading(false)
    }
  }, [session, status])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!session || !isAuthorized) {
    return <RestrictedAccess />
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
} 