/**
 * Hook para gerenciar navegação entre setores
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTaskStore } from '@/lib/store';
import { useChamadosStore } from '@/lib/chamados-store';
import { usePermissions } from './use-permissions';
import { usePathname } from 'next/navigation';

interface SetorInfo {
  sigla: string;
  nome: string;
  tipo: 'departamento' | 'divisao' | 'assessoria' | 'secao';
  count: number;
}

export function useSetorNavigation() {
  const { data: session } = useSession();
  const { canViewAllSectors, isLoading: permissionsLoading } = usePermissions();
  const selectedSetor = useTaskStore((state) => state.selectedSetor);
  const setSelectedSetor = useTaskStore((state) => state.setSelectedSetor);
  const setTasks = useTaskStore((state) => state.setTasks);
  const fetchChamados = useChamadosStore((state) => state.fetchChamados);
  const pathname = usePathname();

  const [setores, setSetores] = useState<SetorInfo[]>([]);
  const [isLoadingSetores, setIsLoadingSetores] = useState(true);

  // Buscar setores disponíveis
  const fetchSetores = useCallback(async () => {
    if (!session?.user?.email || permissionsLoading) return;

    try {
      setIsLoadingSetores(true);
      const response = await fetch('/api/setores-funcionarios');
      if (response.ok) {
        const data = await response.json();
        setSetores(data);
      }
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
    } finally {
      setIsLoadingSetores(false);
    }
  }, [session?.user?.email, permissionsLoading]);

  // Buscar dados para o setor selecionado
  const fetchDataForSetor = useCallback(async (setor: string | null) => {
    if (!session?.user?.email) return;

    try {
      if (pathname?.includes('/chamados')) {
        await fetchChamados();
      } else {
        const params = new URLSearchParams({
          userEmail: session.user.email,
          _t: Date.now().toString()
        });

        if (setor) {
          params.append('setorSigla', setor);
        }

        const response = await fetch(`/api/atividades?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados para o setor:', error);
    }
  }, [session?.user?.email, pathname, fetchChamados, setTasks]);

  // Mudar setor e buscar dados
  const changeSetor = useCallback(async (setor: string | null) => {
    setSelectedSetor(setor);
    await fetchDataForSetor(setor);
  }, [setSelectedSetor, fetchDataForSetor]);

  // Carregar setores quando a sessão estiver pronta
  useEffect(() => {
    fetchSetores();
  }, [fetchSetores]);

  // Buscar dados quando o setor mudar (apenas se não estiver na página de chamados)
  useEffect(() => {
    if (session?.user?.email && !pathname?.includes('/chamados')) {
      fetchDataForSetor(selectedSetor);
    }
  }, [selectedSetor, session?.user?.email, fetchDataForSetor, pathname]);

  return {
    setores,
    selectedSetor,
    changeSetor,
    canViewAllSectors,
    isLoadingSetores,
    refreshData: () => fetchDataForSetor(selectedSetor)
  };
}