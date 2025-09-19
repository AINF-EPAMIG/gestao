// Sistema de eventos customizado para atualizações de tarefas
class TaskEventEmitter {
  private listeners: Map<string, Set<(taskId: number) => void>> = new Map()

  subscribe(event: string, callback: (taskId: number) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Retorna função de cleanup
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  emit(event: string, taskId: number) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(taskId))
    }
  }
}

export const taskEventEmitter = new TaskEventEmitter()

// Eventos disponíveis
export const TASK_EVENTS = {
  ETAPAS_UPDATED: 'etapas_updated',
} as const
