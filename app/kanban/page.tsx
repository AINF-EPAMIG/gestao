"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { KanbanBoard } from "@/components/kanban-board"

export default function KanbanPage() {
  const { data: session } = useSession()

  if (!session) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Kanban</h1>
        <div className="text-sm text-gray-500">8 tarefas</div>
      </div>
      <KanbanBoard />
    </div>
  )
}

