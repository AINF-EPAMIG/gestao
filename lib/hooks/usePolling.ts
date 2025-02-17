import { useEffect, useRef } from 'react';

export function usePolling(callback: () => Promise<void>, interval: number = 60000) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const poll = async () => {
      try {
        await callback();
      } catch (error) {
        console.error('Erro no polling:', error);
      } finally {
        // Agenda a próxima execução
        timeoutRef.current = setTimeout(poll, interval);
      }
    };

    // Inicia o polling
    poll();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, interval]);
} 