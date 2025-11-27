export interface Sistema {
  id: number;
  nome: string;
  sigla: string | null;
  tipo: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1-Sistema, 2-Site, 3-API, 4-Mobile, 5-Rotina, 6-Infraestrutura, 7-Outros
  status: 1 | 2 | 3 | 4; // 1-Produção, 2-Em Desenvolvimento, 3-Manutenção, 4-Descontinuado
  objetivo: string | null;
  setor_id: number | null;
  tecnologia_principal: string | null;
  repositorio_git: string | null;
  url_producao: string | null;
  url_homologacao: string | null;
  servidor: string | null;
  banco_dados: string | null;
  sistemas_integrados: string | null;
  rotinas_principais: string | null;
  url_documentacao: string | null;
  observacoes: string | null;
  quem_cadastrou: string | null;
  quem_editou: string | null;
  data_inicio: string | null;
  created_at: string;
  updated_at: string;
}

export interface SistemaFormData {
  nome: string;
  sigla?: string;
  tipo: Sistema['tipo'];
  status: Sistema['status'];
  objetivo?: string;
  setor_id?: number;
  tecnologia_principal?: string;
  repositorio_git?: string;
  url_producao?: string;
  url_homologacao?: string;
  servidor?: string;
  banco_dados?: string;
  sistemas_integrados?: string;
  rotinas_principais?: string;
  url_documentacao?: string;
  observacoes?: string;
  data_inicio?: string;
}
