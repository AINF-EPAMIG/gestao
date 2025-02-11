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
  
  // Ajusta a posição baseada no ângulo
  let adjustX = 0;
  let adjustY = 0;
  let textAnchor = "middle";
  
  // Ajusta posição baseada no ângulo para manter sempre nas extremidades
  if (payload.angle === 0) {
    adjustX = 80;
    adjustY = 0;
    textAnchor = "start";
  } else if (payload.angle === 90) {
    adjustX = 0;
    adjustY = 60;
  } else if (payload.angle === 180) {
    adjustX = -80;
    adjustY = 0;
    textAnchor = "end";
  } else if (payload.angle === 270) {
    adjustX = 0;
    adjustY = -60;
  }

  return (
    <g transform={`translate(${x + adjustX},${y + adjustY})`}>
      <foreignObject 
        x="-50" 
        y="-12" 
        width="100" 
        height="24" 
        style={{ overflow: 'visible' }}
      >
        <div className={`flex items-center gap-2 bg-white rounded-full px-2 py-1 w-fit shadow-sm ${
          textAnchor === "end" ? "justify-end" : 
          textAnchor === "start" ? "justify-start" : 
          "justify-center"
        }`}>
          <Avatar className="w-5 h-5 shrink-0">
            <AvatarImage email={email} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium whitespace-nowrap">{name}</span>
        </div>
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
    <div className="h-[500px] w-full p-8">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="65%" 
          data={data}
          margin={{ top: 60, right: 60, bottom: 60, left: 60 }}
        >
          <PolarGrid gridType="circle" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={CustomAxisTick}
            tickSize={30}
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

