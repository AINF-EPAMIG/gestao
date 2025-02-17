"use client"

// import { useSession } from "next-auth/react"
// import { redirect } from "next/navigation"
import { useEffect } from "react"
import { PollingWrapper } from "@/components/polling-wrapper"
import { KanbanBoard } from "@/components/kanban-board"
import { useTaskStore } from "@/lib/store"
import { CreateTaskModal } from "@/components/create-task-modal"

export default function KanbanPage() {
  const tasks = useTaskStore((state) => state.tasks)

  return (
    <PollingWrapper>
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
    </PollingWrapper>
  )
}

