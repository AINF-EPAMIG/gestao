"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, getStatusName, getPriorityName } from "@/lib/store"
import { useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
      <div className="rounded-md border max-h-[calc(100vh-8rem)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              <TableHead className="font-medium">ID</TableHead>
              <TableHead className="font-medium">Título</TableHead>
              <TableHead className="font-medium">Responsável</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Prioridade</TableHead>
              <TableHead className="font-medium">Sistema</TableHead>
              <TableHead className="font-medium">Estimativa</TableHead>
              <TableHead className="font-medium">Data de Início</TableHead>
              <TableHead className="font-medium">Data de Fim</TableHead>
              <TableHead className="font-medium">ID da Release</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium whitespace-nowrap">{task.id}</TableCell>
                <TableCell className="max-w-[200px] truncate">{task.titulo}</TableCell>
                <TableCell className="whitespace-nowrap">
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
                <TableCell className="whitespace-nowrap">
                  <Badge variant="outline">{getStatusName(task.status_id)}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
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
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {task.sistema_nome || `Sistema ${task.sistema_id}`}
                </TableCell>
                <TableCell className="whitespace-nowrap">{task.estimativa_horas || "-"}</TableCell>
                <TableCell className="whitespace-nowrap">{task.data_inicio || "-"}</TableCell>
                <TableCell className="whitespace-nowrap">{task.data_fim || "-"}</TableCell>
                <TableCell className="whitespace-nowrap">{task.id_release || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

