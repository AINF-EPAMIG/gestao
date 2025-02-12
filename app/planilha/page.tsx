"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, getStatusName, getPriorityName, formatHours } from "@/lib/store"
import { useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CreateTaskModal } from "@/components/create-task-modal"

const STATUS_COLORS = {
  "Desenvolvimento": "bg-blue-500",
  "Não iniciada": "bg-orange-500",
  "Concluída": "bg-emerald-500",
  "Em testes": "bg-amber-500",
} as const;

function formatStatusName(statusId: number): string {
  const status = getStatusName(statusId);
  return status === "Em desenvolvimento" ? "Desenvolvimento" : status;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('pt-BR');
}

export default function PlanilhaPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const setTasks = useTaskStore((state) => state.setTasks)

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

  function getResponsavelName(responsavelId: number | null, email?: string): string {
    if (!responsavelId || !email) return "Não atribuído";
    return email.split('@')[0].replace('.', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Planilha</h1>
        <CreateTaskModal />
      </div>
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <p className="text-muted-foreground">
              Lista completa de todas as atividades do sistema
            </p>
          </div>
        </div>
        <div className="border rounded-md">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="min-w-[200px]">Título</TableHead>
                  <TableHead className="min-w-[180px]">Responsável</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Prioridade</TableHead>
                  <TableHead className="min-w-[150px]">Sistema</TableHead>
                  <TableHead className="min-w-[100px]">Estimativa</TableHead>
                  <TableHead className="min-w-[120px]">Data de Início</TableHead>
                  <TableHead className="min-w-[120px]">Data de Fim</TableHead>
                  <TableHead className="min-w-[100px]">ID Release</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.id}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {task.titulo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage email={task.responsavel_email} />
                          <AvatarFallback>
                            {task.responsavel_email ? task.responsavel_email[0].toUpperCase() : '?'}
                          </AvatarFallback>
                        </Avatar>
                        {getResponsavelName(task.responsavel_id, task.responsavel_email)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={STATUS_COLORS[formatStatusName(task.status_id) as keyof typeof STATUS_COLORS]}
                      >
                        {formatStatusName(task.status_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          getPriorityName(task.prioridade_id) === "Alta"
                            ? "text-red-500 border-red-200"
                            : getPriorityName(task.prioridade_id) === "Média"
                            ? "text-yellow-600 border-yellow-200"
                            : "text-green-500 border-green-200"
                        }
                      >
                        {getPriorityName(task.prioridade_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.sistema_nome || `Sistema ${task.sistema_id}`}</TableCell>
                    <TableCell>{formatHours(task.estimativa_horas)}</TableCell>
                    <TableCell>{formatDate(task.data_inicio)}</TableCell>
                    <TableCell>{formatDate(task.data_fim)}</TableCell>
                    <TableCell>{task.id_release || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

