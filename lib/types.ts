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