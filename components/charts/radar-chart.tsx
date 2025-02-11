"use client"

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo, useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Componente customizado para renderizar os labels com avatar
const CustomAxisTick = ({ x, y, payload }: any) => {
  const email = payload.value.toLowerCase().replace(' ', '.') + '@epamig.br'
  
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x="-15" y="-15" width="30" height="30">
        <Avatar className="w-6 h-6">
          <AvatarImage email={email} />
          <AvatarFallback>{payload.value[0]}</AvatarFallback>
        </Avatar>
      </foreignObject>
    </g>
  );
};

export function RadarChart() {
  const [isLoading, setIsLoading] = useState(true)
  const tasks = useTaskStore((state) => state.tasks)

  const data = useMemo(() => {
    const assigneeCounts = tasks.reduce((acc, task) => {
      if (task.responsavel_email) {
        const name = task.responsavel_email.split('@')[0].replace('.', ' ')
        acc[name] = (acc[name] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return Object.entries(assigneeCounts).map(([subject, count]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      A: count,
    }))
  }, [tasks])

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
          <PolarAngleAxis 
            dataKey="subject" 
            tick={CustomAxisTick}
          />
          <Radar 
            name="Tarefas" 
            dataKey="A" 
            stroke="#10b981" 
            fill="#10b981" 
            fillOpacity={0.6} 
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}

