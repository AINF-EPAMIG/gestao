"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTaskStore } from "@/lib/store"

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
                    <TableCell className="max-w-[200px] truncate">{task.title}</TableCell>
                    <TableCell className="whitespace-nowrap">{task.assignee}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">{task.status}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        className={
                          task.priority === "Alta"
                            ? "bg-red-500"
                            : task.priority === "Média"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{task.system}</TableCell>
                    <TableCell className="whitespace-nowrap">{task.estimate}</TableCell>
                    <TableCell className="whitespace-nowrap">{task.startDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{task.endDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{task.releaseId}</TableCell>
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

