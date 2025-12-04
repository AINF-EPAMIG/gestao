export interface Funcionario {
  id: number;
  chapa: string;
  nome: string;
  cpf: string;
  email: string;
  cargo: string;
  funcao: string;
  data_admissao: string;
  chefe: string;
  chefe_substituto: string;
  status_colaborador: string;
  regional: string;
  departamento: string;
  divisao: string;
  assessoria: string;
  fazenda: string;
  diretoria: string;
  gabinete: string;
  nivel: string;
  
  // Campos mantidos para compatibilidade - serão removidos gradualmente
  filial?: string; // pode ser mapeado para regional
  secao?: string;  // pode ser mapeado para departamento/divisao
  chefia?: string; // pode ser mapeado para chefe
}

// Enum para níveis hierárquicos
export enum NivelHierarquico {
  COLABORADOR = 'Colaborador',
  CHEFE = 'Chefe',
  PRESIDENTE = 'Presidente',
  DIRETORIA = 'Diretoria'
}

// Interface para permissões baseadas em nível
export interface PermissoesUsuario {
  nivel: NivelHierarquico;
  podeVisualizarTodosSetores: boolean;
  podeCriarProjetos: boolean;
  podeExcluirAtividades: boolean;
  podeEditarQualquerAtividade: boolean;
  setoresPermitidos: string[];
}

// Interface para verificações de autorização
export interface AutorizacaoUsuario {
  email: string;
  nivel: NivelHierarquico;
  setor: string;
  permissoes: PermissoesUsuario;
} 

export type TvEntryKind = "news" | "media";

export interface TvNews {
  id: number;
  title: string;
  message: string;
  publishedAt: string;
  createdBy: string | null;
}

export interface TvContent {
  id: number;
  title: string;
  description: string;
  imageDataUrl: string | null;
  imageMimeType: string | null;
  imageName: string | null;
  publishedAt: string;
  createdBy: string | null;
}

export interface TvImagePayload {
  base64: string;
  mimeType: string;
  fileName: string;
  size: number;
}

export interface TvNewsPayload {
  title: string;
  message: string;
  createdByName?: string | null;
  createdByEmail?: string | null;
}

export interface TvContentPayload {
  title: string;
  description: string;
  createdByName?: string | null;
  createdByEmail?: string | null;
  image: TvImagePayload;
}