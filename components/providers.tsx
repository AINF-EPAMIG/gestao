"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"
import io from "socket.io-client"
import { useTaskStore } from "@/lib/store"

let socket: any

export function Providers({ children }: { children: React.ReactNode }) {
  const setTasks = useTaskStore((state) => state.setTasks)

  useEffect(() => {
    // Inicializa o socket
    const initSocket = async () => {
      await fetch('/api/socket')
      socket = io()

      // Escuta por atualizações
      socket.on('tasksUpdated', (updatedTasks: any) => {
        setTasks(updatedTasks)
      })
    }

    initSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [setTasks])

  return <SessionProvider>{children}</SessionProvider>
} 