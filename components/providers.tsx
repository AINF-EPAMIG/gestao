"use client"

import { SessionProvider } from "next-auth/react"
import { ReauthButton } from "./reauth-button"
import { UserSectorProvider } from "@/lib/user-sector-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserSectorProvider>
        {children}
        <ReauthButton />
      </UserSectorProvider>
    </SessionProvider>
  )
} 