"use client"

import { useState } from "react"
import { Loader2 } from 'lucide-react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AuthRequiredProps {
  children: React.ReactNode
}

export default function AuthRequired({ children }: AuthRequiredProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await signIn('google', { 
        callbackUrl: window.location.origin,
        redirect: false 
      })
      
      if (result?.ok) {
        // Redirecionar para a página principal após login bem-sucedido
        router.push('/')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Mostra loading enquanto verifica a sessão
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Se está autenticado, renderiza os filhos
  if (session) {
    return <>{children}</>
  }

  // Se não está autenticado, mostra a página de login

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/bg-gestao.svg)' }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <Card className="shadow-lg bg-white/40 backdrop-blur-sm">
            <CardHeader className="text-center space-y-8">
              <h1 className="relative z-10 text-3xl font-bold text-center text-slate-800 mt-12 mb-8">
                Gestão de Projetos ASTI
              </h1>
              <div className="flex justify-center">
                <Image 
                  src="/epamig_logo_login.svg" 
                  alt="EPAMIG Logo" 
                  width={300} 
                  height={300}
                  className="object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">Acesso ao Sistema</CardTitle>
                <CardDescription className="text-slate-600 mt-4">
                  Faça login para acessar o sistema
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Google Login Button */}
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-slate-700 border border-slate-300 shadow-sm"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Entrar com Google</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  )
}
//   </div>