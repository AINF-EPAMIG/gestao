"use client"

import { useTaskStore, getStatusName } from "@/lib/store"
import { useMemo, useState, useEffect, memo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"

// Tipos para o gráfico
interface ChartData {
  email: string
  nome: string
  primeiroNome: string
  "Total criadas": number
  "Em desenvolvimento": number
  "Concluída": number
}

interface CustomTickProps {
  x: number
  y: number
  payload: {
    value: string
  }
  email: string
  primeiroNome: string
}

interface AxisTickProps {
  x: number
  y: number
  payload: {
    value: string
  }
}

// Esquema de cores com maior contraste, mantendo o verde institucional
const CHART_COLORS = {
  total: "#7c3aed",      // Roxo para total
  desenvolvimento: "#2563eb", // Azul vibrante para desenvolvimento
  concluida: "#00714B",  // Verde institucional para concluídas
} as const

// Componente memoizado para o Avatar
const MemoizedAvatar = memo(function MemoizedAvatar({ email }: { email: string }) {
  return (
    <Avatar className="w-10 h-10 border-2 border-white">
      <AvatarImage email={email} />
      <AvatarFallback>
        {email[0].toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
})

// Componente memoizado para o CustomXAxisTick
const CustomXAxisTick = memo(function CustomXAxisTick({ x, y, email, primeiroNome }: CustomTickProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x="-35" y="10" width="70" height="70">
        <div className="flex flex-col items-center">
          <MemoizedAvatar email={email} />
          <span className="text-xs mt-1 font-medium text-gray-700">
            {primeiroNome}
          </span>
        </div>
      </foreignObject>
    </g>
  )
})

export function TasksByStatusChart() {
  const tasks = useTaskStore((state) => state.tasks)
  const [isLoading, setIsLoading] = useState(true)

  // Efeito para controlar o estado de carregamento
  useEffect(() => {
    if (tasks.length > 0) {
      // Quando as tarefas são carregadas, desativa o loader
      setIsLoading(false)
    }
  }, [tasks])

  const data = useMemo(() => {
    const tasksByResponsavel = tasks.reduce((acc, task) => {
      if (!task.responsaveis || task.responsaveis.length === 0) {
        return acc
      }

      task.responsaveis.forEach(resp => {
        const email = resp.email
        
        // Pular Andrezza Fernandes
        if (email === "andrezza.fernandes@epamig.br" || 
            email.toLowerCase().includes("andrezza") || 
            (resp.nome && resp.nome.toLowerCase().includes("andrezza"))) {
          return;
        }
        
        const nome = resp.nome || email.split('@')[0].replace('.', ' ')
        const primeiroNome = nome.split(' ')[0]
        
        if (!acc[email]) {
          acc[email] = {
            email,
            nome,
            primeiroNome,
            "Total criadas": 0,
            "Em desenvolvimento": 0,
            "Concluída": 0
          }
        }

        // Incrementa o total de tarefas criadas
        acc[email]["Total criadas"]++

        // Incrementa apenas se estiver em desenvolvimento ou concluída
        const status = getStatusName(task.status_id)
        if (status === "Em desenvolvimento" || status === "Concluída") {
          acc[email][status]++
        }
      })

      return acc
    }, {} as Record<string, ChartData>)

    return Object.values(tasksByResponsavel)
  }, [tasks])

  const renderCustomAxisTick = (props: AxisTickProps) => {
    const item = data.find(d => d.email === props.payload.value)
    if (!item) return <g />

    return (
      <CustomXAxisTick 
        {...props} 
        email={item.email}
        primeiroNome={item.primeiroNome.charAt(0).toUpperCase() + item.primeiroNome.slice(1).toLowerCase()}
      />
    )
  }

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload as ChartData
    return (
      <div className="bg-white p-3 border border-[#00714B]/20 rounded-lg shadow-lg">
        <p className="font-medium mb-2 text-[#00714B]">{data.nome}</p>
        {payload.map((entry) => (
          <div 
            key={entry.name} 
            className="flex items-center gap-2 text-sm"
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white p-4 rounded-lg border flex items-center justify-center hidden sm:flex" style={{ height: "350px" }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full bg-white p-3 rounded-lg border hidden sm:block">
      <h3 className="text-lg font-semibold mb-3 text-[#00714B]">Análise de Tarefas por Responsável</h3>
      <div className="w-full h-[350px] overflow-x-auto md:overflow-x-hidden">
        <ResponsiveContainer width="100%" height="100%" minWidth={data.length * 80}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 20,
              left: 10,
              bottom: 90
            }}
            barGap={2}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="email" 
              tick={renderCustomAxisTick}
              interval={0}
              height={90}
            />
            <YAxis stroke="#64748b" />
            <Tooltip 
              cursor={{ fill: 'rgba(0, 113, 75, 0.05)' }}
              content={<CustomTooltip />}
            />
            <Legend 
              verticalAlign="top"
              height={32}
              wrapperStyle={{
                paddingBottom: "15px"
              }}
            />
            <Bar 
              dataKey="Total criadas" 
              fill={CHART_COLORS.total}
              name="Total criadas" 
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
            <Bar 
              dataKey="Em desenvolvimento" 
              fill={CHART_COLORS.desenvolvimento}
              name="Em Desenvolvimento" 
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
            <Bar 
              dataKey="Concluída" 
              fill={CHART_COLORS.concluida}
              name="Concluídas" 
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 