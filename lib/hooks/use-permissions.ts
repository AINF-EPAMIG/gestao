/**
 * Hooks para gerenciamento de permissões baseadas em nível hierárquico
 */

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { NivelHierarquico, PermissoesUsuario, Funcionario } from '@/lib/types';
import { useUserSector } from '@/lib/user-sector-context';

export interface UsePermissionsReturn {
  user: Funcionario | null;
  nivel: NivelHierarquico | null;
  permissions: PermissoesUsuario | null;
  isLoading: boolean;
  
  // Verificações de permissão
  canViewAllSectors: boolean;
  canCreateProjects: boolean;
  canDeleteActivities: boolean;
  canEditAnyActivity: boolean;
  
  // Verificações de nível
  isColaborador: boolean;
  isChefe: boolean;
  isPresidente: boolean;
  isDiretoria: boolean;
  
  // Funções utilitárias
  hasMinimumLevel: (level: NivelHierarquico) => boolean;
  canAccessSector: (sector: string) => boolean;
}

/**
 * Hook principal para gerenciar permissões do usuário
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session } = useSession();
  const { userLevel, permissions, isLoading: contextLoading } = useUserSector();
  const [user, setUser] = useState<Funcionario | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (session?.user?.email && !contextLoading) {
        try {
          const response = await fetch(`/api/funcionarios?action=userInfo&email=${encodeURIComponent(session.user.email)}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      }
    }

    // Só busca dados do usuário se o contexto não estiver carregando
    if (!contextLoading && session?.user?.email) {
      fetchUserData();
    }
  }, [session?.user?.email, contextLoading]);

  // Verificações de permissão
  const canViewAllSectors = permissions?.podeVisualizarTodosSetores ?? false;
  const canCreateProjects = permissions?.podeCriarProjetos ?? false;
  const canDeleteActivities = permissions?.podeExcluirAtividades ?? false;
  const canEditAnyActivity = permissions?.podeEditarQualquerAtividade ?? false;

  // Verificações de nível
  const isColaborador = userLevel === NivelHierarquico.COLABORADOR;
  const isChefe = userLevel === NivelHierarquico.CHEFE;
  const isPresidente = userLevel === NivelHierarquico.PRESIDENTE;
  const isDiretoria = userLevel === NivelHierarquico.DIRETORIA;

  // Função para verificar nível mínimo
  const hasMinimumLevel = (level: NivelHierarquico): boolean => {
    if (!userLevel) return false;
    
    const levelHierarchy = {
      [NivelHierarquico.COLABORADOR]: 1,
      [NivelHierarquico.CHEFE]: 2,
      [NivelHierarquico.PRESIDENTE]: 3,
      [NivelHierarquico.DIRETORIA]: 4
    };

    const currentLevel = levelHierarchy[userLevel];
    const requiredLevel = levelHierarchy[level];
    
    return currentLevel >= requiredLevel;
  };

  // Função para verificar acesso a setor
  const canAccessSector = (sector: string): boolean => {
    if (!permissions) return false;
    
    // Se pode visualizar todos os setores
    if (permissions.podeVisualizarTodosSetores) return true;
    
    // Verifica se está na lista de setores permitidos
    return permissions.setoresPermitidos.includes('*') || 
           permissions.setoresPermitidos.includes(sector);
  };

  return {
    user,
    nivel: userLevel,
    permissions,
    isLoading: contextLoading, // Usa apenas o loading do contexto
    
    canViewAllSectors,
    canCreateProjects,
    canDeleteActivities,
    canEditAnyActivity,
    
    isColaborador,
    isChefe,
    isPresidente,
    isDiretoria,
    
    hasMinimumLevel,
    canAccessSector
  };
}

/**
 * Hook simples para verificar se o usuário é chefe ou superior
 */
export function useIsChefePlus(): boolean {
  const { nivel } = usePermissions();
  return nivel === NivelHierarquico.CHEFE || 
         nivel === NivelHierarquico.PRESIDENTE || 
         nivel === NivelHierarquico.DIRETORIA;
}

/**
 * Hook simples para verificar se o usuário é presidente ou superior
 */
export function useIsPresidentePlus(): boolean {
  const { nivel } = usePermissions();
  return nivel === NivelHierarquico.PRESIDENTE || 
         nivel === NivelHierarquico.DIRETORIA;
}

/**
 * Hook para verificar se o usuário pode gerenciar projetos
 */
export function useCanManageProjects(): boolean {
  const { canCreateProjects } = usePermissions();
  return canCreateProjects;
}

/**
 * Hook para verificar se o usuário pode gerenciar atividades
 */
export function useCanManageActivities(): boolean {
  const { canDeleteActivities, canEditAnyActivity } = usePermissions();
  return canDeleteActivities || canEditAnyActivity;
}

/**
 * Hook para verificar se o usuário pode ver dados de todos os setores
 */
export function useCanViewAllSectors(): boolean {
  const { canViewAllSectors } = usePermissions();
  return canViewAllSectors;
}