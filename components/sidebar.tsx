"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, KanbanSquare, FileSpreadsheet, Menu, ChevronDown, Ticket, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Footer } from "./footer"
import { useSession } from "next-auth/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

import { useUserSector } from "@/lib/user-sector-context"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { useSetorNavigation } from "@/lib/hooks/use-setor-navigation"
import { useManualLogout } from "@/lib/hooks/use-manual-logout"

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { data: session } = useSession()
  const { userSector } = useUserSector()
  const { isLoading: permissionsLoading } = usePermissions()
  const { setores, selectedSetor, changeSetor, canViewAllSectors } = useSetorNavigation()
  const { logout } = useManualLogout()

  useEffect(() => {
    if (!permissionsLoading && session?.user?.email) {
      // Se não pode ver todos os setores, define o setor do usuário como selecionado
      if (!canViewAllSectors && userSector) {
        changeSetor(userSector);
      }
    }
  }, [session?.user?.email, userSector, changeSetor, canViewAllSectors, permissionsLoading]);

  // Reset dropdown state when permissions change
  useEffect(() => {
    if (!permissionsLoading) {
      setDropdownOpen(false);
    }
  }, [permissionsLoading]);

  const handleSetorSelect = (setor: string | null) => {
    changeSetor(setor);
    // Pequeno delay para garantir que o estado seja atualizado antes de fechar
    setTimeout(() => {
      setDropdownOpen(false);
    }, 100);
  };

  const navigation = [
    {
      href: "/",
      icon: LayoutDashboard,
      label: "Painel",
    },
    {
      href: "/kanban",
      icon: KanbanSquare,
      label: "Kanban",
    },
    {
      href: "/chamados",
      icon: Ticket,
      label: "Chamados",
    },
    {
      href: "/planilha",
      icon: FileSpreadsheet,
      label: "Planilha",
    },
  ]

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 pt-4 sm:pt-6">
        <div className="px-3 sm:px-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-semibold">Gestão</h1>
          {/* Botão de Logout */}
          {session && (
            <button
              onClick={logout}
              className="flex items-center justify-center w-6 h-6 text-white/50 hover:text-white/80 transition-colors rounded-full"
              title="Sair"
            >
              <LogOut size={14} className="shrink-0" />
            </button>
          )}
        </div>
        {canViewAllSectors && (
          <div className="px-3 sm:px-4 flex items-center gap-2">
            <span className="text-sm text-white/80">Setor:</span>
            <DropdownMenu 
              open={dropdownOpen} 
              onOpenChange={setDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex-1 h-8 text-white hover:bg-emerald-700/50 justify-between"
                >
                  <span className="truncate">
                    {selectedSetor ? 
                      (setores.find(s => s.sigla === selectedSetor)?.nome || selectedSetor) : 
                      "Todos os Setores"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-72 bg-white max-h-[300px] overflow-y-auto z-[9999]"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#10b981 transparent'
                }}
                sideOffset={8}
                collisionPadding={8}
              >
                <DropdownMenuItem 
                  onClick={() => handleSetorSelect(null)}
                  className={`text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 ${!selectedSetor ? 'bg-emerald-100 text-emerald-900 font-medium' : ''}`}
                >
                  🌐 Todos os Setores
                </DropdownMenuItem>
                <div className="h-px bg-gray-200 my-1" />
                {setores.map((setor) => (
                  <DropdownMenuItem 
                    key={setor.sigla}
                    onClick={() => handleSetorSelect(setor.sigla)}
                    className={`text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 ${selectedSetor === setor.sigla ? 'bg-emerald-100 text-emerald-900 font-medium' : ''}`}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{setor.sigla}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {setor.tipo} • {setor.count} funcionário{setor.count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {!canViewAllSectors && userSector && (
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
                "flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-2 transition-colors",
                "hover:bg-emerald-700/50 active:bg-emerald-700/70",
                "touch-target-auto", // Melhor área de toque para mobile
                pathname === item.href && "bg-emerald-700",
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
            className="w-[280px] p-0 bg-emerald-800 text-white h-full flex flex-col [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-4 bottom-4 left-4 w-64 bg-emerald-800 text-white rounded-2xl shadow-lg">
          <NavContent />
        </div>
        {/* Spacer div para empurrar o conteúdo principal */}
        <div className="w-[280px] shrink-0" /> {/* 256px (sidebar) + 24px (left margin) */}
      </div>
    </>
  )
}

