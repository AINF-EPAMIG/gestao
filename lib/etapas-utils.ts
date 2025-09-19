export interface Etapa {
  id: number;
  atividade_id: number;
  titulo: string;
  descricao: string | null;
  concluido: boolean;
  ordem: number;
  data_criacao: string;
  data_conclusao: string | null;
  criado_por: string;
}

export async function fetchTaskEtapas(taskId: number): Promise<Etapa[]> {
  try {
    const response = await fetch(`/api/atividades/${taskId}/todos`);
    if (!response.ok) {
      throw new Error('Erro ao buscar etapas');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar etapas:', error);
    return [];
  }
}

export function calculateProgress(etapas: Etapa[]): number {
  if (etapas.length === 0) return 0;
  
  const completedEtapas = etapas.filter(etapa => etapa.concluido).length;
  return Math.round((completedEtapas / etapas.length) * 100);
}

// Cache para evitar múltiplas requisições para a mesma tarefa
const etapasCache = new Map<number, { etapas: Etapa[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

export async function fetchTaskEtapasWithCache(taskId: number): Promise<Etapa[]> {
  const now = Date.now();
  const cached = etapasCache.get(taskId);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.etapas;
  }
  
  const etapas = await fetchTaskEtapas(taskId);
  etapasCache.set(taskId, { etapas, timestamp: now });
  
  return etapas;
}

// Função para invalidar cache quando etapas são modificadas
export function invalidateTaskEtapasCache(taskId: number) {
  etapasCache.delete(taskId);
}
