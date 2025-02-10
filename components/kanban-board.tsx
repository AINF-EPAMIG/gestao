"use client"

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, type Status, type Task } from "@/lib/store"
import { useMemo, useCallback, useState } from "react"

const columns: { id: Status; title: string }[] = [
  { id: "Não iniciada", title: "Não iniciada" },
  { id: "Em desenvolvimento", title: "Em desenvolvimento" },
  { id: "Em testes", title: "Em testes" },
  { id: "Concluída", title: "Concluída" },
]

export function KanbanBoard() {
  const { tasks, updateTaskStatus } = useTaskStore()
  const [localTasks, setLocalTasks] = useState(tasks)

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result

      if (!destination) return

      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return
      }

      const newStatus = destination.droppableId as Status

      // Update local state immediately
      setLocalTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === draggableId ? { ...task, status: newStatus } : task)),
      )

      // Update global state
      updateTaskStatus(draggableId, newStatus)
    },
    [updateTaskStatus],
  )

  const columnTasks = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.id] = localTasks.filter((task) => task.status === column.id)
        return acc
      },
      {} as Record<Status, Task[]>,
    )
  }, [localTasks])

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
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3 min-h-[200px]">
                  {columnTasks[column.id].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{task.id}</Badge>
                            <Badge
                              className={
                                task.priority === "Alta"
                                  ? "bg-red-500"
                                  : task.priority === "Média"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }
                            >
                              {task.system}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                {task.assigneeId}
                              </div>
                            </div>
                            <span className="text-gray-500">{task.estimate}</span>
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

