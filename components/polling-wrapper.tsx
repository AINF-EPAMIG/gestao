"use client"

import { useEffect } from "react"
import { useTaskStore, useTaskPolling } from "@/lib/store"

export function PollingWrapper({ children }: { children: React.ReactNode }) {
  const fetchTasks = useTaskStore((state) => state.fetchTasks)

  // Ativa o polling
  useTaskPolling();

  // Busca inicial
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return <>{children}</>;
} 