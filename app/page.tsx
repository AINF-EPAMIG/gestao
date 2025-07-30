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
import AuthenticatedLayout from "./authenticated-layout"

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
      <AuthenticatedLayout>
        <PollingWrapper>
          {isLoading ? (
            <div className="flex min-h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="min-h-screen w-full bg-background">
              <div className="p-4 pt-10 lg:pt-6 max-w-[100vw] overflow-x-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Painel Kanban</h1>
                </div>
                
                {/* Gráficos em grade - Distribuição por Etapa e Cards Atribuídos por Usuário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card className="w-full overflow-hidden">
                    <CardHeader className="px-4 py-3">
                      <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center">
                        Distribuição por Etapa
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Visão geral do estado atual das tarefas por etapa
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-4 pb-4">
                      <div className="w-full h-[250px] sm:h-[300px] lg:h-[350px] xl:h-[400px] flex items-center justify-center">
                        <div className="w-[95%] h-[95%]">
                          <PieChart />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="w-full overflow-hidden">
                    <CardHeader className="px-4 py-3">
                      <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center">
                        Atividades Atribuídas por Usuário
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Distribuição de tarefas por responsável
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-4 pb-4">
                      <div className="w-full h-[250px] sm:h-[300px] lg:h-[350px] xl:h-[400px] flex items-center justify-center">
                        <div className="w-[95%] h-[95%]">
                          <RadarChart />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Gráfico de Movimentação no Kanban */}
                <Card className="w-full mb-6 border-t-4 border-t-primary">
                  <CardHeader className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <CardTitle className="text-base sm:text-lg lg:text-xl">Movimentação no Kanban</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                      Visão geral das tarefas criadas e atualizações de status nos últimos 7 dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-4 pb-4">
                    <div className="w-full h-[230px] sm:h-[270px] lg:h-[330px] xl:h-[370px]">
                      <ActivityAreaChart />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Gráfico de Distribuição de tarefas criadas e concluídas */}
                <Card className="w-full mb-6 border-t-4 border-t-gray-300">
                  <CardHeader className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                      <CardTitle className="text-base sm:text-lg lg:text-xl">Distribuição de tarefas criadas e concluídas</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                      Análise de Tarefas por Responsável
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-2 pb-0">
                    <div className="w-full overflow-x-auto md:overflow-x-hidden">
                      <TasksByStatusChart />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </PollingWrapper>
      </AuthenticatedLayout>
    </AuthRequired>
  )
}

