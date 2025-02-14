"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Task } from "@/lib/store"
import { useMemo } from "react"
import { getUserIcon } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TasksAreaChartProps {
  tasks: Task[]
}

const COLORS = {
  primary: {
    fill: "#9DC08B",    // Verde mais escuro
    stroke: "#609966"
  },
  secondary: {
    fill: "#D0E7D2",    // Verde mais claro
    stroke: "#9DC08B"
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
        <p className="text-sm font-medium mt-1">
          {data.total} tarefas
        </p>
      </div>
    )
  }
  return null
}

export function TasksAreaChart({ tasks }: TasksAreaChartProps) {
  const data = useMemo(() => {
    const tasksByMonthAndUser = tasks.reduce((acc, task) => {
      if (!task.data_inicio || !task.responsavel_email) return acc

      const date = new Date(task.data_inicio)
      const monthYear = date.toISOString().slice(0, 7) // Format: YYYY-MM
      const responsavel = task.responsavel_email

      const key = `${monthYear}-${responsavel}`
      if (!acc[key]) {
        acc[key] = {
          date: monthYear,
          responsavel,
          total: 0
        }
      }
      acc[key].total++
      return acc
    }, {} as Record<string, { date: string; responsavel: string; total: number }>)

    return Object.values(tasksByMonthAndUser)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [tasks])

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary.fill} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.primary.fill} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.secondary.fill} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.secondary.fill} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { 
              month: 'short',
              year: '2-digit'
            })}
            stroke="#6B7280"
          />
          <YAxis 
            allowDecimals={false} 
            stroke="#6B7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke={COLORS.primary.stroke}
            fill="url(#colorPrimary)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
} 