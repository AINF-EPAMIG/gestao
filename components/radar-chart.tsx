"use client"

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo } from "react"

export function RadarChart() {
  const getAssigneeDistribution = useTaskStore((state) => state.getAssigneeDistribution)

  const data = useMemo(() => getAssigneeDistribution(), [getAssigneeDistribution])

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

