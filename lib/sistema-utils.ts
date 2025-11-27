// Mapeamentos para conversão entre números e labels

export const TIPO_MAP = {
  1: 'Sistema',
  2: 'Site',
  3: 'API',
  4: 'Mobile',
  5: 'Rotina',
  6: 'Infraestrutura',
  7: 'Outros',
} as const;

export const STATUS_MAP = {
  1: 'Produção',
  2: 'Em Desenvolvimento',
  3: 'Manutenção',
  4: 'Descontinuado',
} as const;

export const TIPO_REVERSE_MAP = {
  'Sistema': 1,
  'Site': 2,
  'API': 3,
  'Mobile': 4,
  'Rotina': 5,
  'Infraestrutura': 6,
  'Outros': 7,
} as const;

export const STATUS_REVERSE_MAP = {
  'Produção': 1,
  'Em Desenvolvimento': 2,
  'Manutenção': 3,
  'Descontinuado': 4,
} as const;

export type TipoId = keyof typeof TIPO_MAP;
export type StatusId = keyof typeof STATUS_MAP;
export type TipoLabel = typeof TIPO_MAP[TipoId];
export type StatusLabel = typeof STATUS_MAP[StatusId];

export function getTipoLabel(tipo: number): string {
  return TIPO_MAP[tipo as TipoId] || 'Desconhecido';
}

export function getStatusLabel(status: number): string {
  return STATUS_MAP[status as StatusId] || 'Desconhecido';
}

export function getTipoId(label: string): number {
  return TIPO_REVERSE_MAP[label as TipoLabel] || 7; // Default: Outros
}

export function getStatusId(label: string): number {
  return STATUS_REVERSE_MAP[label as StatusLabel] || 2; // Default: Em Desenvolvimento
}
