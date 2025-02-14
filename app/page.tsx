"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { TaskCard } from "@/components/task-card"
import { Task, useTaskStore } from "@/lib/store"
import { useMemo, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatHours } from "@/lib/store"
import { TaskStack } from "@/components/task-stack"

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

  const tasksInDevelopment = useMemo(() => {
    const tasksByUser = tasks
      .filter(task => getStatusName(task.status_id) === "Em desenvolvimento")
      .reduce((acc, task) => {
        if (!task.responsavel_email) return acc
        if (!acc[task.responsavel_email]) {
          acc[task.responsavel_email] = []
        }
        acc[task.responsavel_email].push(task)
        return acc
      }, {} as Record<string, Task[]>)

    return Object.entries(tasksByUser)
  }, [tasks])

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
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Painel de Controle Kanban</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle>Distribuição por Etapa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PieChart />
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle>Cards Atribuídos por Usuário</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RadarChart />
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Atividades em Desenvolvimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasksInDevelopment.map(([email, tasks]) => (
            <TaskStack 
              key={email} 
              tasks={tasks}
              responsavelEmail={email}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

