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
    fill: "#1B4332",    // Verde escuro
    stroke: "#1B4332"
  },
  completed: {
    fill: "#40916C",    // Verde mais claro
    stroke: "#40916C"
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
      <foreignObject x="-60" y="10" width="120" height="50">
        <div className="flex flex-col items-center gap-1">
          <Avatar className="w-6 h-6">
            <AvatarImage src={getUserIcon(email)} />
            <AvatarFallback>{email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-gray-600 whitespace-normal text-center">
            {name}
          </span>
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
          completed: 0,
          order: 0
        }
      }

      if (task.data_inicio) {
        acc[responsavel].created++
      }

      if (task.data_conclusao) {
        acc[responsavel].completed++
      }

      return acc
    }, {} as Record<string, { responsavel: string; created: number; completed: number; order: number }>)

    return Object.values(tasksByUser)
      .sort((a, b) => b.created + b.completed - (a.created + a.completed))
      .map((item, index) => ({ ...item, order: index }))
  }, [tasks])

  // Formatação das datas para o eixo X
  const dateFormatter = (date: Date) => {
    const mes = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    const dia = date.getDate()
    return `${mes} ${dia}`
  }

  // Gerar marcas de tempo para o eixo X secundário
  const getTimeMarks = () => {
    const datas = tasks
      .map(task => [task.data_inicio, task.data_conclusao])
      .flat()
      .filter(Boolean)
      .map(date => new Date(date as string))

    if (datas.length === 0) return []

    const dataInicial = new Date(Math.min(...datas.map(d => d.getTime())))
    const dataFinal = new Date(Math.max(...datas.map(d => d.getTime())))
    
    // Gerar marcas a cada 5 dias
    const marcas = []
    let currentDate = new Date(dataInicial)
    while (currentDate <= dataFinal) {
      marcas.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 5)
    }
    
    return marcas
  }

  const timeMarks = getTimeMarks()

  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
          barGap={4}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="responsavel"
            tick={<CustomXAxisTick />}
            height={60}
            interval={0}
            xAxisId="responsaveis"
          />
          <XAxis
            xAxisId="datas"
            orientation="bottom"
            tickFormatter={dateFormatter}
            ticks={timeMarks.map(d => d.getTime())}
            type="number"
            domain={[timeMarks[0]?.getTime(), timeMarks[timeMarks.length - 1]?.getTime()]}
            height={30}
            tickSize={8}
            tickMargin={5}
            stroke="#9CA3AF"
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            allowDecimals={false}
            label={{ 
              value: 'Quantidade de Tarefas', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
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