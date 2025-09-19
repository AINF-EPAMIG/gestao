"use client"

import { useState, useEffect } from 'react';
import { fetchTaskEtapasWithCache, calculateProgress, type Etapa } from '@/lib/etapas-utils';

interface UseTaskProgressReturn {
  progress: number;
  etapas: Etapa[];
  loading: boolean;
  hasEtapas: boolean;
}

export function useTaskProgress(taskId: number): UseTaskProgressReturn {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchEtapas = async () => {
      try {
        setLoading(true);
        const taskEtapas = await fetchTaskEtapasWithCache(taskId);
        
        if (isMounted) {
          setEtapas(taskEtapas);
        }
      } catch (error) {
        console.error('Erro ao buscar etapas:', error);
        if (isMounted) {
          setEtapas([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEtapas();

    return () => {
      isMounted = false;
    };
  }, [taskId]);

  const progress = calculateProgress(etapas);
  const hasEtapas = etapas.length > 0;

  return {
    progress,
    etapas,
    loading,
    hasEtapas
  };
}
