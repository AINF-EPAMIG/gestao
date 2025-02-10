import { create } from "zustand"

export type Priority = "Alta" | "Média" | "Baixa"
export type Status = "Não iniciada" | "Em desenvolvimento" | "Em testes" | "Concluída"

export interface Task {
  id: string
  title: string
  description: string
  assignee: string
  assigneeId: string
  status: Status
  priority: Priority
  system: string
  estimate: string
  startDate: string
  endDate: string
  releaseId: string
}

interface TaskStore {
  tasks: Task[]
  updateTaskStatus: (taskId: string, newStatus: Status) => void
  getTasksByStatus: (status: Status) => Task[]
  getTaskDistribution: () => { name: string; value: number }[]
  getAssigneeDistribution: () => { subject: string; A: number }[]
}

const initialTasks: Task[] = [
  {
    id: "INC-2747",
    title: "Implementar autenticação de usuários",
    description: "Desenvolver sistema de login com múltiplos fatores",
    assignee: "João Silva",
    assigneeId: "JS",
    status: "Não iniciada",
    priority: "Alta",
    system: "Sistema 01",
    estimate: "1h10m",
    startDate: "2023-06-15",
    endDate: "2023-06-18",
    releaseId: "REL-001",
  },
  {
    id: "INC-2749",
    title: "Configurar ambiente de teste",
    description: "Preparar ambiente de homologação para testes",
    assignee: "Maria Santos",
    assigneeId: "MS",
    status: "Não iniciada",
    priority: "Baixa",
    system: "Sistema 02",
    estimate: "2h13m",
    startDate: "2023-06-20",
    endDate: "2023-06-22",
    releaseId: "REL-001",
  },
  {
    id: "INC-2750",
    title: "Otimização de consultas SQL",
    description: "Melhorar performance das consultas principais",
    assignee: "Pedro Costa",
    assigneeId: "PC",
    status: "Em desenvolvimento",
    priority: "Alta",
    system: "Sistema 01",
    estimate: "3h58m",
    startDate: "2023-06-17",
    endDate: "2023-06-19",
    releaseId: "REL-001",
  },
  {
    id: "INC-2740",
    title: "Implementar novo dashboard",
    description: "Criar dashboard com gráficos de desempenho",
    assignee: "Ana Oliveira",
    assigneeId: "AO",
    status: "Em desenvolvimento",
    priority: "Média",
    system: "Sistema 03",
    estimate: "1h15m",
    startDate: "2023-06-16",
    endDate: "2023-06-18",
    releaseId: "REL-002",
  },
  {
    id: "INC-2733",
    title: "Testes de integração API",
    description: "Realizar testes de integração com sistemas externos",
    assignee: "Carlos Ferreira",
    assigneeId: "CF",
    status: "Em testes",
    priority: "Alta",
    system: "Sistema 02",
    estimate: "3h45m",
    startDate: "2023-06-18",
    endDate: "2023-06-20",
    releaseId: "REL-002",
  },
  {
    id: "INC-2724",
    title: "Correção de bug no login",
    description: "Corrigir erro de autenticação na tela de login",
    assignee: "Lucas Mendes",
    assigneeId: "LM",
    status: "Concluída",
    priority: "Alta",
    system: "Sistema 01",
    estimate: "16h",
    startDate: "2023-06-14",
    endDate: "2023-06-16",
    releaseId: "REL-002",
  },
]

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: initialTasks,

  updateTaskStatus: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)),
    })),

  getTasksByStatus: (status) => {
    return get().tasks.filter((task) => task.status === status)
  },

  getTaskDistribution: () => {
    const tasks = get().tasks
    const total = tasks.length
    const statusCount = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(statusCount).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
    }))
  },

  getAssigneeDistribution: () => {
    const tasks = get().tasks
    const assigneeCounts = tasks.reduce(
      (acc, task) => {
        acc[task.assignee] = (acc[task.assignee] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(assigneeCounts).map(([subject, count]) => ({
      subject,
      A: count * 20, // Multiplicar por 20 para melhor visualização no radar
    }))
  },
}))

