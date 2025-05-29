"use client"

import { useTaskStore, getStatusName } from "@/lib/store"
import { useMemo, useState, useEffect, memo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { SYSTEM_CONFIG, getMinimumTasksThreshold, formatPercentage } from "@/lib/constants"

// Tipos para o gráfico
interface ChartData {
  email: string
  nome: string
  primeiroNome: string
  "Total criadas": number
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

// Cores alinhadas com o gráfico "Atividades no Kanban"
const CHART_COLORS = {
  total: "#3b82f6",     // Azul - mesma cor do gráfico de atividades
  concluida: "#22c55e"  // Verde - mesma cor do gráfico de atividades
} as const

// Componente memoizado para o Avatar
const MemoizedAvatar = memo(function MemoizedAvatar({ email }: { email: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset imageLoaded when email changes
  useEffect(() => {
    setImageLoaded(false);
  }, [email]);
  
  // Formatação do email para garantir que tenha o domínio
  const formattedEmail = useMemo(() => {
    if (!email) return undefined;
    return email.includes('@') ? email : `${email}@epamig.br`;
  }, [email]);
  
  return (
    <Avatar className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9 border-2 border-white">
      <AvatarImage 
        key={formattedEmail} // Add key to force re-render when email changes
        email={formattedEmail}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
      />
      <AvatarFallback>
        {!imageLoaded && (email ? email[0].toUpperCase() : '?')}
      </AvatarFallback>
    </Avatar>
  )
})

// Componente memoizado para o CustomXAxisTick
const CustomXAxisTick = memo(function CustomXAxisTick({ x, y, email, primeiroNome }: CustomTickProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x="-22" y="10" width="44" height="55">
        <div className="flex flex-col items-center">
          <MemoizedAvatar email={email} />
          <span className="text-[8px] sm:text-[9px] md:text-xs mt-1 font-medium text-gray-700 truncate max-w-[44px]">
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

  const { chartData, totalUsers, minimumTasksThreshold } = useMemo(() => {
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
            "Concluída": 0
          }
        }

        // Incrementa o total de tarefas criadas
        acc[email]["Total criadas"]++

        // Incrementa apenas se estiver concluída
        const status = getStatusName(task.status_id)
        if (status === "Concluída") {
          acc[email][status]++
        }
      })

      return acc
    }, {} as Record<string, ChartData>)

    // Contar total de usuários
    const totalUsers = Object.keys(tasksByResponsavel).length
    
    // Calcular o total de tarefas
    const totalTasks = tasks.length
    
    // Calcular o limite mínimo usando a função utilitária (5% das tarefas totais)
    const minimumTasksThreshold = getMinimumTasksThreshold(totalTasks)

    // Filtrar apenas usuários relevantes (com pelo menos 5% das tarefas)
    const filteredData = Object.values(tasksByResponsavel).filter(
      user => user["Total criadas"] >= minimumTasksThreshold
    )

    return {
      chartData: filteredData,
      totalUsers,
      minimumTasksThreshold
    }
  }, [tasks])

  const renderCustomAxisTick = (props: AxisTickProps) => {
    const item = chartData.find(d => d.email === props.payload.value)
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
      <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg text-[10px] sm:text-xs md:text-sm">
        <p className="font-medium mb-1 sm:mb-2 text-gray-800">{data.nome}</p>
        {payload.map((entry) => (
          <div 
            key={entry.name} 
            className="flex items-center gap-1 sm:gap-2"
          >
            <div 
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
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
      <div className="w-full h-[350px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full h-[220px] sm:h-[250px] md:h-[280px] lg:h-[320px] overflow-x-auto">
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 min-w-[320px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={chartData.length * 50}>
            <BarChart
              data={chartData}
              margin={{
                top: 15,
                right: 5,
                left: 0,
                bottom: 65
              }}
              barGap={2}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="email" 
                tick={renderCustomAxisTick}
                interval={0}
                height={65}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fontSize: 9 }}
                width={22}
                tickFormatter={(value) => value.toString()}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                content={<CustomTooltip />}
              />
              <Legend 
                verticalAlign="top"
                height={20}
                wrapperStyle={{
                  paddingBottom: "8px",
                  fontSize: "10px"
                }}
              />
              <Bar 
                dataKey="Total criadas" 
                fill={CHART_COLORS.total}
                name="Total criadas" 
                radius={[3, 3, 0, 0]}
                opacity={0.8}
              />
              <Bar 
                dataKey="Concluída" 
                fill={CHART_COLORS.concluida}
                name="Concluídas" 
                radius={[3, 3, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 text-center mt-1 mb-1 px-2">
          Exibindo {chartData.length} de {totalUsers} usuários (≥{minimumTasksThreshold} tarefas - {formatPercentage(SYSTEM_CONFIG.RADAR_CHART_MIN_PERCENTAGE)} do total)
        </div>
      </div>
    </div>
  )
} 