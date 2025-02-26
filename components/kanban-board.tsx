"use client"

import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, type Status, type Task, getStatusName, getPriorityName, formatHours } from "@/lib/store"
import { useMemo, useCallback, useState, memo, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn, getUserIcon } from "@/lib/utils"
import { TaskDetailsModal } from "@/components/task-details-modal"

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
  provided,
  snapshot 
}: { 
  task: Task; 
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}) {
  const [showDetails, setShowDetails] = useState(false)

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return null;
    
    const date = new Date(dateTime);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    
    // Formatação da hora
    const hora = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });

    // Compara as datas usando o método de comparação por dia
    const ehHoje = date.getUTCDate() === hoje.getDate() && 
                  date.getUTCMonth() === hoje.getMonth() && 
                  date.getUTCFullYear() === hoje.getFullYear();
                  
    const ehOntem = date.getUTCDate() === ontem.getDate() && 
                   date.getUTCMonth() === ontem.getMonth() && 
                   date.getUTCFullYear() === ontem.getFullYear();
    
    if (ehHoje) {
      return `Atualizado Hoje às ${hora}`;
    }
    
    if (ehOntem) {
      return `Atualizado Ontem às ${hora}`;
    }
    
    // Caso contrário, retorna a data completa
    const dataFormatada = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    });
    
    return `Atualizado Em ${dataFormatada} às ${hora}`;
  };

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
            {task.projeto_nome || (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}
          </Badge>
        </div>
        <h4 className="font-medium">{task.titulo}</h4>
        <p className="text-sm text-gray-500 line-clamp-2">
          {task.descricao}
        </p>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {(task.responsaveis ?? []).map(resp => (
                <MemoizedAvatar key={resp.email} email={resp.email} />
              ))}
              {!(task.responsaveis ?? []).length && <MemoizedAvatar />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {(task.responsaveis ?? []).length > 0 
                  ? (task.responsaveis ?? []).map(r => {
                      const displayName = r.nome 
                        ? r.nome.split(' ')[0] 
                        : r.email.split('@')[0].split('.')[0];
                      return displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
                    }).join(', ')
                  : 'Não atribuído'
                }
              </span>
              {task.estimativa_horas && Number(task.estimativa_horas) > 0 && (
                <span className="text-xs text-gray-500">
                  {formatHours(task.estimativa_horas)}
                </span>
              )}
            </div>
          </div>
          {task.ultima_atualizacao && (
            <span className="text-xs text-gray-500">
              {formatDateTime(task.ultima_atualizacao)}
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
              <Draggable 
                key={task.id.toString()} 
                draggableId={task.id.toString()} 
                index={index}
              >
                {(provided, snapshot) => (
                  <TaskCard 
                    task={task} 
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

interface KanbanBoardProps {
  tasks: Task[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const updateTaskPosition = useTaskStore((state) => state.updateTaskPosition)
  const [localTasks, setLocalTasks] = useState<Task[]>([])

  // Atualiza o estado local quando as tarefas mudam
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Se não houver destino ou se o item foi solto no mesmo lugar, não faz nada
    if (!destination) {
      return;
    }
    
    const taskId = parseInt(draggableId);
    const newStatusId = statusMap[destination.droppableId as Status];
    const sourceStatusId = statusMap[source.droppableId as Status];
    
    // Cria uma cópia das tarefas para manipulação local
    const updatedTasks = [...localTasks];
    
    // Encontra a tarefa que está sendo movida
    const taskToMove = updatedTasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    
    // Se estiver movendo dentro do mesmo status, apenas reordena
    if (source.droppableId === destination.droppableId) {
      // Obtém todas as tarefas do mesmo status
      const tasksInSameStatus = updatedTasks
        .filter(t => getStatusName(t.status_id) === destination.droppableId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Remove a tarefa da posição atual
      const reorderedTasks = tasksInSameStatus.filter(t => t.id !== taskId);
      
      // Insere a tarefa na nova posição
      reorderedTasks.splice(destination.index, 0, taskToMove);
      
      // Atualiza as posições de todas as tarefas
      reorderedTasks.forEach((task, index) => {
        task.position = index;
        
        // Se a posição mudou, atualiza no banco de dados
        if (task.id === taskId || index !== tasksInSameStatus.findIndex(t => t.id === task.id)) {
          // Passa false para indicar que não deve atualizar a data
          updateTaskPosition(task.id, task.status_id, index, false);
        }
      });
      
      // Atualiza o estado local para refletir a mudança imediatamente
      setLocalTasks(updatedTasks);
    } else {
      // Se estiver mudando de status, atualiza o status e a posição
      // Passa true para indicar que deve atualizar a data (mudança de status)
      updateTaskPosition(taskId, newStatusId, destination.index, true);
      
      // Atualiza o estado local para refletir a mudança imediatamente
      taskToMove.status_id = newStatusId;
      taskToMove.position = destination.index;
      
      // Reordena as tarefas do status de origem
      const tasksInSourceStatus = updatedTasks
        .filter(t => t.id !== taskId && getStatusName(t.status_id) === source.droppableId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Atualiza as posições das tarefas no status de origem
      tasksInSourceStatus.forEach((task, index) => {
        if (task.position !== index) {
          task.position = index;
          // Passa false para indicar que não deve atualizar a data
          updateTaskPosition(task.id, sourceStatusId, index, false);
        }
      });
      
      // Reordena as tarefas do status de destino
      const tasksInDestStatus = updatedTasks
        .filter(t => t.id !== taskId && getStatusName(t.status_id) === destination.droppableId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Insere a tarefa na nova posição
      tasksInDestStatus.splice(destination.index, 0, taskToMove);
      
      // Atualiza as posições das tarefas no status de destino
      tasksInDestStatus.forEach((task, index) => {
        if (task.position !== index) {
          task.position = index;
          // Passa false para indicar que não deve atualizar a data
          updateTaskPosition(task.id, newStatusId, index, false);
        }
      });
      
      setLocalTasks(updatedTasks);
    }
  }, [updateTaskPosition, localTasks]);

  const columnTasks = useMemo(() => {
    return columns.reduce((acc, column) => {
      // Usa as tarefas locais para renderização imediata
      acc[column.id] = localTasks
        .filter(task => getStatusName(task.status_id) === column.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      return acc;
    }, {} as Record<Status, Task[]>);
  }, [localTasks]);

  // Se estiver carregando, mostra um estado de loading
  if (tasks.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{column.title}</h3>
              <Badge variant="secondary">...</Badge>
            </div>
            <div className="flex flex-col gap-3 min-h-[200px] animate-pulse bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

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
  );
}
