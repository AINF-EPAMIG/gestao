"use client"

import { signOut } from "next-auth/react"

export function useSimpleLogout() {
  const logout = async () => {
    try {
      // Limpa o localStorage completamente antes do logout
      localStorage.removeItem('manual-logout')
      localStorage.removeItem('userSector')
      localStorage.removeItem('isAuthorized')
      localStorage.removeItem('userLevel')
      localStorage.removeItem('userPermissions')
      
      // Força o logout imediato sem verificações extras
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      })
    } catch (error) {
      // Se o signOut falhar, força o redirecionamento manual
      console.error("Erro no logout:", error)
      // Limpa o localStorage mesmo em caso de erro
      localStorage.clear()
      window.location.href = "/"
    }
  }

  return { logout }
}
