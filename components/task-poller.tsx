"use client"

import { useEffect } from "react"
import { useTaskStore } from "@/lib/store"

export function TaskPoller() {
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