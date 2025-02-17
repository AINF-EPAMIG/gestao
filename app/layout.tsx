import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import type React from "react"
import { Providers } from "@/components/providers"
import { useEffect } from "react"
import { useTaskStore } from "@/lib/store"

export const metadata: Metadata = {
  title: "Painel Gestão",
  description: "Sistema de gerenciamento de tarefas Kanban",
}

// Componente para gerenciar o polling
function TaskPoller() {
  const setTasks = useTaskStore((state) => state.setTasks)
  const lastUpdate = useTaskStore((state) => state.lastUpdate)
  const setLastUpdate = useTaskStore((state) => state.setLastUpdate)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch('/api/atividades', {
          headers: lastUpdate ? {
            'If-Modified-Since': lastUpdate
          } : {}
        })
        
        if (response.status === 304) {
          // Não houve modificações
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          setTasks(data)
          setLastUpdate(new Date().toISOString())
        }
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error)
      }
    }

    fetchTasks()
    const interval = setInterval(fetchTasks, 60000)
    return () => clearInterval(interval)
  }, [setTasks, lastUpdate, setLastUpdate])

  return null
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={GeistSans.className}>
        <Providers>
          <TaskPoller />
          <div className="flex min-h-screen bg-white">
            <Sidebar />
            <main className="flex-1 p-4">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}

