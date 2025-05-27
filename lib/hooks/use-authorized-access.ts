import { useSession } from "next-auth/react"

export function useAuthorizedAccess() {
  const { data: session } = useSession()
  
  // Removida a verificação de emails específicos - agora qualquer usuário autenticado tem acesso
  const isAuthorized = !!session?.user

  return {
    isAuthorized,
    isLoading: !session,
  }
} 