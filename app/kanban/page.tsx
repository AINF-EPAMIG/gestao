"use client"
import { PollingWrapper } from "@/components/polling-wrapper"
import { KanbanBoard } from "@/components/kanban-board"
import { useTaskStore } from "@/lib/store"
import { CreateTaskModal } from "@/components/create-task-modal"

export default function KanbanPage() {
  const tasks = useTaskStore((state) => state.tasks)

  return (
    <PollingWrapper>
      <div className="p-3 sm:p-4 md:p-8 pt-12 md:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Kanban</h1>
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="text-sm text-gray-500 md:mt-6">{tasks.length} tarefas</div>
          <CreateTaskModal />
        </div>
        <KanbanBoard />
      </div>
    </PollingWrapper>
  )
}

