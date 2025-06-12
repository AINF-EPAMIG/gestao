"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSession } from "next-auth/react"

type UserSectorContextType = {
  userSector: string | null
  isAuthorized: boolean
  isLoading: boolean
}

const UserSectorContext = createContext<UserSectorContextType>({
  userSector: null,
  isAuthorized: false,
  isLoading: true
})

export function UserSectorProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [userSector, setUserSector] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Primeiro, tenta recuperar do localStorage
    const cachedSector = localStorage.getItem("userSector")
    const cachedAuthorization = localStorage.getItem("isAuthorized")
    
    if (cachedSector && cachedAuthorization) {
      setUserSector(cachedSector)
      setIsAuthorized(cachedAuthorization === "true")
      setIsLoading(false)
    }
    
    async function fetchUserInfo() {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/funcionarios?action=userInfo&email=${encodeURIComponent(session.user.email)}`)
          if (res.ok) {
            const userInfo = await res.json()
            const sector = userInfo?.secao || null
            const authorized = sector === "ASTI"
            
            // Armazena no state
            setUserSector(sector)
            setIsAuthorized(authorized)
            
            // Armazena no localStorage
            localStorage.setItem("userSector", sector || "")
            localStorage.setItem("isAuthorized", authorized.toString())
          }
        } catch (error) {
          console.error("Erro ao buscar informações do usuário:", error)
        } finally {
          setIsLoading(false)
        }
      } else if (status === "unauthenticated") {
        setIsLoading(false)
      }
    }

    // Se está autenticado mas não tem cache ou está carregando, busca do servidor
    if (status === "authenticated" && (!cachedSector || !cachedAuthorization)) {
      fetchUserInfo()
    }
    
    // Limpa o cache quando o usuário faz logout
    if (status === "unauthenticated") {
      localStorage.removeItem("userSector")
      localStorage.removeItem("isAuthorized")
      setUserSector(null)
      setIsAuthorized(false)
      setIsLoading(false)
    }
  }, [session, status])

  return (
    <UserSectorContext.Provider value={{ userSector, isAuthorized, isLoading }}>
      {children}
    </UserSectorContext.Provider>
  )
}

export function useUserSector() {
  return useContext(UserSectorContext)
} 