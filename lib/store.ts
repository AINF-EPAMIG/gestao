import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Priority = "Alta" | "Média" | "Baixa"
export type Status = "Não iniciada" | "Em desenvolvimento" | "Em testes" | "Concluída"

export interface Task {
  id: number
  responsavel_id: number | null
  responsavel_email?: string
  sistema_id: number
  sistema_nome?: string
  titulo: string
  descricao: string
  prioridade_id: number
  status_id: number
  estimativa_horas: string | null
  data_inicio: string | null
  data_fim: string | null
  data_conclusao: string | null
  id_release: string | null
  order?: number
  position: number | null
  ultima_atualizacao: string | null
}

interface TaskStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  updateTaskPosition: (taskId: number, newStatusId: number, newIndex: number) => void
  syncPendingChanges: () => Promise<void>
  pendingChanges: { taskId: number; statusId: number; position: number }[]
  getTasksByStatus: (statusId: number) => Task[]
  getTaskDistribution: () => { name: string; value: number }[]
  getAssigneeDistribution: () => { subject: string; A: number }[]
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      pendingChanges: [],
      
      setTasks: (tasks) => set({ tasks }),
      
      updateTaskPosition: (taskId, newStatusId, newIndex) => {
        set((state) => {
          const tasks = [...state.tasks]
          const taskToMove = tasks.find(t => t.id === taskId)
          
          if (!taskToMove) return state
          
          // Remove a tarefa da lista atual
          const remainingTasks = tasks.filter(t => t.id !== taskId)
          
          // Pega todas as tarefas do status de destino
          const statusTasks = remainingTasks
            .filter(t => t.status_id === newStatusId)
            .sort((a, b) => (a.position || 0) - (b.position || 0))
          
          // Atualiza posições
          if (newIndex === 0) {
            // Se for primeira posição
            taskToMove.position = (statusTasks[0]?.position ?? 0) - 1
          } else if (newIndex >= statusTasks.length) {
            // Se for última posição
            const lastPosition = statusTasks[statusTasks.length - 1]?.position ?? 0
            taskToMove.position = lastPosition + 1
          } else {
            // Se for no meio, pega a posição entre as duas tarefas
            const prevPosition = statusTasks[newIndex - 1]?.position ?? 0
            const nextPosition = statusTasks[newIndex]?.position ?? prevPosition + 2
            taskToMove.position = Math.floor((prevPosition + nextPosition) / 2)
          }
          
          // Atualiza o status
          taskToMove.status_id = newStatusId
          
          // Reinsere a tarefa
          remainingTasks.push(taskToMove)
          
          return {
            tasks: remainingTasks,
            pendingChanges: [...state.pendingChanges, {
              taskId,
              statusId: newStatusId,
              position: taskToMove.position
            }]
          }
        })
        
        // Tenta sincronizar imediatamente
        get().syncPendingChanges()
      },
      
      syncPendingChanges: async () => {
        const { pendingChanges } = get()
        
        if (pendingChanges.length === 0) return
        
        try {
          for (const change of pendingChanges) {
            await fetch('/api/atividades/reorder', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(change),
            })
          }
          
          set({ pendingChanges: [] })
        } catch (error) {
          console.error('Erro ao sincronizar:', error)
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
          const responsavel = getResponsavelName(task.responsavel_id, task.responsavel_email);
          if (responsavel) {
            acc[responsavel] = (acc[responsavel] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(assigneeCounts).map(([subject, count]) => ({
          subject,
          A: count,
        }));
      },
    }),
    {
      name: 'kanban-store',
      partialize: (state) => ({ 
        tasks: state.tasks,
        pendingChanges: state.pendingChanges 
      })
    }
  )
)

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

interface ResponsavelInfo {
  email: string;
  nome: string;
  cargo?: string;
}

export function getResponsavelName(responsavelId: number | null, email?: string): string {
  if (!responsavelId || !email) return "Não atribuído";
  
  const username = email.split('@')[0];
  
  return username
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatHours(hours: string | number | null): string {
  if (!hours) return "Sem estimativa";
  return `${Number(hours)}h`;
}

