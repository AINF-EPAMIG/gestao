"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useSimpleLogout } from "@/lib/hooks/use-simple-logout"

export function ReauthButton() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const { logout } = useSimpleLogout()

  useEffect(() => {
    // Verifica se há erro de autenticação na sessão
    if (session?.error === "RefreshAccessTokenError") {
      // Verifica se o usuário não fez logout manual recentemente
      const isManualLogout = localStorage.getItem('manual-logout')
      
      if (!isManualLogout) {
        setOpen(true)
      } else {
        // Remove a flag após verificar e força o logout
        localStorage.removeItem('manual-logout')
        // Executa logout automaticamente quando há erro e foi logout manual
        console.log('Executando logout automático devido a RefreshAccessTokenError após logout manual')
        logout()
      }
    } else if (!session?.error) {
      // Se não há erro, fecha o diálogo
      setOpen(false)
    }
  }, [session, logout])

  // Efeito adicional para detectar mudanças no status da sessão
  useEffect(() => {
    // Se a sessão foi perdida completamente, limpa qualquer estado residual
    if (!session) {
      setOpen(false)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('manual-logout')
      }
    }
  }, [session])

  const handleReauth = () => {
    setOpen(false)
    signIn("google", { callbackUrl: window.location.href })
  }

  const handleCancel = () => {
    setOpen(false)
    // Marca como logout manual antes de fazer logout
    localStorage.setItem('manual-logout', 'true')
    logout()
  }

  if (!session?.error) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão expirada</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão com o Google expirou. É necessário fazer login novamente para continuar usando os recursos do site.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReauth} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Fazer login novamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 