"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart } from "@/components/charts/pie-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { ActivityAreaChart } from "@/components/charts/activity-area-chart"
import { TasksByStatusChart } from "@/components/charts/tasks-by-status-chart"
import AuthRequired from "@/components/auth-required"
import { PollingWrapper } from "@/components/polling-wrapper"
import { Loader2, TrendingUp, BarChart, AlertTriangle } from "lucide-react"
import AuthenticatedLayout from "./authenticated-layout"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { useSetorNavigation } from "@/lib/hooks/use-setor-navigation"
import { PageHeader } from "@/components/page-header"

export default function DashboardPage() {
  const { isLoading } = useDashboardData()
  const { canViewAllSectors } = usePermissions()
  const { selectedSetor } = useSetorNavigation()
  
  // Verificar se o gráfico de movimentação deve ser habilitado
  // Só habilita para o setor ASTI ou quando nenhum setor específico está selecionado
  const isKanbanChartEnabled = !canViewAllSectors || !selectedSetor || selectedSetor === 'ASTI'

  return (
    <AuthRequired>
      <AuthenticatedLayout>
        <PollingWrapper>
          {isLoading ? (
            <div className="flex min-h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="min-h-screen w-full bg-background overflow-x-hidden">
              <div className="p-3 sm:p-4 pt-16 lg:pt-4 w-full">
                <PageHeader title="Painel Kanban" />
                
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
                <Card className={`w-full mb-6 border-t-4 ${isKanbanChartEnabled ? 'border-t-primary' : 'border-t-gray-300'}`}>
                  <CardHeader className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isKanbanChartEnabled ? (
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      )}
                      <CardTitle className={`text-base sm:text-lg lg:text-xl ${!isKanbanChartEnabled ? 'text-gray-400' : ''}`}>
                        Movimentação no Kanban
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                      {isKanbanChartEnabled 
                        ? "Visão geral das tarefas criadas e atualizações de status nos últimos 30 dias"
                        : "Este gráfico está disponível apenas para o setor ASTI"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-4 pb-4">
                    {isKanbanChartEnabled ? (
                      <div className="w-full h-[230px] sm:h-[270px] lg:h-[330px] xl:h-[370px]">
                        <ActivityAreaChart />
                      </div>
                    ) : (
                      <div className="w-full h-[230px] sm:h-[270px] lg:h-[330px] xl:h-[370px] flex flex-col items-center justify-center text-gray-400">
                        <AlertTriangle className="h-12 w-12 mb-3" />
                        <p className="text-sm font-medium">Dados não disponíveis para este setor</p>
                        <p className="text-xs text-center mt-1">
                          O gráfico de movimentação no Kanban contém dados específicos do setor ASTI.<br />
                          Para visualizar este gráfico, selecione o setor ASTI no menu lateral.
                        </p>
                      </div>
                    )}
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

