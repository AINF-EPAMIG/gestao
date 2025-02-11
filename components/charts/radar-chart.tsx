"use client"

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo, useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Componente customizado para renderizar os labels com avatar e nome
const CustomAxisTick = ({ x, y, payload }: any) => {
  const email = payload.value.toLowerCase().replace(' ', '.') + '@epamig.br'
  const name = payload.value
  
  // Calcula a posição relativa ao centro
  const cx = 250 // centro do gráfico
  const cy = 250 // centro do gráfico
  const radius = 180 // raio para posicionar os labels
  
  // Calcula o ângulo em radianos
  const angle = (-payload.angle * Math.PI) / 180
  
  // Calcula a posição final
  const fx = cx + radius * Math.cos(angle) - 60 // -60 para ajustar o offset do texto
  const fy = cy + radius * Math.sin(angle) - 20 // -20 para centralizar verticalmente

  return (
    <foreignObject x={fx} y={fy} width="120" height="40">
      <div className="flex items-center gap-2 bg-white/80 rounded-full px-2 py-1">
        <Avatar className="w-6 h-6">
          <AvatarImage email={email} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium whitespace-nowrap">{name}</span>
      </div>
    </foreignObject>
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
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx={250} cy={250} outerRadius={150} data={data}>
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

