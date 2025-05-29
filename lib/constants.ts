// Configurações do sistema
export const SYSTEM_CONFIG = {
  // Radar Chart - Percentual mínimo para usuários relevantes
  // Para alterar o critério, modifique este valor:
  // 0.05 = 5%, 0.1 = 10%, 0.15 = 15%, etc.
  RADAR_CHART_MIN_PERCENTAGE: 0.05, // 5% do total de tarefas
  
  // Outras configurações podem ser adicionadas aqui
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_COMPRESSED_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Função para calcular o limite mínimo de tarefas baseado no percentual
// Exemplo: com 100 tarefas e 10%, retorna 10 tarefas mínimas
export function getMinimumTasksThreshold(totalTasks: number, percentage: number = SYSTEM_CONFIG.RADAR_CHART_MIN_PERCENTAGE): number {
  return Math.ceil(totalTasks * percentage);
}

// Função para formatar o percentual para exibição
// Exemplo: 0.1 retorna "10%"
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage * 100)}%`;
} 