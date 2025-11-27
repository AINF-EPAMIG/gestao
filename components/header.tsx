"use client"

import Image from "next/image"
import { Menu, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useSimpleLogout } from "@/lib/hooks/use-simple-logout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { logout } = useSimpleLogout()

  const handleLogout = () => {
    localStorage.setItem('manual-logout', 'true')
    logout()
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-50 lg:left-64">
      <div className="h-full flex items-center justify-between px-4 lg:px-8">
        {/* Mobile: Menu button à esquerda */}
        <div className="lg:hidden mr-auto">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu className="h-6 w-6 text-gray-700" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
              {/* Mobile menu content will be handled by sidebar */}
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo e Título - Centralizado */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 lg:hidden">
            <Image
              src="/epamig.svg"
              alt="Logo EPAMIG"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-center" style={{ color: '#025C3E' }}>
              Empresa de Pesquisa Agropecuária de Minas Gerais
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              Secretaria de Estado de Agricultura, Pecuária e Abastecimento
            </p>
          </div>
        </div>

        {/* User Info and Logout - Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {session && (
            <>
              <Avatar className="h-9 w-9">
                <AvatarImage 
                  src={session.user?.image || ''} 
                  alt={session.user?.name || 'Avatar'}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-emerald-600 text-white">
                  {session.user?.name ? session.user.name.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-900">
                {session.user?.name ? session.user.name.split(' ')[0] : ''}
              </span>
              <Button
                size="sm"
                onClick={handleLogout}
                className="gap-2 bg-red-600 text-white hover:bg-red-700 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          )}
        </div>

        {/* Right side spacer for mobile symmetry */}
        <div className="w-10 lg:hidden"></div>
      </div>
    </header>
  )
}
