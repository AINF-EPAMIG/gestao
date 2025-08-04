"use client"

import { signOut } from "next-auth/react"
import { useLogout } from "../logout-context"

export function useManualLogout() {
  const { setIsLoggingOut } = useLogout()

  const logout = async () => {
    // Define o estado de logout ANTES de chamar signOut
    setIsLoggingOut(true)
    
    // Aguarda um tick para garantir que o estado seja propagado
    await new Promise(resolve => setTimeout(resolve, 0))
    
    // Agora executa o signOut
    signOut({ callbackUrl: "/" })
  }

  return { logout }
}
