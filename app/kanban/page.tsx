"use client"

// import { useSession } from "next-auth/react"
// import { redirect } from "next/navigation"
import { useEffect } from "react"
import { KanbanBoard } from "@/components/kanban-board"
import { useTaskStore, useTaskPolling } from "@/lib/store"
import { CreateTaskModal } from "@/components/create-task-modal"

export default function KanbanPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const fetchTasks = useTaskStore((state) => state.fetchTasks)
  
  // Ativa o polling
  useTaskPolling();

  // Busca inicial
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Kanban</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">{tasks.length} tarefas</div>
          <CreateTaskModal />
        </div>
      </div>
      <KanbanBoard />
    </div>
  )
}

