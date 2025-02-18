export type Task = {
  id: number;
  sistema_id: number;
  titulo: string;
  descricao: string;
  responsavel_id: number | null;
  responsavel_email?: string;
  status_id: number;
} 