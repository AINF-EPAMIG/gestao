"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { ActivityAreaChart } from "@/components/charts/activity-area-chart"
import { TasksByStatusChart } from "@/components/charts/tasks-by-status-chart"
import { useTaskStore } from "@/lib/store"
import { useState, useEffect } from "react"
import AuthRequired from "@/components/auth-required"
import { PollingWrapper } from "@/components/polling-wrapper"
import { Loader2, TrendingUp, BarChart } from "lucide-react"

export default function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const [isLoading, setIsLoading] = useState(true)

  // Efeito para controlar o estado de carregamento
  useEffect(() => {
    if (tasks.length > 0) {
      // Quando as tarefas são carregadas, desativa o loader
      setIsLoading(false)
    }
  }, [tasks])

  return (
    <AuthRequired>
      <PollingWrapper>
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="min-h-screen w-full bg-background">
            <div className="p-2 sm:p-3 lg:p-4 xl:p-6 2xl:p-8 pt-10 lg:pt-6 max-w-[100vw]">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6">Painel Kanban</h1>
              
              {/* Gráficos em grade - Distribuição por Etapa e Cards Atribuídos por Usuário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-8">
                <Card className="w-full">
                  <CardHeader className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                    <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center">
                      Distribuição por Etapa
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Visão geral do estado atual das tarefas por etapa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                    <div className="w-full h-[180px] sm:h-[220px] lg:h-[280px] xl:h-[320px] 2xl:h-[350px] flex items-center justify-center">
                      <div className="w-full h-full max-w-[90%] max-h-[90%]">
                        <PieChart />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full">
                  <CardHeader className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                    <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center">
                      Atividades Atribuídas por Usuário
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Distribuição de tarefas por responsável
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                    <div className="w-full h-[180px] sm:h-[220px] lg:h-[280px] xl:h-[320px] 2xl:h-[350px] flex items-center justify-center">
                      <div className="w-full h-full max-w-[90%] max-h-[90%]">
                        <RadarChart />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráfico de Movimentação no Kanban */}
              <Card className="w-full mb-3 sm:mb-4 lg:mb-6 border-t-4 border-t-primary">
                <CardHeader className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg lg:text-xl">Movimentação no Kanban</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Visão geral das tarefas criadas e atualizações de status nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                  <div className="w-full h-[180px] sm:h-[220px] lg:h-[280px] xl:h-[320px] 2xl:h-[350px]">
                    <ActivityAreaChart />
                  </div>
                </CardContent>
              </Card>
              
              {/* Gráfico de Distribuição de tarefas criadas e concluídas */}
              <Card className="w-full mb-3 sm:mb-4 lg:mb-6 border-t-4 border-t-gray-300">
                <CardHeader className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                    <CardTitle className="text-base sm:text-lg lg:text-xl">Distribuição de tarefas criadas e concluídas</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Análise de Tarefas por Responsável
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-2 lg:px-4 pb-0">
                  <div className="w-full overflow-x-auto md:overflow-x-hidden">
                    <TasksByStatusChart />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </PollingWrapper>
    </AuthRequired>
  )
}

