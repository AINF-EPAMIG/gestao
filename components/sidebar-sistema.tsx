"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ChevronDown, LogOut, Notebook, Package, Receipt, ShoppingCart, Monitor, ClipboardPen, Globe, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Footer } from "./footer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

import { useUserSector } from "@/lib/user-sector-context"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { useSetorNavigation } from "@/lib/hooks/use-setor-navigation"
import { useSimpleLogout } from "@/lib/hooks/use-simple-logout"

export function SidebarSistema() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  // accordion behavior: only one submenu open at a time
  const [openItem, setOpenItem] = useState<string | null>(null)
  const { data: session } = useSession()
  const { userSector } = useUserSector()
  const { isLoading: permissionsLoading } = usePermissions()
  const { setores, selectedSetor, changeSetor, canViewAllSectors } = useSetorNavigation()
  const { logout } = useSimpleLogout()

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
  //Aqui adiciona os itens do menu***************
  const navigation = [

    {
      href: "/asti/home",
      icon: Home,
      label: "Início",
    },
    {
      href: "/asti/area-conhecimento",
      icon: Notebook,
      label: "Área de conhecimento",
      children: [
        { href: "/asti/area-conhecimento/cadastrar", label: "Cadastrar Tutoriais" },
        { href: "/asti/area-conhecimento/consultar", label: "Consultar Tutoriais" },
      ],
    },
    {
      href: "/asti/contratos",
      icon: ClipboardPen,
      label: "Contratos",
      children: [
        { href: "/asti/contratos/cadastrar", label: "Cadastrar Contrato" },
        { href: "/asti/contratos/consultar", label: "Consultar Contrato" },
        { href: "/asti/contratos/proximos-vencimentos", label: "Próximo do Vencimento" },
        { href: "/asti/contratos/aditivar", label: "Aditivar Contrato" },
      ],
    },
    {
      href: "/asti/controle-estoque",
      icon: Package,
      label: "Controle de estoque",
      children: [
        { href: "/asti/controle-estoque/cadastrar", label: "Cadastrar Estoque" },
        { href: "/asti/controle-estoque/consultar", label: "Consultar Estoque" },
        { href: "/asti/controle-estoque/movimentacao", label: "Movimentação de Estoque" },
      ],
    },
    {
      href: "/asti/faturamento",
      icon: Receipt,
      label: "Faturamento",
      children: [
        { href: "/asti/faturamento/atualizar", label: "Atualizar Status" },
        { href: "/asti/faturamento/cadastrar", label: "Cadastrar faturamento" },
        { href: "/asti/faturamento/consultar", label: "Cosultar faturamento" },
      ],
    },
    {
      href: "/compras",
      icon: ShoppingCart,
      label: "Gestão de compras",
      children: [
        { href: "/compras/cadastrar", label: "Cadastrar Orçamento" },
        { href: "/compras/consultar", label: "Consultar Orçamento" },
      ],
    },
    {
      href: "/asti/gestao-ips",
      icon: Monitor,
      label: "Gestão de IPs",
      children: [
        { href: "/asti/gestao-ips/cadastrar", label: "Cadastrar IPs" },
        { href: "/asti/gestao-ips/consultar", label: "Consultar IPs" },
      ],
    },
    {
      href: "/",
      icon: Globe,
      label: "Sistema Gestão",
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
          {navigation.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0
            const isParentActive = hasChildren && item.children!.some(c => pathname === c.href || pathname.startsWith(c.href))
            const isOpen = openItem === item.href || isParentActive

            if (hasChildren) {
              return (
                <div key={item.href} className="mb-0">
                  <button
                    onClick={() => setOpenItem(prev => (prev === item.href ? null : item.href))}
                    aria-expanded={isOpen}
                    //Aqui muda a cor do item do menu pai**********
                    className={cn(
                      "flex w-full items-center gap-3 px-3 sm:px-4 py-3 sm:py-3 transition-colors justify-between",
                      "hover:bg-[#01432D] active:bg-emerald-900/70",
                      "touch-target-auto",
                      (isOpen || isParentActive) && "bg-emerald-900/70"
                    )}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className="shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>

                  <div className={cn("overflow-hidden transition-[max-height] duration-200", !isOpen && "max-h-0", isOpen && "max-h-[240px]")}> 
                    <div className="flex flex-col">
                      {item.children!.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          //Aq muda a cor do sub menu***************
                          className={cn(
                            "flex items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-emerald-900/50",
                            pathname === child.href && "bg-emerald-900"
                          )}
                          onClick={() => setOpen(false)}
                        >
                          <span className="ml-[2px]">{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                //Aqui muda a cor do item do menu s/ o subitem**********
                className={cn(
                  "flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3 transition-colors",
                  "hover:bg-[#01432D] active:bg-emerald-700/70",
                  "touch-target-auto", // Melhor área de toque para mobile
                  pathname === item.href && "bg-emerald-900",
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon size={18} className="shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
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

