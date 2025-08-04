"use client"

import { signOut } from "next-auth/react"

export function useSimpleLogout() {
  const logout = async () => {
    try {
      // Força o logout imediato sem verificações extras
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      })
    } catch (error) {
      // Se o signOut falhar, força o redirecionamento manual
      console.error("Erro no logout:", error)
      window.location.href = "/"
    }
  }

  return { logout }
}
