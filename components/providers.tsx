"use client"

import { SessionProvider } from "next-auth/react"
import { ReauthButton } from "./reauth-button"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ReauthButton />
    </SessionProvider>
  )
} 