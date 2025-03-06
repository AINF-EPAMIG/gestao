import { create } from "zustand"
import { usePolling } from './hooks/usePolling'

export type Priority = "Alta" | "Média" | "Baixa"
export type Status = "Não iniciada" | "Em desenvolvimento" | "Em testes" | "Concluída"

export interface Task {
  id: number
  responsaveis?: {
    id: number;
    email: string;
    nome?: string;
    cargo?: string;
  }[]
  projeto_id: number
  projeto_nome?: string
  titulo: string
  descricao: string
  prioridade_id: number
  status_id: number
  estimativa_horas: string | null
  data_inicio: string | null
  data_fim: string | null
  data_conclusao: string | null
  data_criacao: string
  id_release: string | null
  order?: number
  position: number | null
  ultima_atualizacao: string | null
  setor_sigla?: string
}

interface PendingChange {
  taskId: number
  statusId: number
  position: number | null
  ultima_atualizacao: string
  sequence: number
}

interface TaskStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  updateTaskPosition: (taskId: number, newStatusId: number, newIndex: number, updateTimestamp?: boolean) => void
  updateTaskTimestamp: (taskId: number) => void
  syncPendingChanges: () => Promise<void>
  pendingChanges: PendingChange[]
  getTasksByStatus: (statusId: number) => Task[]
  getTaskDistribution: () => { name: string; value: number }[]
  getAssigneeDistribution: () => { subject: string; A: number }[]
  fetchTasks: () => Promise<void>
  deleteTask: (taskId: number) => Promise<void>
  selectedSetor: string | null
  setSelectedSetor: (setor: string | null) => void
  optimisticUpdates: Map<number, { statusId: number; position: number; timestamp: number; sequence: number }>
  lastFetchTimestamp: number
  isInitialLoad: boolean
  lastSequence: number
  syncTimeout?: NodeJS.Timeout
}

