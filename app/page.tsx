"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { useTaskStore, type Task } from "@/lib/store"
import { useMemo, useState, useEffect } from "react"
import { TaskStack } from "@/components/task-stack"
import AuthRequired from "@/components/auth-required"
import { PollingWrapper } from "@/components/polling-wrapper"
import { Loader2 } from "lucide-react"

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
  const [isLoading, setIsLoading] = useState(true)

  // Efeito para controlar o estado de carregamento
  useEffect(() => {
    if (tasks.length > 0) {
      // Quando as tarefas são carregadas, desativa o loader
      setIsLoading(false)
    }
  }, [tasks])

  const tasksInDevelopment = useMemo(() => {
    const tasksByUser = tasks
      .filter((task) => getStatusName(task.status_id) === "Em desenvolvimento")
      .reduce((acc, task) => {
        // Para cada responsável da tarefa
        (task.responsaveis ?? []).forEach(responsavel => {
          if (!acc[responsavel.email]) {
            acc[responsavel.email] = [];
          }
          acc[responsavel.email].push(task);
        });
        return acc;
      }, {} as Record<string, Task[]>);

    return Object.entries(tasksByUser);
  }, [tasks]);

  return (
    <AuthRequired>
      <PollingWrapper>
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="min-h-screen w-full bg-background pt-8 lg:pt-0">
            <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-6">
              <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">Painel de Controle Kanban</h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg lg:text-xl">Distribuição por Etapa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-[250px] sm:h-[300px] lg:h-[400px]">
                      <PieChart />
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg lg:text-xl">Cards Atribuídos por Usuário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-[250px] sm:h-[300px] lg:h-[400px]">
                      <RadarChart />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">Atividades em Desenvolvimento</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tasksInDevelopment.map(([email, tasks]) => (
                    <TaskStack key={email} tasks={tasks} responsavelEmail={email} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </PollingWrapper>
    </AuthRequired>
  )
}

