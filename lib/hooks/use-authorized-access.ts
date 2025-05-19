import { useSession } from "next-auth/react"
import { AUTHORIZED_EMAILS } from "@/lib/config"

export function useAuthorizedAccess() {
  const { data: session } = useSession()
  
  const isAuthorized = session?.user?.email 
    ? AUTHORIZED_EMAILS.includes(session.user.email)
    : false

  return {
    isAuthorized,
    isLoading: !session,
  }
} 