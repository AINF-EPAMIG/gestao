"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface TasksPieChartProps {
  data: {
    name: string
    value: number
  }[]
}

const COLORS = {
  "Em desenvolvimento": "#3b82f6",
  "Não iniciada": "#f97316",
  "Concluída": "#10b981",
  "Em testes": "#fbbf24",
}

export function TasksPieChart({ data }: TasksPieChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#3b82f6"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 