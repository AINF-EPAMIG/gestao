"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, KanbanSquare, FileSpreadsheet, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
      adminOnly: false
    },
    {
      href: "/kanban",
      icon: KanbanSquare,
      label: "Kanban",
      adminOnly: true
    },
    {
      href: "/planilha",
      icon: FileSpreadsheet,
      label: "Planilha",
      adminOnly: true
    },
  ]

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 pt-6">
        <h1 className="text-xl font-semibold px-4 mb-6">Painel Gestão</h1>
        <nav className="mt-2">
          {navigation.map((item) => {
            if (item.adminOnly && !session.data?.user?.isAdmin) return null
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 transition-colors",
                  "hover:bg-emerald-700/50",
                  pathname === item.href && "bg-emerald-700",
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
      <div className="px-4 py-2 flex justify-center">
        <AuthButton />
      </div>
      <Footer />
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-4">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-emerald-800 text-white">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <div className="fixed top-4 bottom-4 left-0 w-64 bg-emerald-800 text-white rounded-2xl">
          <NavContent />
        </div>
        {/* Spacer div para empurrar o conteúdo principal */}
        <div className="w-[272px] shrink-0" /> {/* 64px (sidebar) + 16px (left margin) */}
      </div>
    </>
  )
}

