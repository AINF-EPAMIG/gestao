"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { TaskCard } from "@/components/task-card"
import { Task, useTaskStore } from "@/lib/store"
import { useMemo, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

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

function getResponsavelName(responsavelId: number | null, email?: string): string {
  if (!responsavelId || !email) return "Não atribuído";
  return email.split('@')[0].replace('.', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const setTasks = useTaskStore((state) => state.setTasks)

  const responsavelTasks = useMemo(() => {
    const emDesenvolvimento = tasks.filter(task => task.status_id === 2); // Status "Em desenvolvimento"
    
    // Agrupa por responsável
    const tasksByResponsavel = emDesenvolvimento.reduce((acc, task) => {
      if (task.responsavel_email) {
        if (!acc[task.responsavel_email]) {
          acc[task.responsavel_email] = [];
        }
        acc[task.responsavel_email].push(task);
      }
      return acc;
    }, {} as Record<string, Task[]>);

    // Pega apenas a tarefa mais recente de cada responsável
    return Object.entries(tasksByResponsavel).map(([email, tasks]) => ({
      email,
      task: tasks[0] // Primeira tarefa do responsável
    }));
  }, [tasks]);

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

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Atividades em Desenvolvimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {responsavelTasks.map(({ email, task }) => (
            <Card key={email} className="flex items-start p-4 space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage email={email} />
                <AvatarFallback>
                  {email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">
                      {email.split('@')[0].replace('.', ' ')}
                    </h3>
                    <Badge variant="outline">
                      {task.sistema_nome || `Sistema ${task.sistema_id}`}
                    </Badge>
                  </div>
                  <Badge
                    className={
                      getPriorityName(task.prioridade_id) === "Alta"
                        ? "bg-red-500"
                        : getPriorityName(task.prioridade_id) === "Média"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }
                  >
                    {getPriorityName(task.prioridade_id)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {task.descricao || "Sem descrição"}
                </p>
                <div className="text-sm text-gray-500">
                  {task.estimativa_horas ? `${task.estimativa_horas}h` : "Sem estimativa"}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

