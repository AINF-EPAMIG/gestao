"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface LogoutContextType {
  isLoggingOut: boolean
  setIsLoggingOut: (value: boolean) => void
}

const LogoutContext = createContext<LogoutContextType | undefined>(undefined)

export function LogoutProvider({ children }: { children: ReactNode }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
