"use client"

import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, type Status, type Task, getStatusName, getPriorityName, formatHours } from "@/lib/store"
import { useMemo, useCallback, useState, memo, useEffect, useRef } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn, getResponsavelName } from "@/lib/utils"
import { TaskDetailsModal } from "@/components/task-details-modal"
import { Loader2, Clock, Users } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

const statusColors = {
  "Não iniciada": "border-l-red-500",
  "Em desenvolvimento": "border-l-blue-500",
  "Em testes": "border-l-yellow-400",
  "Concluída": "border-l-emerald-500",
} as const;

const statusTitleColors = {
  "Não iniciada": "text-red-700 bg-red-50 px-2 py-1 rounded",
  "Em desenvolvimento": "text-blue-700 bg-blue-50 px-2 py-1 rounded",
  "Em testes": "text-yellow-700 bg-yellow-50 px-2 py-1 rounded",
  "Concluída": "text-emerald-700 bg-emerald-50 px-2 py-1 rounded",
} as const;

const MemoizedAvatar = memo(function MemoizedAvatar({ email }: { email?: string }) {
  return (
    <Avatar className="w-8 h-8">
      <AvatarImage email={email} />
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
  const [isLoading, setIsLoading] = useState(false)
  const previousStatusRef = useRef<number>(task.status_id)
  const previousUpdateRef = useRef<string | null>(task.ultima_atualizacao)

  // Efeito para detectar mudanças de status e mostrar o loader
  useEffect(() => {
    // Se o status mudou ou a data de atualização mudou
    if (previousStatusRef.current !== task.status_id || 
        previousUpdateRef.current !== task.ultima_atualizacao) {
      
      // Só mostra o loader se a data de atualização mudou (indicando mudança real de status)
      if (previousUpdateRef.current !== task.ultima_atualizacao) {
        setIsLoading(true)
        
        // Simula um tempo de carregamento de 2 segundos
        const timer = setTimeout(() => {
          setIsLoading(false)
        }, 1000)
        
        return () => clearTimeout(timer)
      }
      
      // Atualiza as referências
      previousStatusRef.current = task.status_id
      previousUpdateRef.current = task.ultima_atualizacao
    }
  }, [task.status_id, task.ultima_atualizacao])

  const formatDateTimeCompact = (dateTime: string | null) => {
    if (!dateTime) return null;
    
    try {
      // Analisa a string ISO diretamente para extrair os componentes
      const [datePart, timePart] = dateTime.split('T');
      if (!datePart || !timePart) return dateTime; // Formato não reconhecido, retorna como está
      
      // Extrai ano, mês, dia, hora e minuto diretamente da string
      const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
      const [hourPart] = timePart.split('.');
      const [hour, minute] = hourPart.split(':').map(num => parseInt(num, 10));
      
      // Formata a hora sem conversões
      const hora = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Verifica se é hoje ou ontem
      const hoje = new Date();
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      
      const dataAtual = new Date();
      dataAtual.setFullYear(year);
      dataAtual.setMonth(month - 1); // Mês em JavaScript é 0-indexed
      dataAtual.setDate(day);
      
      const ehHoje = dataAtual.getDate() === hoje.getDate() && 
                  dataAtual.getMonth() === hoje.getMonth() && 
                  dataAtual.getFullYear() === hoje.getFullYear();
                  
      const ehOntem = dataAtual.getDate() === ontem.getDate() && 
                   dataAtual.getMonth() === ontem.getMonth() && 
                   dataAtual.getFullYear() === ontem.getFullYear();
      
      if (ehHoje) {
        return `Hoje ${hora}`;
      }
      
      if (ehOntem) {
        return `Ontem ${hora}`;
      }
      
      // Caso contrário, retorna a data abreviada
      const dataFormatada = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
      
      return `${dataFormatada} ${hora}`;
    } catch (error) {
      console.error('Erro ao formatar data compacta:', error);
      return dateTime; // Em caso de erro, retorna o valor original
    }
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
          statusColors[getStatusName(task.status_id) as keyof typeof statusColors]
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
          <Badge variant="outline" title={task.projeto_nome || (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}>
            {task.projeto_nome 
              ? (task.projeto_nome.length > 15 ? `${task.projeto_nome.slice(0, 15)}...` : task.projeto_nome)
              : (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}
          </Badge>
        </div>
        <h4 className="font-medium truncate" title={task.titulo}>{task.titulo}</h4>
        <p className="text-sm text-gray-500 line-clamp-2" title={task.descricao}>
          {task.descricao}
        </p>
        {/* Estimativa de horas - sempre na mesma posição */}
        {task.estimativa_horas && Number(task.estimativa_horas) > 0 && (
          <div className="flex items-center">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
              getStatusName(task.status_id) === "Não iniciada" ? "bg-red-50 text-red-700" :
              getStatusName(task.status_id) === "Em desenvolvimento" ? "bg-blue-50 text-blue-700" :
              getStatusName(task.status_id) === "Em testes" ? "bg-yellow-50 text-yellow-700" :
              "bg-emerald-50 text-emerald-700"
            )}>
              <Clock className="w-3 h-3" />
              {formatHours(task.estimativa_horas)}
            </span>
          </div>
        )}
        
        {/* Rodapé do card com responsáveis e data de atualização */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {(task.responsaveis ?? []).map(resp => (
                <MemoizedAvatar key={resp.email} email={resp.email} />
              ))}
              {!(task.responsaveis ?? []).length && <MemoizedAvatar />}
            </div>
            {(task.responsaveis ?? []).length === 1 && (
              <span className="text-sm font-medium">
                {(task.responsaveis ?? []).map(r => getResponsavelName(r.email)).join(', ')}
              </span>
            )}
            {(task.responsaveis ?? []).length > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium flex items-center gap-1 cursor-help">
                      <Users className="w-3 h-3" />
                      {task.responsaveis?.length} responsáveis
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {(task.responsaveis ?? []).map(r => getResponsavelName(r.email)).join(', ')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {task.ultima_atualizacao && (
            <div className="flex items-center">
              {isLoading ? (
                <div className="flex items-center text-xs text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <span className="text-xs text-gray-500 flex items-center">
                  <span className="font-medium">Últ.:</span>
                  <span className="ml-1">
                    {formatDateTimeCompact(task.ultima_atualizacao)}
                  </span>
                </span>
              )}
            </div>
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
  tasks,
}: {
  column: { id: Status; title: string };
  tasks: Task[];
}) {
  return (
    <div key={column.id} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className={cn("font-medium", statusTitleColors[column.id as keyof typeof statusTitleColors])}>{column.title}</h3>
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
  const updateTaskDataFim = useTaskStore((state) => state.updateTaskDataFim)
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
    
    // Verifica se a tarefa está sendo movida para o status "Concluída" e se a data_fim está vazia
    const movingToCompleted = destination.droppableId === "Concluída" && source.droppableId !== "Concluída";
    if (movingToCompleted && !taskToMove.data_fim) {
      // Define a data atual como data de fim
      const dataAtual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      taskToMove.data_fim = dataAtual;
      
      // Usa a função do store para atualizar a data de fim
      updateTaskDataFim(taskId, dataAtual);
    }
    
    // Se estiver movendo dentro do mesmo status, apenas reordena
    if (source.droppableId === destination.droppableId) {
      // Obtém todas as tarefas do mesmo status
      const tasksInSameStatus = updatedTasks
        .filter(t => getStatusName(t.status_id) === destination.droppableId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Remove a tarefa da posição atual
      const taskIndex = tasksInSameStatus.findIndex(t => t.id === taskId);
      const [movedTask] = tasksInSameStatus.splice(taskIndex, 1);
      
      // Insere a tarefa na nova posição
      tasksInSameStatus.splice(destination.index, 0, movedTask);
      
      // Atualiza as posições de todas as tarefas
      tasksInSameStatus.forEach((task, index) => {
        const newPosition = index;
        if (task.position !== newPosition) {
          task.position = newPosition;
          // Passa false para indicar que não deve atualizar a data
          updateTaskPosition(task.id, task.status_id, newPosition, false);
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
  }, [updateTaskPosition, updateTaskDataFim, localTasks]);

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
