"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Task } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getStatusName, getPriorityName, formatHours } from "@/lib/store"

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.id}</TableCell>
              <TableCell>{task.titulo}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`/avatars/${task.responsavel_email}.jpg`} />
                    <AvatarFallback>
                      {task.responsavel_email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {task.responsavel_email?.split('@')[0].replace('.', ' ')}
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
              <TableCell>{task.sistema_nome}</TableCell>
              <TableCell>{formatHours(task.estimativa_horas)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 