"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"

export function TasksByResponsavelChart() {
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