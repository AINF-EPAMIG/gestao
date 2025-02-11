"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { TaskCard } from "@/components/task-card"
import { useTaskStore } from "@/lib/store"
import { useMemo, useEffect } from "react"

function getStatusName(statusId: number): string {
  const statusMap: Record<number, string> = {
    1: "Não iniciada",
    2: "Em desenvolvimento",
    3: "Em testes",
    4: "Concluída"
  }
  return statusMap[statusId] || "Desconhecido"
}

function getPriorityName(priorityId: number): "Alta" | "Média" | "Baixa" {
  const priorityMap: Record<number, "Alta" | "Média" | "Baixa"> = {
    1: "Alta",
    2: "Média",
    3: "Baixa"
  }
  return priorityMap[priorityId] || "Média"
}

function getResponsavelName(responsavelId: number | null): string {
  if (!responsavelId) return "Não atribuído"
  const responsavelMap: Record<number, string> = {
    1: "Responsável 1",
    2: "Responsável 2",
    // Adicione mais responsáveis conforme necessário
  }
  return responsavelMap[responsavelId] || `Responsável ${responsavelId}`
}

export default function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const setTasks = useTaskStore((state) => state.setTasks)

  const displayTasks = useMemo(() => tasks.slice(0, 3), [tasks])

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch('/api/atividades')
        if (!response.ok) throw new Error('Falha ao carregar dados')
        const data = await response.json()
        setTasks(data)
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error)
      }
    }

    fetchTasks()
  }, [setTasks])

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
            user={getResponsavelName(task.responsavel_id)}
            email={task.responsavel_email || ''}
            taskId={task.id}
            title={task.titulo}
            description={task.descricao}
            system={String(task.sistema_id)}
            status={getStatusName(task.status_id)}
            priority={getPriorityName(task.prioridade_id)}
            estimate={task.estimativa_horas || ""}
            startDate={task.data_inicio || ""}
            endDate={task.data_fim || ""}
          />
        ))}
      </div>
    </div>
  )
}

