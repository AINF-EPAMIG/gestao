"use client"

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo, useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function RadarChart() {
  const [isLoading, setIsLoading] = useState(true)
  const getAssigneeDistribution = useTaskStore((state) => state.getAssigneeDistribution)
  const tasks = useTaskStore((state) => state.tasks)

  const data = useMemo(() => getAssigneeDistribution(), [getAssigneeDistribution])

  useEffect(() => {
    if (tasks.length > 0) {
      setIsLoading(false)
    }
  }, [tasks])

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Skeleton className="h-[250px] w-[250px] rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <Radar name="Tarefas" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}

