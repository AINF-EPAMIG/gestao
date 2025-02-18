"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Task } from "@/lib/store"
import { getStatusName } from "@/lib/store"

const COLORS = ["#10B981", "#3B82F6", "#EF4444", "#6B7280"]

export function TasksPieChart({ tasks }: { tasks: Task[] }) {
  const data = [
    { name: "Concluída", value: tasks.filter(t => getStatusName(t.status_id) === "Concluída").length },
    { name: "Em desenvolvimento", value: tasks.filter(t => getStatusName(t.status_id) === "Em desenvolvimento").length },
    { name: "Em testes", value: tasks.filter(t => getStatusName(t.status_id) === "Em testes").length },
    { name: "Não iniciada", value: tasks.filter(t => getStatusName(t.status_id) === "Não iniciada").length },
  ].filter(item => item.value > 0)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
} 