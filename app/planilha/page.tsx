"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, getStatusName, getPriorityName, getResponsavelName } from "@/lib/store"

function formatDate(dateString: string | null) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export default function PlanilhaPage() {
  const tasks = useTaskStore((state) => state.tasks)

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Planilha de Atividades</h1>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="whitespace-nowrap">Título</TableHead>
                  <TableHead className="whitespace-nowrap">Responsável</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Prioridade</TableHead>
                  <TableHead className="whitespace-nowrap">Sistema</TableHead>
                  <TableHead className="whitespace-nowrap">Estimativa</TableHead>
                  <TableHead className="whitespace-nowrap">Data de Início</TableHead>
                  <TableHead className="whitespace-nowrap">Data de Fim</TableHead>
                  <TableHead className="whitespace-nowrap">ID da Release</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium whitespace-nowrap">{task.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{task.titulo}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getResponsavelName(task.responsavel_id)}
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
                    <TableCell className="whitespace-nowrap">Sistema {task.sistema_id}</TableCell>
                    <TableCell className="whitespace-nowrap">{task.estimativa_horas || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(task.data_inicio)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(task.data_fim)}</TableCell>
                    <TableCell className="whitespace-nowrap">{task.id_release || "-"}</TableCell>
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

