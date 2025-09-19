"use client"

import { useState, useEffect, useCallback } from 'react';
import { fetchTaskEtapasWithCache, calculateProgress, invalidateTaskEtapasCache, type Etapa } from '@/lib/etapas-utils';
import { taskEventEmitter, TASK_EVENTS } from '@/lib/task-events';

interface UseTaskProgressReturn {
  progress: number;
  etapas: Etapa[];
  loading: boolean;
  hasEtapas: boolean;
  refreshProgress: () => void;
}

export function useTaskProgress(taskId: number): UseTaskProgressReturn {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshProgress = useCallback(() => {
    invalidateTaskEtapasCache(taskId);
    setRefreshTrigger(prev => prev + 1);
  }, [taskId]);

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
  }, [taskId, refreshTrigger]);

  // Escuta eventos de mudanças nas etapas
  useEffect(() => {
    const unsubscribe = taskEventEmitter.subscribe(TASK_EVENTS.ETAPAS_UPDATED, (updatedTaskId) => {
      if (updatedTaskId === taskId) {
        refreshProgress();
      }
    });

    return unsubscribe;
  }, [taskId, refreshProgress]);

  const progress = calculateProgress(etapas);
  const hasEtapas = etapas.length > 0;

  return {
    progress,
    etapas,
    loading,
    hasEtapas,
    refreshProgress
  };
}
