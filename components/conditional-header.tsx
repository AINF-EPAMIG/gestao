"use client"

import { useSession } from "next-auth/react"
import { Header } from "@/components/header"

// Hook para verificar se o header deve ser exibido
export function useShowHeader() {
  const { data: session, status } = useSession()

  // Durante o carregamento da sessão, não mostra
  if (status === "loading") return false

  // Só mostra quando existe sessão autenticada
  if (!session) return false

  return true
}

export function ConditionalHeader() {
  const showHeader = useShowHeader()

  if (!showHeader) return null

  return <Header />
}

// Wrapper para o conteúdo que aplica padding apenas quando o header está visível
export function ConditionalContent({ children }: { children: React.ReactNode }) {
  const showHeader = useShowHeader()

  return (
    <div className={showHeader ? "pt-16" : ""}>
      {children}
    </div>
  )
}
