"use client"

import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, type Status, type Task as TaskBase, getStatusName, getPriorityName, formatHours } from "@/lib/store"
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
import { ProgressCircle } from "@/components/progress-circle"
import { useTaskProgress } from "@/hooks/use-task-progress"

type Task = TaskBase & { origem?: string };

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

const MemoizedAvatar = memo(function MemoizedAvatar({ email }: { email?: string }) {
  return (
    <Avatar className="w-7 h-7 sm:w-6 sm:h-6 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9">
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
  const [showDateTime, setShowDateTime] = useState(true)
  const previousStatusRef = useRef<number>(task.status_id)
  const previousUpdateRef = useRef<string | null>(task.ultima_atualizacao)
  
  // Hook para buscar progresso das etapas
  const { progress, hasEtapas, loading: progressLoading } = useTaskProgress(task.id)

  // Efeito para detectar mudanças de status e mostrar o loader
  useEffect(() => {
    // Se o status mudou ou a data de atualização mudou
    if (previousStatusRef.current !== task.status_id || 
        previousUpdateRef.current !== task.ultima_atualizacao) {
      
      // Só mostra o loader se a data de atualização mudou (indicando mudança real de status)
      if (previousUpdateRef.current !== task.ultima_atualizacao) {
        setIsLoading(true)
        setShowDateTime(false) // Oculta a data temporariamente
        
        // Simula um tempo de carregamento de 2 segundos para o loader
        const loaderTimer = setTimeout(() => {
          setIsLoading(false)
        }, 2000)
        
        // Delay adicional para mostrar a data formatada corretamente (4 segundos total)
        const dateTimer = setTimeout(() => {
          setShowDateTime(true)
        }, 4000)
        
        return () => {
          clearTimeout(loaderTimer)
          clearTimeout(dateTimer)
        }
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
          "p-3 sm:p-2 xl:p-3 2xl:p-4 space-y-2 sm:space-y-1.5 xl:space-y-2 2xl:space-y-3 border-l-4 cursor-pointer",
          "max-w-full sm:max-w-full md:max-w-full lg:max-w-full xl:max-w-full 2xl:max-w-full w-full",
          snapshot.isDragging && "dragging-card",
          statusColors[getStatusName(task.status_id) as keyof typeof statusColors]
        )}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <Badge
            className={cn(
              getPriorityName(task.prioridade_id) === "Alta"
                ? "bg-red-50 text-red-600 border-red-100"
                : getPriorityName(task.prioridade_id) === "Média"
                ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                : "bg-green-50 text-green-600 border-green-100",
              "text-xs sm:text-[10px] xl:text-xs 2xl:text-sm px-1.5 py-0 sm:px-1 sm:py-0 xl:px-1.5 xl:py-0.5 2xl:px-2 2xl:py-0.5 flex-shrink-0"
            )}
          >
            {getPriorityName(task.prioridade_id)}
          </Badge>
          <Badge variant="outline" title={task.projeto_nome || (!task.projeto_id ? (task.origem ? 'Seção Indefinida' : 'Projeto Indefinido') : (task.origem ? `Seção` : `Projeto ${task.projeto_id}`))}
            className="text-xs sm:text-[10px] xl:text-xs 2xl:text-sm px-1.5 py-0 sm:px-1 sm:py-0 xl:px-1.5 xl:py-0.5 2xl:px-2 2xl:py-0.5 flex-shrink-0"
          >
            <span className="hidden sm:inline xl:hidden 2xl:hidden">
              {!task.projeto_id ? (task.origem ? 'S' : 'P') : (task.origem ? 'S' : `P${task.projeto_id}`)}
            </span>
            <span className="sm:hidden xl:inline 2xl:inline">
              {task.projeto_nome
                ? (task.projeto_nome.length > 20 ? `${task.projeto_nome.slice(0, 17)}...` : task.projeto_nome)
                : (!task.projeto_id ? (task.origem ? 'Seção Indefinida' : 'Projeto Indefinido') : (task.origem ? '' : `Projeto ${task.projeto_id}`))}
            </span>
          </Badge>
        </div>
        <h4 className="font-medium truncate text-sm sm:text-xs xl:text-sm 2xl:text-base" title={task.titulo}>{task.titulo}</h4>
        <p className="text-sm sm:text-xs xl:text-sm 2xl:text-sm text-gray-500 line-clamp-2 sm:line-clamp-1 xl:line-clamp-2 2xl:line-clamp-3 w-full" title={task.descricao}>
          {task.descricao}
        </p>
        {/* Estimativa de horas e indicador de progresso */}
        {(task.estimativa_horas && Number(task.estimativa_horas) > 0) || (hasEtapas && !progressLoading) ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {task.estimativa_horas && Number(task.estimativa_horas) > 0 && (
                <span className={cn(
                  "text-xs sm:text-[10px] xl:text-xs 2xl:text-sm font-medium px-2 py-0.5 sm:px-1.5 sm:py-0 xl:px-2 xl:py-0.5 2xl:px-2.5 2xl:py-1 rounded-full flex items-center gap-1",
                  getStatusName(task.status_id) === "Não iniciada" ? "bg-red-50 text-red-700" :
                  getStatusName(task.status_id) === "Em desenvolvimento" ? "bg-blue-50 text-blue-700" :
                  getStatusName(task.status_id) === "Em testes" ? "bg-yellow-50 text-yellow-700" :
                  "bg-emerald-50 text-emerald-700"
                )}>
                  <Clock className="w-3 h-3 sm:w-2.5 sm:h-2.5 xl:w-3 xl:h-3 2xl:w-3.5 2xl:h-3.5" />
                  {formatHours(task.estimativa_horas)}
                </span>
              )}
            </div>
            {/* Indicador de progresso das etapas */}
            {hasEtapas && !progressLoading && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0 relative top-1">
                      <ProgressCircle 
                        percentage={progress} 
                        size={16} 
                        strokeWidth={2.5}
                        variant="minimal"
                        className="hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-48">
                    <div className="text-center">
                      <p className="font-semibold text-sm">{progress}%</p>
                      <p className="text-xs text-muted-foreground">
                        Nível de conclusão das etapas desta atividade
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ) : null}
        
        {/* Rodapé do card com responsáveis e data de atualização */}
        <div className="flex items-center justify-between pt-2 sm:pt-1 xl:pt-2 2xl:pt-3 border-t w-full">
          <div className="flex items-center gap-1 sm:gap-0.5 xl:gap-1 2xl:gap-2">
            <div className="flex -space-x-2 sm:-space-x-1 xl:-space-x-2 2xl:-space-x-3">
              {(task.responsaveis ?? []).length <= 6 ? (
                <>
                  {(task.responsaveis ?? []).map(resp => (
                    <MemoizedAvatar key={resp.email} email={resp.email} />
                  ))}
                </>
              ) : (
                <>
                  {(task.responsaveis ?? []).slice(0, 5).map(resp => (
                    <MemoizedAvatar key={resp.email} email={resp.email} />
                  ))}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="w-7 h-7 sm:w-6 sm:h-6 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 bg-gray-200 text-gray-700 font-medium">
                          <AvatarFallback>
                            +{(task.responsaveis ?? []).length - 5}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs xl:text-sm">
                          {(task.responsaveis ?? []).map(r => getResponsavelName(r.email)).join(', ')}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              {!(task.responsaveis ?? []).length && <MemoizedAvatar />}
            </div>
            {/* Texto de responsável único - mostrado em todas as telas */}
            {(task.responsaveis ?? []).length === 1 && (
              <span className="text-sm sm:text-xs xl:text-sm 2xl:text-sm font-medium truncate max-w-[80px] sm:max-w-[60px] md:max-w-[80px] lg:max-w-[80px] xl:max-w-[100px] 2xl:max-w-[120px]">
                {(task.responsaveis ?? []).map(r => {
                  // Pegar apenas o primeiro nome
                  const fullName = getResponsavelName(r.email);
                  const firstName = fullName.split(' ')[0];
                  return firstName;
                }).join(', ')}
              </span>
            )}
            {/* Texto de múltiplos responsáveis - agora visível em todas as telas */}
            {(task.responsaveis ?? []).length > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs sm:text-[10px] xl:text-xs 2xl:text-sm font-medium flex items-center gap-1 cursor-help">
                      <Users className="w-2.5 h-2.5 sm:w-2 sm:h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3" />
                      {task.responsaveis?.length}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs xl:text-sm">
                      {(task.responsaveis ?? []).map(r => {
                        // Pegar apenas o primeiro nome para o tooltip também
                        const fullName = getResponsavelName(r.email);
                        const firstName = fullName.split(' ')[0];
                        return firstName;
                      }).join(', ')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {/* Mostrar data de solicitação para chamados e última atualização para o Kanban original */}
          {((task.origem && task.data_solicitacao) || (!task.origem && task.ultima_atualizacao)) && (task.responsaveis ?? []).length < 4 && (
            <div className="flex items-center">
              {isLoading || !showDateTime ? (
                <div className="flex items-center text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 sm:w-2.5 sm:h-2.5 xl:w-3 xl:h-3 2xl:w-3.5 2xl:h-3.5 animate-spin" />
                </div>
              ) : (
                <span className="text-xs sm:text-[9px] xl:text-xs 2xl:text-sm text-gray-500 flex items-center">
                  <span className="font-medium hidden sm:hidden xl:hidden 2xl:inline">{task.origem ? 'Solic.:' : 'Últ.:'}</span>
                  <span className="ml-0 xl:ml-0 2xl:ml-1">
                    {formatDateTimeCompact(task.origem ? (task.data_solicitacao ?? null) : task.ultima_atualizacao)}
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
}, (prevProps, nextProps) => {
  // Memoização customizada para evitar re-renders desnecessários
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status_id === nextProps.task.status_id &&
    prevProps.task.ultima_atualizacao === nextProps.task.ultima_atualizacao &&
    prevProps.task.titulo === nextProps.task.titulo &&
    prevProps.task.descricao === nextProps.task.descricao &&
    prevProps.task.prioridade_id === nextProps.task.prioridade_id &&
    prevProps.snapshot.isDragging === nextProps.snapshot.isDragging
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
    <div key={column.id} className="flex flex-col gap-3 sm:gap-2 xl:gap-2 2xl:gap-3 w-full">
      <div className={cn(
        "flex items-center justify-center w-full rounded-t-md",
        column.id === "Não iniciada" ? "bg-red-50" : 
        column.id === "Em desenvolvimento" ? "bg-blue-50" : 
        column.id === "Em testes" ? "bg-yellow-50" : 
        "bg-emerald-50"
      )}>
        <h3 className={cn("font-medium text-sm sm:text-xs xl:text-sm 2xl:text-base text-center w-full py-2 sm:py-1.5 xl:py-2 2xl:py-2.5",
          column.id === "Não iniciada" ? "text-red-700" : 
          column.id === "Em desenvolvimento" ? "text-blue-700" : 
          column.id === "Em testes" ? "text-yellow-700" : 
          "text-emerald-700"
        )}>{column.title}</h3>
      </div>
      <Droppable droppableId={column.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-2 sm:gap-1.5 xl:gap-2 2xl:gap-3 w-full min-h-[200px]"
          >
            {tasks.map((task, index) => {
              const uniqueTaskId = `${task.origem || 'default'}-${task.id}`;
              return (
                <Draggable 
                  key={uniqueTaskId} 
                  draggableId={uniqueTaskId} 
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
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});

interface KanbanBoardProps {
  tasks: Task[];
  columnsOverride?: { id: Status; title: string }[];
  onTaskMove?: (taskId: number, newStatusId: number, position?: number) => void;
  disableAutoSync?: boolean;
  tasksPerColumn?: number;
}

export function KanbanBoard({ tasks, columnsOverride, onTaskMove, disableAutoSync = false, tasksPerColumn }: KanbanBoardProps) {
  const updateTaskPosition = useTaskStore((state) => state.updateTaskPosition)
  const updateTaskDataFim = useTaskStore((state) => state.updateTaskDataFim)
  const [localTasks, setLocalTasks] = useState<Task[]>([])

  const columnsToUse = columnsOverride || columns;

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
    
    // Extrair apenas o ID numérico do draggableId (que agora é prefixado com origem)
    const taskId = parseInt(draggableId.split('-').pop() || '0');
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
          if (!disableAutoSync) {
            updateTaskPosition(task.id, task.status_id, newPosition, false);
          }
        }
      });
      
      // Atualiza o estado local para refletir a mudança imediatamente
      setLocalTasks(updatedTasks);
    } else {
      // Se estiver mudando de status, atualiza o status e a posição
      // Passa true para indicar que deve atualizar a data (mudança de status)
      if (!disableAutoSync) {
        updateTaskPosition(taskId, newStatusId, destination.index, true);
      }
      
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
          if (!disableAutoSync) {
            updateTaskPosition(task.id, sourceStatusId, index, false);
          }
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
          if (!disableAutoSync) {
            updateTaskPosition(task.id, newStatusId, index, false);
          }
        }
      });
      
      setLocalTasks(updatedTasks);
    }

    // Se houver uma função de callback onTaskMove, chama-a
    if (onTaskMove && source.droppableId !== destination.droppableId) {
      onTaskMove(taskId, newStatusId, destination.index);
    }
  }, [updateTaskPosition, updateTaskDataFim, localTasks, onTaskMove, disableAutoSync]);

  const columnTasks = useMemo(() => {
    return columnsToUse.reduce((acc, column) => {
      const allTasksInColumn = localTasks
        .filter(task => getStatusName(task.status_id) === column.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Se tasksPerColumn está definido, limita o número de tarefas por coluna
      acc[column.id] = tasksPerColumn ? allTasksInColumn.slice(0, tasksPerColumn) : allTasksInColumn;
      return acc;
    }, {} as Record<Status, Task[]>);
  }, [localTasks, columnsToUse, tasksPerColumn]);

  // Se estiver carregando, mostra um estado de loading
  if (tasks.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-2 xl:gap-3 2xl:gap-4 min-w-[min-content] w-full">
        {columnsToUse.map((column) => (
          <div key={column.id} className="flex flex-col gap-3 sm:gap-2 xl:gap-2 2xl:gap-3 w-full">
            <div className={cn(
              "flex items-center justify-center w-full rounded-t-md",
              column.id === "Não iniciada" ? "bg-red-50" : 
              column.id === "Em desenvolvimento" ? "bg-blue-50" : 
              column.id === "Em testes" ? "bg-yellow-50" : 
              "bg-emerald-50"
            )}>
              <h3 className={cn("font-medium text-sm sm:text-xs xl:text-sm 2xl:text-base text-center w-full py-2 sm:py-1.5 xl:py-2 2xl:py-2.5",
                column.id === "Não iniciada" ? "text-red-700" : 
                column.id === "Em desenvolvimento" ? "text-blue-700" : 
                column.id === "Em testes" ? "text-yellow-700" : 
                "text-emerald-700"
              )}>{column.title}</h3>
            </div>
            <div className="flex flex-col gap-2 sm:gap-1.5 xl:gap-2 2xl:gap-3 animate-pulse bg-gray-100 rounded-lg w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-2 xl:gap-3 2xl:gap-4 w-full">
        {columnsToUse.map((column) => (
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
