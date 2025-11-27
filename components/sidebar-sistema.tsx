"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, LogOut, Notebook, Package, Receipt, ShoppingCart, Monitor, ClipboardPen, Globe, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Footer } from "./footer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"

import { useUserSector } from "@/lib/user-sector-context"
import { useSimpleLogout } from "@/lib/hooks/use-simple-logout"

export function SidebarSistema() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const { userSector } = useUserSector()
  const { logout } = useSimpleLogout()
  const navigation = [
    {
      href: "/",
      icon: Home,
      label: "Início",
    },
    {
      href: "/asti/home",
      icon: Globe,
      label: "Sistema ASTI",
    },
    {
      href: "/area-conhecimento",
      icon: Notebook,
      label: "Área de conhecimento",
    },
    {
      href: "/contratos",
      icon: ClipboardPen,
      label: "Contratos",
    },
    {
      href: "/controle-estoque",
      icon: Package,
      label: "Controle de estoque",
    },
    {
      href: "/faturamento",
      icon: Receipt,
      label: "Faturamento",
    },
    {
      href: "/compras",
      icon: ShoppingCart,
      label: "Gestão de compras",
    },
    {
      href: "/asti/gestao-ips",
      icon: Monitor,
      label: "Gestão de IPs",
    },
  ]

  const handleLogout = () => {
    // Marca como logout manual no localStorage
    localStorage.setItem('manual-logout', 'true')
    logout()
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 pt-4 sm:pt-6">
        <div className="px-3 sm:px-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-semibold">Sistema ASTI</h1> {/* Aqui muda o título************/}
          {/* Botão de Logout */}
          {session && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-6 h-6 text-white/50 hover:text-white/80 transition-colors rounded-full"
              title="Sair"
            >
              <LogOut size={14} className="shrink-0" />
            </button>
          )}
        </div>
        {/* Linha horizontal logo abaixo do título */}
        <div className="px-3 sm:px-4">
          <div className="h-px bg-red-600 my-2" />
        </div>
        {/* Perfil do usuário abaixo da linha */}
        <div className="px-3 sm:px-4">
          {session ? (
            <div className="flex items-center gap-3 py-2">
              {session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user?.name || 'Avatar'}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                // Fallback: tenta buscar avatar do banco via API usando o componente Avatar
                <Avatar>
                  <AvatarImage email={session.user?.email || ''} />
                  <AvatarFallback>{session.user?.name ? session.user.name.charAt(0) : '?'}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white">{session.user?.name || 'Usuário'}</span>
                <span className="text-xs text-white/60 truncate">{session.user?.email || ''}</span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-sm text-white/80">Não autenticado</div>
          )}
        </div>
        {userSector && (
          <div className="px-3 sm:px-4 text-sm text-white/80">
            Setor: {userSector}
          </div>
        )}
        <nav className="mt-4 sm:mt-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3 transition-colors",
                "hover:bg-[#01432D] active:bg-emerald-700/70",
                "touch-target-auto",
                pathname === item.href && "bg-emerald-900",
              )}
              onClick={() => setOpen(false)}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <Footer />
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full h-14">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-3 m-1 hover:bg-accent rounded-lg transition-colors">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[280px] p-0 bg-emerald-900 text-white h-full flex flex-col [&>button]:hidden"
          >{/*Aqui mudo a cor do fundo do menu para celular****************** */}
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-4 bottom-4 left-4 w-64 bg-emerald-800 text-white rounded-2xl shadow-lg">{/*Aqui mudo a cor do fundo do menu****************** */}
          <NavContent />
        </div>
        {/* Spacer div para empurrar o conteúdo principal */}
        <div className="w-[280px] shrink-0" /> {/* 256px (sidebar) + 24px (left margin) */}
      </div>
    </>
  )
}
