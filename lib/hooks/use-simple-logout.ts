"use client"

import { signOut } from "next-auth/react"

export function useSimpleLogout() {
  const logout = async () => {
    try {
      // Marca explicitamente que o logout foi manual para evitar abrir o diálogo de reautenticação
      localStorage.setItem('manual-logout', 'true')
      // Limpa demais informações de sessão antes do logout
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
      // Mantém a flag de logout manual para evitar o modal de reautenticação na próxima navegação
      const shouldKeepManualLogout = true
      if (shouldKeepManualLogout) {
        localStorage.setItem('manual-logout', 'true')
      }
      localStorage.removeItem('userSector')
      localStorage.removeItem('isAuthorized')
      localStorage.removeItem('userLevel')
      localStorage.removeItem('userPermissions')
      window.location.href = "/"
    }
  }

  return { logout }
}
