"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function AuthButton() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    await signIn("google")
  }

  if (session) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-center text-emerald-100/80">
          {session.user?.email}
        </p>
        <Button
          onClick={() => signOut()}
          className="gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
        >
          Sair
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className="gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FcGoogle className="text-lg" />
      )}
      {isLoading ? "Carregando..." : "Entrar com Google"}
    </Button>
  )
} 