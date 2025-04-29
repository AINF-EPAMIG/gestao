"use client"
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo, useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

const COLORS = {
  "Em desenvolvimento": "#3b82f6",
  "Não iniciada": "#ef4444",
  Concluída: "#10b981",
  "Em testes": "#facc15",
}

const RADIAN = Math.PI / 180

interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  value: number
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: CustomLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs lg:text-sm font-medium"
    >
      {value}
    </text>
  )
}

export function PieChart() {
  const [isLoading, setIsLoading] = useState(true)
  const tasks = useTaskStore((state) => state.tasks)

  const data = useMemo(() => {
    const statusCount = tasks.reduce(
      (acc, task) => {
        const statusName = getStatusName(task.status_id)
        acc[statusName] = (acc[statusName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="30%"
          outerRadius="60%"
          paddingAngle={2}
          dataKey="value"
          label={renderCustomizedLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          verticalAlign="bottom"
          height={32}
          wrapperStyle={{
            fontSize: "12px",
            paddingTop: "8px",
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

function getStatusName(statusId: number): string {
  const statusMap: Record<number, string> = {
    1: "Não iniciada",
    2: "Em desenvolvimento",
    3: "Em testes",
    4: "Concluída",
  }
  return statusMap[statusId] || "Desconhecido"
}

