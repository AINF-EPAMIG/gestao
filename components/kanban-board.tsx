"use client"

import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, type Status, type Task, getStatusName, getPriorityName, getResponsavelName, formatHours } from "@/lib/store"
import { useMemo, useCallback, useState, memo, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn, getUserIcon } from "@/lib/utils"
import { TaskDetailsModal } from "@/components/task-details-modal"
import { useInView } from "framer-motion"
import { useRef } from "react"

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
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      <Card
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={cn(
          "p-4 space-y-3 border-l-4 cursor-pointer",
          snapshot.isDragging && "dragging-card",
          getPriorityName(task.prioridade_id) === "Alta"
            ? "border-l-red-500"
            : getPriorityName(task.prioridade_id) === "Média"
            ? "border-l-yellow-500"
            : "border-l-green-500"
        )}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center justify-between">
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
          <Badge variant="outline">
            {task.sistema_nome || `Sistema ${task.sistema_id}`}
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

      <TaskDetailsModal 
        task={task}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
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
  const [visibleTasks, setVisibleTasks] = useState(10)
  const loadMoreRef = useRef(null)
  const isInView = useInView(loadMoreRef, {
    margin: "100px 0px 0px 0px"
  })

  useEffect(() => {
    setVisibleTasks(10)
  }, [column.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInView && visibleTasks < tasks.length) {
        setVisibleTasks(prev => Math.min(prev + 10, tasks.length))
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isInView, tasks.length, visibleTasks])

  const displayedTasks = useMemo(() => {
    return tasks.slice(0, visibleTasks)
  }, [tasks, visibleTasks])

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
            {displayedTasks.map((task, index) => (
              <Draggable 
                key={task.id.toString()} 
                draggableId={task.id.toString()} 
                index={index}
              >
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
            
            {tasks.length > visibleTasks && (
              <div 
                ref={loadMoreRef}
                className="h-10 flex items-center justify-center"
              >
                <div className="animate-spin h-4 w-4 border-2 border-emerald-800 rounded-full border-t-transparent" />
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
});

export function KanbanBoard() {
  const tasks = useTaskStore((state) => state.tasks)
  const updateTaskPosition = useTaskStore((state) => state.updateTaskPosition)

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

      const taskId = parseInt(draggableId, 10)
      const newStatusId = statusMap[destination.droppableId as Status]
      
      updateTaskPosition(taskId, newStatusId, destination.index)
    },
    [updateTaskPosition]
  )

  const columnTasks = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id] = tasks
        .filter(task => getStatusName(task.status_id) === column.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
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
