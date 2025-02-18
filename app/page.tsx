"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { useTaskStore, type Task } from "@/lib/store"
import { useMemo } from "react"
import { TaskStack } from "@/components/task-stack"
import AuthRequired from "@/components/auth-required"
import { PollingWrapper } from "@/components/polling-wrapper"

function getStatusName(statusId: number): string {
  const statusMap: Record<number, string> = {
    1: "Não iniciada",
    2: "Em desenvolvimento",
    3: "Em testes",
    4: "Concluída",
  }
  return statusMap[statusId] || "Desconhecido"
}

export default function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks)

  const tasksInDevelopment = useMemo(() => {
    const tasksByUser = tasks
      .filter((task) => getStatusName(task.status_id) === "Em desenvolvimento")
      .reduce(
        (acc, task) => {
          if (!task.responsavel_email) return acc
          if (!acc[task.responsavel_email]) {
            acc[task.responsavel_email] = []
          }
          acc[task.responsavel_email].push(task)
          return acc
        },
        {} as Record<string, Task[]>,
      )

    return Object.entries(tasksByUser)
  }, [tasks])

  return (
    <AuthRequired>
      <PollingWrapper>
        <div className="min-h-screen w-full bg-background pt-8 md:pt-0">
          {" "}
          {/* Reduced from pt-14 to pt-12 */}
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-6">
            {" "}
            {/* Reduced py-4 to py-2 */}
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Painel de Controle Kanban</h1>{" "}
            {/* Reduced mb-6 to mb-4 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Distribuição por Etapa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[250px] sm:h-[300px] md:h-[400px]">
                    <PieChart />
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Cards Atribuídos por Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[250px] sm:h-[300px] md:h-[400px]">
                    <RadarChart />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Atividades em Desenvolvimento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasksInDevelopment.map(([email, tasks]) => (
                  <TaskStack key={email} tasks={tasks} responsavelEmail={email} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </PollingWrapper>
    </AuthRequired>
  )
}

