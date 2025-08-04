/**
 * Configurações de autenticação e autorização do sistema
 */

import { NivelHierarquico, PermissoesUsuario, Funcionario } from './types';

// Lista de emails que devem ter privilégios de chefia independente do cargo/hierarquia formal
export const EXCEPTION_EMAILS_CHEFIA: string[] = [
  // "exemplo@epamig.br",
];

/**
 * Verifica se um email está na lista de exceções para privilégios de chefia
 */
export function isExceptionEmailChefia(email: string): boolean {
  return EXCEPTION_EMAILS_CHEFIA.includes(email.toLowerCase());
}

/**
 * Adiciona um email à lista de exceções de chefia (uso programático)
 * @param email - Email a ser adicionado à lista de exceções
 */
export function addExceptionEmailChefia(email: string): void {
  const emailLower = email.toLowerCase();
  if (!EXCEPTION_EMAILS_CHEFIA.includes(emailLower)) {
    EXCEPTION_EMAILS_CHEFIA.push(emailLower);
  }
}

/**
 * Remove um email da lista de exceções de chefia (uso programático)
 * @param email - Email a ser removido da lista de exceções
 */
export function removeExceptionEmailChefia(email: string): void {
  const emailLower = email.toLowerCase();
  const index = EXCEPTION_EMAILS_CHEFIA.indexOf(emailLower);
  if (index > -1) {
    EXCEPTION_EMAILS_CHEFIA.splice(index, 1);
  }
}

/**
 * Determina o nível hierárquico do usuário baseado no campo 'nivel' da view
 * @param user - Dados do funcionário
 * @returns Nível hierárquico do usuário
 */
export function determinarNivelHierarquico(user: Funcionario | null): NivelHierarquico {
  if (!user) return NivelHierarquico.COLABORADOR;
  
  // Verificar se é email de exceção primeiro (estes têm privilégios de diretoria)
  if (isExceptionEmailChefia(user.email)) {
    return NivelHierarquico.DIRETORIA;
  }
  
  // Usar o campo 'nivel' da view para determinar hierarquia
  if (!user.nivel) return NivelHierarquico.COLABORADOR;
  
  const nivelLower = user.nivel.toLowerCase();
  
  if (nivelLower.includes('presidente') || nivelLower.includes('presidência')) {
    return NivelHierarquico.PRESIDENTE;
  }
  
  if (nivelLower.includes('diretor') || nivelLower.includes('diretoria')) {
    return NivelHierarquico.DIRETORIA;
  }
  
  if (nivelLower.includes('chefe') || nivelLower.includes('gerente') || 
      nivelLower.includes('coordenador') || nivelLower.includes('supervisor')) {
    return NivelHierarquico.CHEFE;
  }
  
  return NivelHierarquico.COLABORADOR;
}

/**
 * Calcula as permissões do usuário baseado no seu nível hierárquico
 * @param user - Dados do funcionário
 * @returns Permissões calculadas para o usuário
 */
export function calcularPermissoes(user: Funcionario | null): PermissoesUsuario {
  const nivel = determinarNivelHierarquico(user);
  const setor = user?.departamento || user?.divisao || user?.assessoria || user?.secao || '';
  
  switch (nivel) {
    case NivelHierarquico.PRESIDENTE:
    case NivelHierarquico.DIRETORIA:
      return {
        nivel,
        podeVisualizarTodosSetores: true,
        podeCriarProjetos: true,
        podeExcluirAtividades: true,
        podeEditarQualquerAtividade: true,
        setoresPermitidos: ['*'] // Asterisco indica todos os setores
      };
      
    case NivelHierarquico.CHEFE:
      return {
        nivel,
        podeVisualizarTodosSetores: false,
        podeCriarProjetos: true,
        podeExcluirAtividades: true,
        podeEditarQualquerAtividade: false, // Só da própria equipe
        setoresPermitidos: [setor]
      };
      
    case NivelHierarquico.COLABORADOR:
    default:
      return {
        nivel,
        podeVisualizarTodosSetores: false,
        podeCriarProjetos: false,
        podeExcluirAtividades: false,
        podeEditarQualquerAtividade: false,
        setoresPermitidos: [setor]
      };
  }
}

/**
 * Verifica se o usuário tem permissão para uma ação específica
 * @param user - Dados do funcionário
 * @param acao - Ação que se deseja verificar
 * @returns true se o usuário tem permissão, false caso contrário
 */
export function verificarPermissao(
  user: Funcionario | null, 
  acao: 'visualizar_todos_setores' | 'criar_projetos' | 'excluir_atividades' | 'editar_qualquer_atividade'
): boolean {
  const permissoes = calcularPermissoes(user);
  
  switch (acao) {
    case 'visualizar_todos_setores':
      return permissoes.podeVisualizarTodosSetores;
    case 'criar_projetos':
      return permissoes.podeCriarProjetos;
    case 'excluir_atividades':
      return permissoes.podeExcluirAtividades;
    case 'editar_qualquer_atividade':
      return permissoes.podeEditarQualquerAtividade;
    default:
      return false;
  }
} 