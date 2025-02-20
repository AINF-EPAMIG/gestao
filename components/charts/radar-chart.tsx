"use client"

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo, useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getUserIcon } from "@/lib/utils"

interface CustomAxisTickProps {
  x: number
  y: number
  payload: {
    value: string
    email: string
    angle: number
  }
}

const CustomAxisTick = ({ x, y, payload }: CustomAxisTickProps) => {
  const name = payload.value;
  const email = payload.email;

  let adjustX = 0;
  let adjustY = 0;
  let textAnchor = "middle";

  if (payload.angle === 0) {
    adjustX = 30;
    textAnchor = "start";
  } else if (payload.angle === 90) {
    adjustY = 30;
  } else if (payload.angle === 180) {
    adjustX = -30;
    textAnchor = "end";
  } else if (payload.angle === 270) {
    adjustY = -30;
  }

  return (
    <g transform={`translate(${x + adjustX},${y + adjustY})`}>
      <foreignObject x="-50" y="-12" width="100" height="24" style={{ overflow: "visible" }}>
        <div
          className={`flex items-center gap-2 bg-white rounded-full px-2 py-1 w-fit shadow-sm ${
            textAnchor === "end" ? "justify-end" : textAnchor === "start" ? "justify-start" : "justify-center"
          }`}
        >
          <Avatar className="w-5 h-5 shrink-0">
            <AvatarImage src={getUserIcon(email)} />
            <AvatarFallback>{email[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px] sm:max-w-[80px]">
            {name}
          </span>
        </div>
      </foreignObject>
    </g>
  )
}

export function RadarChart() {
  const [isLoading, setIsLoading] = useState(true)
  const tasks = useTaskStore((state) => state.tasks)

  const data = useMemo(() => {
    const assigneeCounts = tasks.reduce(
      (acc, task) => {
        (task.responsaveis ?? []).forEach(responsavel => {
          const name = responsavel.nome || responsavel.email.split('@')[0].replace('.', ' ');
          const email = responsavel.email;
          acc[email] = {
            name,
            email,
            count: (acc[email]?.count || 0) + 1
          };
        });
        return acc;
      },
      {} as Record<string, { name: string; email: string; count: number }>,
    )

    return Object.values(assigneeCounts).map(({ name, email, count }) => ({
      subject: name,
      email: email,
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
      <div className="w-full h-full flex items-center justify-center">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
        <PolarGrid />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={(props) => <CustomAxisTick {...props} payload={{ ...props.payload, email: data[props.index]?.email }} />}
          tickSize={30} 
        />
        <Radar name="Tarefas" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}