export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: [],
  pendingChanges: [],
  selectedSetor: null,
  optimisticUpdates: new Map(),
  lastFetchTimestamp: 0,
  isInitialLoad: true,
  lastSequence: 0,
  
  setTasks: (tasks) => {
    const { optimisticUpdates, isInitialLoad } = get();
    const now = Date.now();
    
    // Se for o carregamento inicial, não aplica atualizações otimistas
    const tasksWithOptimistic = isInitialLoad ? tasks : tasks.map(task => {
      const optimisticUpdate = optimisticUpdates.get(task.id);
      if (optimisticUpdate && now - optimisticUpdate.timestamp < 10000) {
        return {
          ...task,
          status_id: optimisticUpdate.statusId,
          position: optimisticUpdate.position
        };
      }
      return task;
    });

    // Garante que todas as tasks tenham posições válidas
    const tasksWithPositions = tasksWithOptimistic.map((task, index) => ({
      ...task,
      position: task.position ?? index
    }));

    // Agrupa por status e ordena por posição
    const tasksByStatus = tasksWithPositions.reduce((acc, task) => {
      if (!acc[task.status_id]) {
        acc[task.status_id] = [];
      }
      acc[task.status_id].push(task);
      return acc;
    }, {} as Record<number, Task[]>);

    // Reordena as posições dentro de cada status
    Object.values(tasksByStatus).forEach(statusTasks => {
      statusTasks.sort((a, b) => (a.position || 0) - (b.position || 0));
      statusTasks.forEach((task, index) => {
        task.position = index;
      });
    });

    // Flatten e set
    const normalizedTasks = Object.values(tasksByStatus).flat();
    set({ 
      tasks: normalizedTasks,
      lastFetchTimestamp: now,
      isInitialLoad: false,
      // Limpa otimistic updates no carregamento inicial
      optimisticUpdates: isInitialLoad ? new Map() : optimisticUpdates
    });
  },
  
  updateTaskPosition: (taskId, newStatusId, newIndex, updateTimestamp = true) => {
    set((state) => {
      const nextSequence = state.lastSequence + 1;
      const tasks = [...state.tasks];
      const taskToMove = tasks.find(t => t.id === taskId);
      
      if (!taskToMove) return state;
      
      const oldStatusId = taskToMove.status_id;
      const isStatusChange = oldStatusId !== newStatusId;
      
      // Remove a tarefa da lista atual
      const remainingTasks = tasks.filter(t => t.id !== taskId);
      
      // Atualiza posições e última atualização
      const date = new Date();
      date.setHours(date.getHours() - 3);
      const now = date.toISOString();
      const timestamp = Date.now();
      
      // Atualiza a tarefa movida
      const updatedTask = {
        ...taskToMove,
        position: newIndex,
        status_id: newStatusId,
        // Só atualiza o timestamp se for solicitado (mudança de status) ou se for forçado
        ultima_atualizacao: (isStatusChange || updateTimestamp) ? now : taskToMove.ultima_atualizacao
      };
      
      // Reordena todas as tarefas do mesmo status
      const tasksInSameStatus = [
        ...remainingTasks.filter(t => t.status_id === newStatusId),
        updatedTask
      ].sort((a, b) => {
        if (a.id === taskId) return newIndex - (b.position || 0);
        if (b.id === taskId) return (a.position || 0) - newIndex;
        return (a.position || 0) - (b.position || 0);
      });
      
      // Atualiza as posições
      tasksInSameStatus.forEach((task, index) => {
        task.position = index;
      });

      // Se houve mudança de status, também reordena as tarefas do status antigo
      let tasksInOldStatus: Task[] = [];
      if (isStatusChange) {
        tasksInOldStatus = remainingTasks
          .filter(t => t.status_id === oldStatusId)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        
        // Reordena as posições no status antigo
        tasksInOldStatus.forEach((task, index) => {
          task.position = index;
        });
      }

      // Atualiza o estado final
      const finalTasks = [
        ...remainingTasks.filter(t => t.status_id !== newStatusId && t.status_id !== oldStatusId),
        ...tasksInSameStatus,
        ...(isStatusChange ? tasksInOldStatus : [])
      ];

      // Adiciona à lista de atualizações otimistas com sequence
      const newOptimisticUpdates = new Map(state.optimisticUpdates);
      newOptimisticUpdates.set(taskId, {
        statusId: newStatusId,
        position: newIndex,
        timestamp,
        sequence: nextSequence
      });
      
      // Sincroniza imediatamente com o banco de dados em vez de agendar
      const change = {
        taskId,
        statusId: newStatusId,
        position: newIndex,
        ultima_atualizacao: now,
        sequence: nextSequence,
        isStatusChange,
        oldStatusId: isStatusChange ? oldStatusId : undefined
      };
      
      // Chama a API imediatamente
      fetch('/api/atividades/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change),
      }).catch(error => {
        console.error('Erro ao sincronizar:', error);
      });
      
      return {
        tasks: finalTasks,
        pendingChanges: [...state.pendingChanges, change],
        optimisticUpdates: newOptimisticUpdates,
        lastSequence: nextSequence
      };
    });
  },
  
  updateTaskTimestamp: (taskId) => {
    set((state) => {
      const tasks = [...state.tasks];
      const taskToUpdate = tasks.find(t => t.id === taskId);
      
      if (!taskToUpdate) return state;
      
      // Atualiza a data da última atualização
      const date = new Date();
      date.setHours(date.getHours() - 3);
      const now = date.toISOString();
      
      // Atualiza a tarefa
      taskToUpdate.ultima_atualizacao = now;
      
      // Chama a API para atualizar a data no banco de dados
      fetch('/api/atividades/update-timestamp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          ultima_atualizacao: now
        }),
      }).catch(error => {
        console.error('Erro ao atualizar timestamp:', error);
      });
      
      return {
        tasks
      };
    });
  },
  
  syncPendingChanges: async () => {
    const { pendingChanges, optimisticUpdates } = get();
    
    if (pendingChanges.length === 0) return;
    
    try {
      // Ordena as mudanças pela sequência para manter a ordem correta
      const sortedChanges = [...pendingChanges].sort((a, b) => a.sequence - b.sequence);
      
      for (const change of sortedChanges) {
        await fetch('/api/atividades/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(change),
        });
        
        // Remove a atualização otimista após sincronização bem-sucedida
        optimisticUpdates.delete(change.taskId);
      }
      
      set({ 
        pendingChanges: [],
        optimisticUpdates: new Map(optimisticUpdates)
      });
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
  },

  getTasksByStatus: (statusId: number) => {
    return get().tasks.filter((task) => task.status_id === statusId);
  },

  getTaskDistribution: () => {
    const tasks = get().tasks;
    const total = tasks.length;
    const statusCount = tasks.reduce((acc, task) => {
      const statusName = getStatusName(task.status_id);
      acc[statusName] = (acc[statusName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
    }));
  },

  getAssigneeDistribution: () => {
    const tasks = get().tasks;
    const assigneeCounts = tasks.reduce((acc, task) => {
      (task.responsaveis ?? []).forEach(responsavel => {
        const name = responsavel.nome || responsavel.email.split('@')[0].replace('.', ' ');
        acc[name] = (acc[name] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(assigneeCounts).map(([subject, count]) => ({
      subject,
      A: count,
    }));
  },

  fetchTasks: async () => {
    try {
      // Sempre busca os dados mais recentes do servidor
      const response = await fetch('/api/atividades', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) throw new Error('Falha ao carregar dados');
      const data = await response.json();
      
      // Atualiza o estado com os dados mais recentes
      set({ 
        tasks: data,
        lastFetchTimestamp: Date.now(),
        isInitialLoad: false
      });
    } catch (error) {
      console.error('❌ Erro ao buscar tarefas:', error);
    }
  },

  deleteTask: async (taskId: number) => {
    try {
      const response = await fetch(`/api/atividades/${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const updatedTasks = await response.json();
        set({ tasks: updatedTasks });
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  },

  setSelectedSetor: (setor) => set({ selectedSetor: setor }),
}))

export function getStatusName(statusId: number): Status {
  const statusMap: Record<number, Status> = {
    1: "Não iniciada",
    2: "Em desenvolvimento",
    3: "Em testes",
    4: "Concluída"
  }
  return statusMap[statusId] || "Não iniciada"
}

export function getPriorityName(priorityId: number): Priority {
  const priorityMap: Record<number, Priority> = {
    1: "Alta",
    2: "Média",
    3: "Baixa"
  }
  return priorityMap[priorityId] || "Média"
}

// Mapeamento de exceções para formatação de nomes
const NOME_EXCEPTIONS: Record<string, string> = {
  "alexsolano@epamig.br": "Alex Solano"
};

export function getResponsavelName(responsavelId: number | null, email?: string): string {
  if (!responsavelId || !email) return "Não atribuído";
  
  // Verifica se o email está nas exceções
  if (NOME_EXCEPTIONS[email]) {
    return NOME_EXCEPTIONS[email];
  }
  
  const username = email.split('@')[0];
  
  return username
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatHours(hours: string | number | null): string {
  if (!hours) return "Sem estimativa";
  return `${Number(hours)}h`;
}

// Hook personalizado para usar o polling com o store
export function useTaskPolling() {
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  usePolling(fetchTasks);
}

