/**
 * Middleware de autorização para controlar acesso baseado em nível hierárquico
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { executeQueryFuncionarios } from './db';
import { Funcionario, NivelHierarquico } from './types';
import { determinarNivelHierarquico, verificarPermissao } from './auth-config';

// Interface para resposta de autorização
export interface AuthorizationResult {
  authorized: boolean;
  user?: Funcionario;
  nivel?: NivelHierarquico;
  message?: string;
}

/**
 * Busca informações do usuário pela sessão
 */
export async function getUserFromSession(): Promise<Funcionario | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return null;
    }

    const result = await executeQueryFuncionarios<Funcionario[]>({
      query: 'SELECT * FROM vw_colaboradores_completos WHERE email = ? LIMIT 1',
      values: [session.user.email],
    });

    return result[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário da sessão:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem permissão para uma ação específica
 */
export async function checkPermission(
  request: NextRequest,
  permission: 'visualizar_todos_setores' | 'criar_projetos' | 'excluir_atividades' | 'editar_qualquer_atividade'
): Promise<AuthorizationResult> {
  const user = await getUserFromSession();
  
  if (!user) {
    return {
      authorized: false,
      message: 'Usuário não autenticado'
    };
  }

  const nivel = determinarNivelHierarquico(user);
  const hasPermission = verificarPermissao(user, permission);

  return {
    authorized: hasPermission,
    user,
    nivel,
    message: hasPermission ? 'Acesso autorizado' : 'Permissão insuficiente'
  };
}

/**
 * Verifica se o usuário tem nível mínimo necessário
 */
export async function checkMinimumLevel(
  request: NextRequest,
  minimumLevel: NivelHierarquico
): Promise<AuthorizationResult> {
  const user = await getUserFromSession();
  
  if (!user) {
    return {
      authorized: false,
      message: 'Usuário não autenticado'
    };
  }

  const nivel = determinarNivelHierarquico(user);
  
  // Hierarquia: Colaborador < Chefe < Presidente < Diretoria
  const levelHierarchy = {
    [NivelHierarquico.COLABORADOR]: 1,
    [NivelHierarquico.CHEFE]: 2,
    [NivelHierarquico.PRESIDENTE]: 3,
    [NivelHierarquico.DIRETORIA]: 4
  };

  const userLevel = levelHierarchy[nivel];
  const requiredLevel = levelHierarchy[minimumLevel];
  
  const authorized = userLevel >= requiredLevel;

  return {
    authorized,
    user,
    nivel,
    message: authorized ? 'Acesso autorizado' : `Nível ${minimumLevel} ou superior necessário`
  };
}

/**
 * Middleware para verificar se o usuário pode ver atividades de todos os setores
 */
export async function authorizeViewAllSectors(request: NextRequest) {
  return await checkPermission(request, 'visualizar_todos_setores');
}

/**
 * Middleware para verificar se o usuário pode criar projetos
 */
export async function authorizeCreateProjects(request: NextRequest) {
  return await checkPermission(request, 'criar_projetos');
}

/**
 * Middleware para verificar se o usuário pode excluir atividades
 */
export async function authorizeDeleteActivities(request: NextRequest) {
  return await checkPermission(request, 'excluir_atividades');
}

/**
 * Middleware para verificar se o usuário pode editar qualquer atividade
 */
export async function authorizeEditAnyActivity(request: NextRequest) {
  return await checkPermission(request, 'editar_qualquer_atividade');
}

/**
 * Middleware para verificar se o usuário é chefe ou superior
 */
export async function authorizeChefePlus(request: NextRequest) {
  return await checkMinimumLevel(request, NivelHierarquico.CHEFE);
}

/**
 * Middleware para verificar se o usuário é presidente ou superior
 */
export async function authorizePresidentePlus(request: NextRequest) {
  return await checkMinimumLevel(request, NivelHierarquico.PRESIDENTE);
}

/**
 * Middleware para verificar se o usuário é diretoria
 */
export async function authorizeDiretoria(request: NextRequest) {
  return await checkMinimumLevel(request, NivelHierarquico.DIRETORIA);
}

/**
 * Função helper para criar respostas de erro de autorização
 */
export function createUnauthorizedResponse(result: AuthorizationResult): NextResponse {
  return NextResponse.json(
    { 
      error: 'Acesso negado', 
      message: result.message,
      required: 'Permissão insuficiente'
    },
    { status: 403 }
  );
}

/**
 * Wrapper para APIs que precisam de autorização
 */
export function withAuthorization(
  handler: (request: NextRequest, user: Funcionario, nivel: NivelHierarquico) => Promise<NextResponse>,
  authCheck: (request: NextRequest) => Promise<AuthorizationResult>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authCheck(request);
    
    if (!authResult.authorized || !authResult.user || !authResult.nivel) {
      return createUnauthorizedResponse(authResult);
    }
    
    return handler(request, authResult.user, authResult.nivel);
  };
}