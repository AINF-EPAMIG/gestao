"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Task } from "@/lib/store"

export function TasksBarChart({ tasks }: { tasks: Task[] }) {
  const data = Object.entries(
    tasks.reduce((acc, task) => {
      const name = task.responsavel_email?.split("@")[0] || "Sem responsável"
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({
      name: name.split(".").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
      tarefas: value
    }))
    .sort((a, b) => b.tarefas - a.tarefas)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="tarefas" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  )
} 