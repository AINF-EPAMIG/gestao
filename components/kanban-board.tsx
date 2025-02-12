"use client"

import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, type Status, type Task, getStatusName, getPriorityName, getResponsavelName, formatHours } from "@/lib/store"
import { useMemo, useCallback, useState, memo, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn, getUserIcon } from "@/lib/utils"

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

const MemoizedAvatar = memo(function MemoizedAvatar({ email }: { email?: string }) {
  return (
    <Avatar className="w-8 h-8">
      <AvatarImage src={getUserIcon(email)} />
      <AvatarFallback>
        {email ? email[0].toUpperCase() : '?'}
      </AvatarFallback>
    </Avatar>
  )
})

// Componente TaskCard extraído e memoizado
const TaskCard = memo(function TaskCard({ 
  task, 
  index,
  provided,
  snapshot 
}: { 
  task: Task; 
  index: number;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}) {
  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "p-4 space-y-3 border-l-4",
        snapshot.isDragging && "dragging-card",
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
          <MemoizedAvatar email={task.responsavel_email} />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {getResponsavelName(task.responsavel_id, task.responsavel_email)}
            </span>
            <span className="text-xs text-gray-500">
              {formatHours(task.estimativa_horas)}
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
  );
});

// Componente Column extraído e memoizado
const Column = memo(function Column({
  column,
  tasks
}: {
  column: { id: Status; title: string };
  tasks: Task[];
}) {
  return (
    <div key={column.id} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{column.title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <Droppable droppableId={column.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-3 min-h-[200px]"
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <TaskCard 
                    task={task} 
                    index={index} 
                    provided={provided}
                    snapshot={snapshot}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});

export function KanbanBoard() {
  const tasks = useTaskStore((state) => state.tasks)
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus)
  const syncPendingChanges = useTaskStore((state) => state.syncPendingChanges)

  // Tenta sincronizar a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      syncPendingChanges()
    }, 30000)

    return () => clearInterval(interval)
  }, [syncPendingChanges])

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
      
      // Adiciona o destination.index como terceiro argumento
      updateTaskStatus(draggableId, newStatus, destination.index)
      
      useTaskStore.getState().reorderTasks(
        source.droppableId as Status,
        destination.droppableId as Status,
        draggableId,
        destination.index
      )
    },
    [updateTaskStatus]
  )

  const columnTasks = useMemo(() => {
    return columns.reduce((acc, column) => {
      // Filtra e ordena os cards por ordem personalizada
      acc[column.id] = tasks
        .filter(task => getStatusName(task.status_id) === column.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      return acc
    }, {} as Record<Status, Task[]>)
  }, [tasks])

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <Column 
            key={column.id}
            column={column}
            tasks={columnTasks[column.id]}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
