"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskStore, getStatusName, getPriorityName } from "@/lib/store"
import { TasksBarChart } from "@/components/charts/tasks-bar-chart"
import { TasksPieChart } from "@/components/charts/tasks-pie-chart"
import { DataTable } from "@/components/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function RelatoriosPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos")
  const [statusFilter, setStatusFilter] = useState<string>("todos")

  // Obter lista única de responsáveis
  const responsaveis = useMemo(() => {
    const uniqueResponsaveis = new Set(
      tasks
        .filter(task => task.responsavel_email)
        .map(task => task.responsavel_email)
    )
    return Array.from(uniqueResponsaveis)
  }, [tasks])

  // Filtrar tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesResponsavel = responsavelFilter === "todos" || task.responsavel_email === responsavelFilter
      const matchesStatus = statusFilter === "todos" || getStatusName(task.status_id) === statusFilter
      return matchesResponsavel && matchesStatus
    })
  }, [tasks, responsavelFilter, statusFilter])

  // Dados para os gráficos
  const chartData = useMemo(() => {
    const statusCount = filteredTasks.reduce((acc, task) => {
      const status = getStatusName(task.status_id)
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }))
  }, [filteredTasks])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Relatórios</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium">Responsável</label>
          <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {responsaveis.map((email) => (
                <SelectItem key={email} value={email || ''}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`/avatars/${email}.jpg`} />
                      <AvatarFallback>{email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    {email?.split('@')[0].replace('.', ' ') || 'Sem responsável'}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Não iniciada">Não iniciada</SelectItem>
              <SelectItem value="Em desenvolvimento">Em desenvolvimento</SelectItem>
              <SelectItem value="Em testes">Em testes</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksPieChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarefas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksBarChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable tasks={filteredTasks} />
        </CardContent>
      </Card>
    </div>
  )
} 