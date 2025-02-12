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
}

interface TaskStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  updateTaskStatus: (taskId: number, newStatusId: number, newIndex: number) => void
  syncPendingChanges: () => Promise<void>
  pendingChanges: { taskId: number; newStatusId: number }[]
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
      
      updateTaskStatus: (taskId, newStatusId, newIndex) => {
        set((state) => {
          const tasks = [...state.tasks]
          const taskToMove = tasks.find(t => t.id === taskId)
          
          if (!taskToMove) return state
          
          // Remove o card da lista
          const filteredTasks = tasks.filter(t => t.id !== taskId)
          
          // Encontra todos os cards da coluna de destino
          const destinationTasks = filteredTasks.filter(
            t => getStatusName(t.status_id) === getStatusName(newStatusId)
          ).sort((a, b) => (a.order || 0) - (b.order || 0))
          
          // Calcula a nova ordem
          let newOrder: number
          
          if (destinationTasks.length === 0) {
            // Se não houver cards na coluna de destino, use 1 como ordem
            newOrder = 1
          } else if (newIndex === 0) {
            // Se for inserido no início, use ordem anterior - 1
            newOrder = (destinationTasks[0].order || 1) - 1
          } else if (newIndex >= destinationTasks.length) {
            // Se for inserido no final, use ordem posterior + 1
            newOrder = ((destinationTasks[destinationTasks.length - 1]?.order || 0) + 1)
          } else {
            // Se for inserido no meio, use a média entre as ordens anterior e posterior
            const prevOrder = destinationTasks[newIndex - 1]?.order || 0
            const nextOrder = destinationTasks[newIndex]?.order || 0
            newOrder = (prevOrder + nextOrder) / 2
          }
          
          // Atualiza o card movido
          taskToMove.status_id = newStatusId
          taskToMove.order = newOrder
          
          // Reinsere o card na lista
          filteredTasks.push(taskToMove)
          
          return { 
            tasks: filteredTasks.sort((a, b) => (a.order || 0) - (b.order || 0)),
            pendingChanges: [...state.pendingChanges, { taskId, newStatusId }]
          }
        })
        
        get().syncPendingChanges()
      },
      
      syncPendingChanges: async () => {
        const { pendingChanges, tasks } = get()
        
        if (pendingChanges.length === 0) return
        
        try {
          for (const change of pendingChanges) {
            await fetch('/api/atividades', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                id: change.taskId, 
                status_id: change.newStatusId 
              }),
            })
          }
          
          // Limpa mudanças pendentes após sucesso
          set({ pendingChanges: [] })
        } catch (error) {
          console.error('Erro ao sincronizar:', error)
          // Mantém as mudanças pendentes para tentar novamente depois
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
        tasks: state.tasks.map(task => ({
          ...task,
          order: task.order || 0
        })),
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

