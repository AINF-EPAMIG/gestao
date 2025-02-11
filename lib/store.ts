import { create } from "zustand"

export type Priority = "Alta" | "Média" | "Baixa"
export type Status = "Não iniciada" | "Em desenvolvimento" | "Em testes" | "Concluída"

export interface Task {
  id: string
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
}

interface TaskStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  updateTaskStatus: (taskId: string, newStatusId: number) => void
  getTasksByStatus: (statusId: number) => Task[]
  getTaskDistribution: () => { name: string; value: number }[]
  getAssigneeDistribution: () => { subject: string; A: number }[]
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  
  setTasks: (tasks) => set({ tasks }),

  updateTaskStatus: async (taskId, newStatusId) => {
    try {
      const response = await fetch('/api/atividades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: taskId, status_id: newStatusId }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar status');

      const updatedTasks = await response.json();
      set({ tasks: updatedTasks });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
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
}));

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

