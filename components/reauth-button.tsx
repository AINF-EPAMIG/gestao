"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export function ReauthButton() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Verifica se há erro de autenticação na sessão
    if (session?.error === "RefreshAccessTokenError") {
      setOpen(true)
    }
  }, [session])

  const handleReauth = () => {
    signIn("google", { callbackUrl: window.location.href })
  }

  const handleCancel = () => {
    setOpen(false)
    signOut({ callbackUrl: "/" })
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