"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Task } from "@/lib/store"
import { useMemo } from "react"
import { getUserIcon } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TasksAreaChartProps {
  tasks: Task[]
}

const COLORS = {
  created: {
    fill: "#3b82f6",    // Azul
    stroke: "#2563eb"
  },
  completed: {
    fill: "#10b981",    // Verde
    stroke: "#059669"
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getUserIcon(data.responsavel)} />
            <AvatarFallback>
              {data.responsavel?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <p className="font-medium">
            {data.responsavel?.split('@')[0].split('.').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          {new Date(data.date).toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
        <div className="mt-2 space-y-1">
          <p className="text-sm">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            Novas: {data.created} tarefas
          </p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            Concluídas: {data.completed} tarefas
          </p>
        </div>
      </div>
    )
  }
  return null
}

const CustomXAxisTick = ({ x, y, payload }: any) => {
  const email = payload.value
  const name = email.split('@')[0].split('.').map((word: string) => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x="-12" y="10" width="24" height="24">
        <div className="flex justify-center">
          <Avatar className="w-6 h-6">
            <AvatarImage src={getUserIcon(email)} />
            <AvatarFallback>{email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
        </div>
      </foreignObject>
    </g>
  )
}

export function TasksAreaChart({ tasks }: TasksAreaChartProps) {
  const data = useMemo(() => {
    const tasksByUser = tasks.reduce((acc, task) => {
      if (!task.responsavel_email) return acc

      const responsavel = task.responsavel_email
      
      if (!acc[responsavel]) {
        acc[responsavel] = {
          responsavel,
          created: 0,
          completed: 0
        }
      }

      if (task.data_inicio) {
        acc[responsavel].created++
      }

      if (task.data_conclusao) {
        acc[responsavel].completed++
      }

      return acc
    }, {} as Record<string, { responsavel: string; created: number; completed: number }>)

    return Object.values(tasksByUser)
  }, [tasks])

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barGap={0}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="responsavel"
            tick={<CustomXAxisTick />}
            height={60}
            interval={0}
          />
          <YAxis allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top"
            height={36}
          />
          <Bar
            name="Novas Tarefas"
            dataKey="created"
            fill={COLORS.created.fill}
            stroke={COLORS.created.stroke}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            name="Tarefas Concluídas"
            dataKey="completed"
            fill={COLORS.completed.fill}
            stroke={COLORS.completed.stroke}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 