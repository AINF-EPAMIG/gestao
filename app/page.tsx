"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { TaskCard } from "@/components/task-card"
import { useTaskStore } from "@/lib/store"
import { useMemo } from "react"

export default function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks)

  const displayTasks = useMemo(() => tasks.slice(0, 3), [tasks])

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Painel de Controle Kanban</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cards Atribuídos por Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTasks.map((task) => (
          <TaskCard
            key={task.id}
            user={task.assignee}
            taskId={task.id}
            title={task.title}
            description={task.description}
            system={task.system}
            status={task.status}
            priority={task.priority}
            estimate={task.estimate}
            startDate={task.startDate}
            endDate={task.endDate}
          />
        ))}
      </div>
    </div>
  )
}

