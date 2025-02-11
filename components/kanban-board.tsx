"use client"

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, type Status, type Task, getStatusName, getPriorityName, getResponsavelName } from "@/lib/store"
import { useMemo, useCallback, useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const columns: { id: Status; title: string }[] = [
  { id: "Não iniciada", title: "Não iniciada" },
  { id: "Em desenvolvimento", title: "Em desenvolvimento" },
  { id: "Em testes", title: "Em testes" },
  { id: "Concluída", title: "Concluída" },
]

const statusMap = {
  "Não iniciada": 1,
  "Em desenvolvimento": 2,
  "Em testes": 3,
  "Concluída": 4,
} as const;

export function KanbanBoard() {
  const tasks = useTaskStore((state) => state.tasks)
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus)

  const columnTasks = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id] = tasks.filter(
        task => getStatusName(task.status_id) === column.id
      )
      return acc
    }, {} as Record<Status, Task[]>)
  }, [tasks])

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result

      if (!destination) return
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return
      }

      const newStatus = statusMap[destination.droppableId as Status]
      updateTaskStatus(draggableId, newStatus)
    },
    [updateTaskStatus]
  )

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{column.title}</h3>
              <Badge variant="secondary">{columnTasks[column.id].length}</Badge>
            </div>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-3 min-h-[200px]"
                >
                  {columnTasks[column.id].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "p-4 space-y-3 border-l-4",
                            getPriorityName(task.prioridade_id) === "Alta"
                              ? "border-l-red-500"
                              : getPriorityName(task.prioridade_id) === "Média"
                              ? "border-l-yellow-500"
                              : "border-l-green-500"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{task.id}</Badge>
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
                          <h4 className="font-medium">{task.titulo}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {task.descricao}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage email={task.responsavel_email} />
                                <AvatarFallback>
                                  {task.responsavel_email ? task.responsavel_email[0].toUpperCase() : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {getResponsavelName(task.responsavel_id, task.responsavel_email)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {task.estimativa_horas ? `${task.estimativa_horas}h` : "Sem estimativa"}
                                </span>
                              </div>
                            </div>
                            {task.data_inicio && (
                              <span className="text-xs text-gray-500">
                                Início: {new Date(task.data_inicio).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

