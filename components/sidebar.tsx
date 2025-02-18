"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, KanbanSquare, FileSpreadsheet, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Footer } from "./footer"
import { useSession } from "next-auth/react"
import { AuthButton } from "@/components/auth-button"

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const session = useSession()

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
      href: "/relatorios",
      icon: FileSpreadsheet,
      label: "Relatórios",
    },
  ]

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 pt-4 sm:pt-6">
        <h1 className="text-lg sm:text-xl font-semibold px-3 sm:px-4 mb-4 sm:mb-6">Painel Gestão</h1>
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
      <div className="px-3 sm:px-4 py-2 flex justify-center">
        <AuthButton />
      </div>
      <Footer />
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full h-14">
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
      <div className="hidden md:block">
        <div className="fixed top-4 bottom-4 left-4 w-64 bg-emerald-800 text-white rounded-2xl shadow-lg">
          <NavContent />
        </div>
        {/* Spacer div para empurrar o conteúdo principal */}
        <div className="w-[280px] shrink-0" /> {/* 256px (sidebar) + 24px (left margin) */}
      </div>
    </>
  )
}

