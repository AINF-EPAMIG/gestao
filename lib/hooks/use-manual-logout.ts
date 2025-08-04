"use client"

import { signOut } from "next-auth/react"
import { useLogout } from "../logout-context"

export function useManualLogout() {
  const { setIsLoggingOut } = useLogout()

  const logout = () => {
    setIsLoggingOut(true)
    signOut({ callbackUrl: "/" })
  }

  return { logout }
}
