export type Task = {
  id: number;
  sistema_id: number;
  titulo: string;
  descricao: string;
  responsaveis: {
    id: number;
    email: string;
    nome?: string;
    cargo?: string;
  }[];
  status_id: number;
} 