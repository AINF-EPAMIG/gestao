/**
 * Hook específico para a página de dashboard/inicial
 * Evita problemas de carregamento infinito ao trocar setores
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTaskStore } from '@/lib/store';

export function useDashboardData() {
  const { data: session } = useSession();
  const tasks = useTaskStore((state) => state.tasks);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) {
      setIsLoading(true);
      setHasLoadedOnce(false);
      return;
    }

    if (!hasLoadedOnce) {
      // Primeira carga: aguarda um tempo mínimo para carregar dados
      const timer = setTimeout(() => {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // Cargas subsequentes: remove loading mais rapidamente
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [session?.user?.email, hasLoadedOnce]);

  // Reset quando a sessão muda
  useEffect(() => {
    if (!session?.user?.email) {
      setHasLoadedOnce(false);
      setIsLoading(true);
    }
  }, [session?.user?.email]);

  return {
    isLoading,
    tasks,
    hasData: tasks.length > 0 || hasLoadedOnce // Permite mostrar dashboard mesmo sem dados
  };
}