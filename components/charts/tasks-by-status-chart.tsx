"use client"

import { useTaskStore, getStatusName } from "@/lib/store"
import { getUserIcon } from "@/lib/utils"
import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
}

// Esquema de cores com maior contraste, mantendo o verde institucional
const CHART_COLORS = {
  total: "#7c3aed",      // Roxo para total
  desenvolvimento: "#2563eb", // Azul vibrante para desenvolvimento
  concluida: "#00714B",  // Verde institucional para concluídas
} as const

export function TasksByStatusChart() {
  const tasks = useTaskStore((state) => state.tasks)

  const data = useMemo(() => {
    const tasksByResponsavel = tasks.reduce((acc, task) => {
      if (!task.responsaveis || task.responsaveis.length === 0) {
        return acc
      }

      task.responsaveis.forEach(resp => {
        const email = resp.email
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

  const CustomXAxisTick = (props: CustomTickProps) => {
    const { x, y, payload } = props
    const item = data.find(d => d.email === payload.value)
    if (!item) return null

    const primeiroNome = item.primeiroNome.charAt(0).toUpperCase() + item.primeiroNome.slice(1).toLowerCase()

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x="-45" y="10" width="90" height="80">
          <div className="flex flex-col items-center">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src={getUserIcon(item.email)} />
              <AvatarFallback>
                {item.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm mt-2 font-medium text-gray-700">
              {primeiroNome}
            </span>
          </div>
        </foreignObject>
      </g>
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

  return (
    <div className="w-full bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-[#00714B]">Análise de Tarefas por Responsável</h3>
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 100
            }}
            barGap={4}
            barCategoryGap="25%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="email" 
              tick={<CustomXAxisTick x={0} y={0} payload={{ value: "" }} />}
              interval={0}
              height={100}
            />
            <YAxis stroke="#64748b" />
            <Tooltip 
              cursor={{ fill: 'rgba(0, 113, 75, 0.05)' }}
              content={<CustomTooltip />}
            />
            <Legend 
              verticalAlign="top"
              height={36}
              wrapperStyle={{
                paddingBottom: "20px"
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