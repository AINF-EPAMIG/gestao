"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface LogoutContextType {
  isLoggingOut: boolean
  setIsLoggingOut: (value: boolean) => void
}

const LogoutContext = createContext<LogoutContextType | undefined>(undefined)

export function LogoutProvider({ children }: { children: ReactNode }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { data: session } = useSession()

  // Reset o estado quando a sessão for limpa completamente
  useEffect(() => {
    if (!session && isLoggingOut) {
      // Pequeno delay para garantir que o signOut foi processado
      const timer = setTimeout(() => {
        setIsLoggingOut(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [session, isLoggingOut])

  return (
    <LogoutContext.Provider value={{ isLoggingOut, setIsLoggingOut }}>
      {children}
    </LogoutContext.Provider>
  )
}

export function useLogout() {
  const context = useContext(LogoutContext)
  if (context === undefined) {
    throw new Error('useLogout must be used within a LogoutProvider')
  }
  return context
}
