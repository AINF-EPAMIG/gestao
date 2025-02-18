"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Task, getStatusName } from "@/lib/store"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Construction } from "lucide-react"

interface TasksByResponsavelChartProps {
  tasks: Task[]
}

function formatStatusName(statusId: number): string {
  const status = getStatusName(statusId)
  return status === "Em desenvolvimento" ? "Desenvolvimento" : status
}

export function TasksByResponsavelChart({ tasks }: TasksByResponsavelChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Análise de Tarefas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
          <Construction className="h-12 w-12 mb-4" />
          <p className="text-sm">Em desenvolvimento</p>
        </div>
      </CardContent>
    </Card>
  )
} 