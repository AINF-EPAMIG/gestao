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
import { TasksAreaChart } from "@/components/charts/tasks-area-chart"
import { Input } from "@/components/ui/input"
import { getUserIcon } from "@/lib/utils"

export default function RelatoriosPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("todos")
  const [dataInicioFilter, setDataInicioFilter] = useState<string>("")
  const [dataFimFilter, setDataFimFilter] = useState<string>("")

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
      const matchesPrioridade = prioridadeFilter === "todos" || getPriorityName(task.prioridade_id) === prioridadeFilter
      
      const taskDate = task.data_inicio ? new Date(task.data_inicio) : null
      const startDate = dataInicioFilter ? new Date(dataInicioFilter) : null
      const endDate = dataFimFilter ? new Date(dataFimFilter) : null
      
      const matchesDate = !taskDate ? true :
        (!startDate || taskDate >= startDate) &&
        (!endDate || taskDate <= endDate)

      return matchesResponsavel && matchesStatus && matchesPrioridade && matchesDate
    })
  }, [tasks, responsavelFilter, statusFilter, prioridadeFilter, dataInicioFilter, dataFimFilter])

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                      <AvatarImage src={getUserIcon(email)} />
                      <AvatarFallback>{email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    {email?.split('@')[0].split('.').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ') || 'Sem responsável'}
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

        <div>
          <label className="text-sm font-medium">Prioridade</label>
          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Data Início</label>
          <Input
            type="date"
            value={dataInicioFilter}
            onChange={(e) => setDataInicioFilter(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Data Fim</label>
          <Input
            type="date"
            value={dataFimFilter}
            onChange={(e) => setDataFimFilter(e.target.value)}
          />
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Evolução de Tarefas por Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <TasksAreaChart tasks={filteredTasks} />
        </CardContent>
      </Card>

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