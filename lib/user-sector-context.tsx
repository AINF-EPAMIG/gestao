"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { NivelHierarquico, PermissoesUsuario } from "@/lib/types"

type UserSectorContextType = {
  userSector: string | null
  isAuthorized: boolean
  isLoading: boolean
  userLevel: NivelHierarquico | null
  permissions: PermissoesUsuario | null
}

const UserSectorContext = createContext<UserSectorContextType>({
  userSector: null,
  isAuthorized: false,
  isLoading: true,
  userLevel: null,
  permissions: null
})

export function UserSectorProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [userSector, setUserSector] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [userLevel, setUserLevel] = useState<NivelHierarquico | null>(null)
  const [permissions, setPermissions] = useState<PermissoesUsuario | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Verificar se estamos no cliente antes de acessar localStorage
    if (typeof window === 'undefined') return

    // Primeiro, tenta recuperar do localStorage
    const cachedSector = localStorage.getItem("userSector")
    const cachedAuthorization = localStorage.getItem("isAuthorized")
    const cachedLevel = localStorage.getItem("userLevel")
    const cachedPermissions = localStorage.getItem("userPermissions")
    
    if (cachedSector && cachedAuthorization && cachedLevel && cachedPermissions) {
      setUserSector(cachedSector)
      setIsAuthorized(cachedAuthorization === "true")
      setUserLevel(cachedLevel as NivelHierarquico)
      try {
        setPermissions(JSON.parse(cachedPermissions))
      } catch (e) {
        console.error('Erro ao parsear permissões do cache:', e)
      }
      setIsLoading(false)
    }
    
    async function fetchUserInfo() {
      if (session?.user?.email) {
        try {
          // Buscar informações completas do usuário incluindo autorização baseada em nível
          const [userInfoRes, authRes] = await Promise.all([
            fetch(`/api/funcionarios?action=userInfo&email=${encodeURIComponent(session.user.email)}`),
            fetch(`/api/funcionarios?action=getUserAutorizacao&email=${encodeURIComponent(session.user.email)}`)
          ])
          
          if (userInfoRes.ok && authRes.ok) {
            const userInfo = await userInfoRes.json()
            const authData = await authRes.json()
            
            const sector = userInfo?.departamento || userInfo?.divisao || userInfo?.assessoria || userInfo?.secao || null
            
            // Nova lógica: qualquer usuário autenticado tem acesso
            // As permissões específicas são controladas pelo nível hierárquico
            const authorized = !!userInfo
            
            // Armazena no state
            setUserSector(sector)
            setIsAuthorized(authorized)
            setUserLevel(authData?.nivel || NivelHierarquico.COLABORADOR)
            setPermissions(authData?.permissoes || null)
            
            // Armazena no localStorage apenas se estivermos no cliente
            if (typeof window !== 'undefined') {
              localStorage.setItem("userSector", sector || "")
              localStorage.setItem("isAuthorized", authorized.toString())
              localStorage.setItem("userLevel", authData?.nivel || NivelHierarquico.COLABORADOR)
              localStorage.setItem("userPermissions", JSON.stringify(authData?.permissoes || {}))
            }
          } else {
            // Se falhar, define valores padrão para evitar loop
            setUserSector(null)
            setIsAuthorized(false)
            setUserLevel(NivelHierarquico.COLABORADOR)
            setPermissions(null)
          }
        } catch (error) {
          console.error("Erro ao buscar informações do usuário:", error)
          // Define valores padrão em caso de erro
          setUserSector(null)
          setIsAuthorized(false)
          setUserLevel(NivelHierarquico.COLABORADOR)
          setPermissions(null)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    // Se está autenticado mas não tem cache válido, busca do servidor
    if (status === "authenticated" && session?.user?.email && (!cachedSector || !cachedAuthorization || !cachedLevel)) {
      fetchUserInfo()
    } else if (status === "authenticated" && cachedSector && cachedAuthorization && cachedLevel) {
      // Se tem cache válido, apenas define loading como false
      setIsLoading(false)
    }
    
    // Limpa o cache quando o usuário faz logout
    if (status === "unauthenticated") {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("userSector")
        localStorage.removeItem("isAuthorized")
        localStorage.removeItem("userLevel")
        localStorage.removeItem("userPermissions")
      }
      setUserSector(null)
      setIsAuthorized(false)
      setUserLevel(null)
      setPermissions(null)
      setIsLoading(false)
    }
  }, [session, status, mounted])

  return (
    <UserSectorContext.Provider value={{ 
      userSector, 
      isAuthorized, 
      isLoading, 
      userLevel, 
      permissions 
    }}>
      {children}
    </UserSectorContext.Provider>
  )
}

export function useUserSector() {
  return useContext(UserSectorContext)
} 