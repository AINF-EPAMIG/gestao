"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, KanbanSquare, FileSpreadsheet, Menu, ChevronDown, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Footer } from "./footer"
import { useSession } from "next-auth/react"
import { AuthButton } from "@/components/auth-button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useTaskStore } from "@/lib/store"

interface Setor {
  id: number;
  sigla: string;
  nome: string;
}

// Helpers para nova API
async function getUserInfo(email: string) {
  const res = await fetch(`/api/funcionarios?action=userInfo&email=${encodeURIComponent(email)}`);
  return res.json();
}
async function isUserAdmin() {
  // Adapte conforme sua lógica de admin, se necessário
  // Exemplo: checar se o email está em uma lista de admins
  return false;
}

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const [userSetor, setUserSetor] = useState<string | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined)
  const [setores, setSetores] = useState<Setor[]>([])
  const selectedSetor = useTaskStore((state) => state.selectedSetor)
  const setSelectedSetor = useTaskStore((state) => state.setSelectedSetor)

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (session?.user?.email) {
        // Verificar se é admin
        const admin = await isUserAdmin();
        setIsAdmin(admin);

        if (!admin) {
          // Se não for admin, buscar setor do usuário
          const userInfo = await getUserInfo(session.user.email);
          if (userInfo) {
            setUserSetor(userInfo.secao);
            setSelectedSetor(userInfo.secao); // Define o setor do usuário como selecionado
          }
        }
      }
    };

    fetchUserInfo();
  }, [session?.user?.email, setSelectedSetor]);

  useEffect(() => {
    // Buscar setores do banco apenas se for admin
    const fetchSetores = async () => {
      if (isAdmin) {
        try {
          const response = await fetch('/api/setor');
          if (response.ok) {
            const data = await response.json();
            setSetores(data);
          }
        } catch (error) {
          console.error('Erro ao buscar setores:', error);
        }
      }
    };

    fetchSetores();
  }, [isAdmin]);

  const handleSetorSelect = (setor: string | null) => {
    setSelectedSetor(setor);
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
      href: "/relatorios",
      icon: FileSpreadsheet,
      label: "Relatórios",
    },
  ]

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 pt-4 sm:pt-6">
        <div className="px-3 sm:px-4 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-semibold">Painel Gestão</h1>
          {isAdmin === true && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-white/80">Setor:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-8 text-white hover:bg-emerald-700/50 justify-between"
                  >
                    {selectedSetor || "Todos os Setores"}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-56 bg-white max-h-[250px] overflow-y-auto"
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#10b981 transparent'
                  }}
                >
                  <DropdownMenuItem 
                    onClick={() => handleSetorSelect(null)}
                    className="text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800"
                  >
                    Todos os Setores
                  </DropdownMenuItem>
                  {setores.map((setor) => (
                    <DropdownMenuItem 
                      key={setor.id}
                      onClick={() => handleSetorSelect(setor.sigla)}
                      className="text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800"
                    >
                      {setor.sigla}{setor.nome ? ` ${setor.nome}` : ''}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {isAdmin === false && userSetor && (
            <div className="mt-2 text-sm text-white/80">
              Setor: {userSetor}
            </div>
          )}
        </div>
        <nav className="mt-1 sm:mt-2">
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
      {session && (
        <div className="px-3 sm:px-4 py-2 flex justify-center">
          <AuthButton showLogout={true} />
        </div>
      )}
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
            className="w-[280px] p-0 bg-emerald-800 text-white h-full flex flex-col"
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

