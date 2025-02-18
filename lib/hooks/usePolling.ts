import { useEffect, useRef, useCallback } from 'react';

export function usePolling(callback: () => Promise<void>, interval: number = 1000) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const poll = useCallback(async () => {
    try {
      await callback();
    } catch (error) {
      console.error('Erro no polling:', error);
    } finally {
      // Agenda a próxima execução
      timeoutRef.current = setTimeout(poll, interval);
    }
  }, [callback, interval]);

  useEffect(() => {
    // Executa imediatamente na primeira vez
    poll();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [poll]);
} 