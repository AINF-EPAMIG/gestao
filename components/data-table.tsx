"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Task } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getStatusName, getPriorityName, formatHours } from "@/lib/store"
import { getUserIcon } from "@/lib/utils"
import { getResponsavelName } from '@/lib/utils'

interface DataTableProps {
  tasks: Task[]
}

export function DataTable({ tasks }: DataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Sistema</TableHead>
            <TableHead>Estimativa</TableHead>
            <TableHead>Última Atualização</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.id}</TableCell>
              <TableCell>{task.titulo}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {(task.responsaveis ?? []).map(resp => (
                      <Avatar key={resp.email} className="h-6 w-6 border-2 border-white">
                        <AvatarImage src={getUserIcon(resp.email)} />
                        <AvatarFallback>
                          {resp.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {!(task.responsaveis ?? []).length && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <span>
                    {(task.responsaveis ?? []).length > 0 
                      ? (task.responsaveis ?? []).map(r => getResponsavelName(r.email)).join(', ')
                      : 'Não atribuído'
                    }
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge>{getStatusName(task.status_id)}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    getPriorityName(task.prioridade_id) === "Alta"
                      ? "border-red-500 text-red-500"
                      : getPriorityName(task.prioridade_id) === "Média"
                      ? "border-yellow-500 text-yellow-500"
                      : "border-green-500 text-green-500"
                  }
                >
                  {getPriorityName(task.prioridade_id)}
                </Badge>
              </TableCell>
              <TableCell>{task.projeto_nome || `Projeto ${task.projeto_id}`}</TableCell>
              <TableCell>{formatHours(task.estimativa_horas)}</TableCell>
              <TableCell>
                {task.ultima_atualizacao 
                  ? new Date(task.ultima_atualizacao).toLocaleString('pt-BR')
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 
