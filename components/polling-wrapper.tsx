"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useTaskStore } from "@/lib/store"
import { useChamadosStore } from "@/lib/chamados-store"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

// Criar contexto para controlar o polling
interface PollingContextType {
  isPaused: boolean;
  pausePolling: () => void;
  resumePolling: () => void;
}

const PollingContext = createContext<PollingContextType>({
  isPaused: false,
  pausePolling: () => {},
  resumePolling: () => {}
});

// Hook para usar o contexto de polling
export const usePolling = () => useContext(PollingContext);

export function PollingWrapper({ children }: { children: React.ReactNode }) {
  const setTasks = useTaskStore((state) => state.setTasks)
  const fetchChamados = useChamadosStore((state) => state.fetchChamados)
  const selectedSetor = useTaskStore((state) => state.selectedSetor)
  const { data: session } = useSession()
  const [isPaused, setIsPaused] = useState(false)
  const pathname = usePathname()

  const pausePolling = () => setIsPaused(true);
  const resumePolling = () => setIsPaused(false);

  useEffect(() => {
    const fetchData = async () => {
      // Se o polling estiver pausado, não busca os dados
      if (isPaused) return;
      
      try {
        if (!session?.user?.email) return;

        // Verificar qual página estamos e chamar a API correspondente
        if (pathname?.includes('/chamados')) {
          // Na página de chamados
          await fetchChamados();
        } else {
          // Na página kanban ou outras páginas com tarefas
          const params = new URLSearchParams({
            userEmail: session.user.email
          });

          if (selectedSetor) {
            params.append('setorSigla', selectedSetor);
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
        console.error('Erro ao buscar dados:', error);
      }
    };

    // Buscar dados inicialmente (mesmo se estiver pausado)
    if (!isPaused) {
      fetchData();
    }

    // Configurar polling a cada 2 segundos para manter os dados sempre atualizados
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [setTasks, fetchChamados, session?.user?.email, selectedSetor, isPaused, pathname]);

  return (
    <PollingContext.Provider value={{ isPaused, pausePolling, resumePolling }}>
      {children}
    </PollingContext.Provider>
  );
} 