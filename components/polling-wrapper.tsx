"use client"

import { useEffect } from "react"
import { useTaskStore } from "@/lib/store"
import { useSession } from "next-auth/react"

export function PollingWrapper({ children }: { children: React.ReactNode }) {
  const setTasks = useTaskStore((state) => state.setTasks)
  const selectedSetor = useTaskStore((state) => state.selectedSetor)
  const { data: session } = useSession()

  useEffect(() => {
    const fetchTasks = async () => {
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

    // Buscar tarefas inicialmente
    fetchTasks();

    // Configurar polling a cada 2 segundos para manter os dados sempre atualizados
    const interval = setInterval(fetchTasks, 2000);

    return () => clearInterval(interval);
  }, [setTasks, session?.user?.email, selectedSetor]);

  return children;
} 