"use client"

import { SessionProvider } from "next-auth/react"
import { ReauthButton } from "./reauth-button"
import { UserSectorProvider } from "@/lib/user-sector-context"
import { LogoutProvider } from "@/lib/logout-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LogoutProvider>
        <UserSectorProvider>
          {children}
          <ReauthButton />
        </UserSectorProvider>
      </LogoutProvider>
    </SessionProvider>
  )
} 