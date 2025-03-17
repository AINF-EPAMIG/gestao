"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useTaskStore } from "@/lib/store"
import { useSession } from "next-auth/react"

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
  const selectedSetor = useTaskStore((state) => state.selectedSetor)
  const { data: session } = useSession()
  const [isPaused, setIsPaused] = useState(false)

  const pausePolling = () => setIsPaused(true);
  const resumePolling = () => setIsPaused(false);

  useEffect(() => {
    const fetchTasks = async () => {
      // Se o polling estiver pausado, não busca as tarefas
      if (isPaused) return;
      
      try {
        if (!session?.user?.email) return;

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
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
      }
    };

    // Buscar tarefas inicialmente (mesmo se estiver pausado)
    if (!isPaused) {
      fetchTasks();
    }

    // Configurar polling a cada 2 segundos para manter os dados sempre atualizados
    const interval = setInterval(fetchTasks, 2000);

    return () => clearInterval(interval);
  }, [setTasks, session?.user?.email, selectedSetor, isPaused]);

  return (
    <PollingContext.Provider value={{ isPaused, pausePolling, resumePolling }}>
      {children}
    </PollingContext.Provider>
  );
} 