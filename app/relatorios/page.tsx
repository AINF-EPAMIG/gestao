"use client"

import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, getStatusName, getPriorityName, formatHours } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TasksByStatusChart } from "@/components/charts/tasks-by-status-chart"
import AuthRequired from "@/components/auth-required"
import { getResponsavelName } from '@/lib/utils'
import { PollingWrapper } from "@/components/polling-wrapper"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, getResponsaveisBySetor } from "@/lib/rm-service"

interface ResponsavelRM {
  EMAIL: string;
  NOME: string;
  CARGO?: string;
}

const STATUS_COLORS = {
  "Desenv.": "bg-blue-500 text-white",
  "N. Inic.": "bg-red-500 text-white",
  "Concl.": "bg-emerald-500 text-white",
  "Testes": "bg-yellow-400 text-white",
} as const

function formatStatusName(statusId: number): string {
  const status = getStatusName(statusId)
  if (status === "Em desenvolvimento") return "Desenv."
  if (status === "Não iniciada") return "N. Inic."
  if (status === "Em testes") return "Testes"
  if (status === "Concluída") return "Concl."
  return status
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("pt-BR")
}

export default function PlanilhaPage() {
  const { data: session } = useSession()
  const tasks = useTaskStore((state) => state.tasks)
  const [expandedTasks, setExpandedTasks] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [responsaveis, setResponsaveis] = useState<ResponsavelRM[]>([])
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos")
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("todos")
  const [projetoFilter, setProjetoFilter] = useState<string>("todos")
  const [dataInicioFilter, setDataInicioFilter] = useState<string>("")
  const [dataFimFilter, setDataFimFilter] = useState<string>("")

  // Efeito para buscar responsáveis do setor
  useEffect(() => {
    const fetchResponsaveis = async () => {
      if (session?.user?.email) {
        try {
          const userInfo = await getUserInfoFromRM(session.user.email)
          if (userInfo?.SECAO) {
            const responsaveisData = await getResponsaveisBySetor(userInfo.SECAO)
            setResponsaveis(responsaveisData)
          }
        } catch (error) {
          console.error('Erro ao carregar responsáveis:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchResponsaveis()
  }, [session?.user?.email])

  // Obter listas únicas para os selects
  const uniqueStatus = Array.from(new Set(tasks.map(task => getStatusName(task.status_id))))
  const uniquePrioridades = Array.from(new Set(tasks.map(task => getPriorityName(task.prioridade_id))))
  const uniqueProjetos = Array.from(new Set(tasks.map(task => task.projeto_nome)))

  // Lógica de filtragem
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = statusFilter === "todos" || getStatusName(task.status_id) === statusFilter;
      const matchesResponsavel = responsavelFilter === "todos" || 
        (task.responsaveis && task.responsaveis.length > 0 && task.responsaveis.some(r => r.email === responsavelFilter));
      const matchPrioridade = prioridadeFilter === "todos" || getPriorityName(task.prioridade_id) === prioridadeFilter;
      const matchProjeto = projetoFilter === "todos" || task.projeto_nome === projetoFilter;
      const matchDataInicio = !dataInicioFilter || (task.data_inicio && task.data_inicio >= dataInicioFilter);
      const matchDataFim = !dataFimFilter || (task.data_fim && task.data_fim <= dataFimFilter);

      return matchesStatus && matchesResponsavel && matchPrioridade && matchProjeto && matchDataInicio && matchDataFim;
    });
  }, [tasks, statusFilter, responsavelFilter, prioridadeFilter, projetoFilter, dataInicioFilter, dataFimFilter]);

  // Atualizar cálculos para usar tarefas filtradas
  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter(task => getStatusName(task.status_id) === "Concluída").length

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  return (
    <AuthRequired>
      <PollingWrapper>
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="min-h-screen w-full bg-background">
            {/* Reduced spacer height from h-14 to h-10 */}
            <div className="h-10 lg:hidden" />
            <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-[100vw] overflow-x-hidden">
              {/* Reduced margin-bottom from mb-6 to mb-4 */}
              <div className="flex flex-col mb-3">
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Relatórios</h1>
                </div>
              </div>

              {/* Cards de estatísticas */}
              <div className="grid gap-3 md:grid-cols-2 mb-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 py-2">
                    <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{totalTasks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 py-2">
                    <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold text-emerald-600">{completedTasks}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de barras com responsividade ajustada */}
              <div className="mb-6 w-full overflow-hidden">
                <TasksByStatusChart />
                {/* Mensagem para dispositivos móveis */}
                <div className="lg:hidden p-4 bg-gray-50 rounded-lg border text-center">
                  <p className="text-sm text-gray-600">O gráfico de análise de tarefas está disponível apenas na versão desktop.</p>
                </div>
              </div>

              {/* Nova seção de filtros - ajustada para telas médias */}
              <div className="mb-4 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status" className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {uniqueStatus.map((status, index) => (
                        <SelectItem key={`status-${status}-${index}`} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                    <SelectTrigger id="responsavel" className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {responsaveis.map((resp) => (
                        <SelectItem key={resp.EMAIL} value={resp.EMAIL}>
                          {resp.NOME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                    <SelectTrigger id="prioridade" className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {uniquePrioridades.map((prioridade, index) => (
                        <SelectItem key={`prioridade-${prioridade}-${index}`} value={prioridade}>
                          {prioridade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="projeto">Projeto</Label>
                  <Select value={projetoFilter} onValueChange={setProjetoFilter}>
                    <SelectTrigger id="projeto" className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {uniqueProjetos
                        .filter((projeto): projeto is string => projeto !== undefined)
                        .map((projeto, index) => (
                          <SelectItem key={`projeto-${projeto}-${index}`} value={projeto}>
                            {projeto}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    className="h-9"
                    value={dataInicioFilter}
                    onChange={(e) => setDataInicioFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    className="h-9"
                    value={dataFimFilter}
                    onChange={(e) => setDataFimFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Desktop view */}
              <div className="hidden lg:block border rounded-md overflow-hidden">
                <div className="relative w-full overflow-x-auto">
                  <Table className="min-w-full table-fixed">
                    <TableHeader className="sticky top-0 bg-[#00714B] rounded-t-md">
                      <TableRow className="border-b-0">
                        <TableHead className="w-[50px] text-white font-medium rounded-tl-md text-center">ID</TableHead>
                        <TableHead className="w-[150px] text-white font-medium text-center">Título</TableHead>
                        <TableHead className="w-[120px] text-white font-medium text-center">Responsável</TableHead>
                        <TableHead className="w-[90px] text-white font-medium text-center">Status</TableHead>
                        <TableHead className="w-[90px] text-white font-medium text-center">Prioridade</TableHead>
                        <TableHead className="w-[100px] text-white font-medium text-center">Projeto</TableHead>
                        <TableHead className="w-[70px] text-white font-medium text-center">Estimativa</TableHead>
                        <TableHead className="w-[90px] text-white font-medium text-center">Início</TableHead>
                        <TableHead className="w-[90px] text-white font-medium text-center">Fim</TableHead>
                        <TableHead className="w-[70px] text-white font-medium rounded-tr-md text-center">ID Release</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium whitespace-nowrap py-2">{task.id}</TableCell>
                          <TableCell className="max-w-[150px] truncate py-2">{task.titulo}</TableCell>
                          <TableCell className="max-w-[120px] truncate py-2">
                            <div className="flex items-center">
                              <span className="text-xs">
                                {(task.responsaveis ?? []).length > 0 
                                  ? (task.responsaveis ?? []).map(r => getResponsavelName(r.email)).join(', ')
                                  : 'Não atribuído'
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge className={`text-xs ${STATUS_COLORS[formatStatusName(task.status_id) as keyof typeof STATUS_COLORS]}`}>
                              {formatStatusName(task.status_id)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant="outline"
                              className={`text-xs
                                ${getPriorityName(task.prioridade_id) === "Alta"
                                  ? "bg-red-50 text-red-600 border-red-100"
                                  : getPriorityName(task.prioridade_id) === "Média"
                                    ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                                    : "bg-green-50 text-green-600 border-green-100"
                                }
                              `}
                            >
                              {getPriorityName(task.prioridade_id)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[100px] truncate py-2">{task.projeto_nome || (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}</TableCell>
                          <TableCell className="py-2">{formatHours(task.estimativa_horas)}</TableCell>
                          <TableCell className="py-2">{formatDate(task.data_inicio)}</TableCell>
                          <TableCell className="py-2">{formatDate(task.data_fim)}</TableCell>
                          <TableCell className="py-2">{task.id_release || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile view */}
              <div className="lg:hidden space-y-4 w-full overflow-hidden">
                {filteredTasks.map((task) => (
                  <Card key={task.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span>Tarefa #{task.id}</span>
                        <Button variant="ghost" size="sm" onClick={() => toggleTaskExpansion(task.id)}>
                          {expandedTasks.includes(task.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Título:</span> {task.titulo}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Responsável:</span>
                          <div className="flex items-center gap-2">
                            <span>
                              {(task.responsaveis ?? []).length > 0 
                                ? (task.responsaveis ?? []).map(r => getResponsavelName(r.email)).join(', ')
                                : 'Não atribuído'
                              }
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>{" "}
                          <Badge className={STATUS_COLORS[formatStatusName(task.status_id) as keyof typeof STATUS_COLORS]}>
                            {formatStatusName(task.status_id)}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Prioridade:</span>{" "}
                          <Badge
                            variant="outline"
                            className={
                              getPriorityName(task.prioridade_id) === "Alta"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : getPriorityName(task.prioridade_id) === "Média"
                                  ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                                  : "bg-green-50 text-green-600 border-green-100"
                            }
                          >
                            {getPriorityName(task.prioridade_id)}
                          </Badge>
                        </div>
                        {expandedTasks.includes(task.id) && (
                          <>
                            <div>
                              <span className="font-medium">Projeto:</span>{" "}
                              {task.projeto_nome || (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}
                            </div>
                            <div>
                              <span className="font-medium">Estimativa:</span> {formatHours(task.estimativa_horas)}
                            </div>
                            <div>
                              <span className="font-medium">Data de Início:</span> {formatDate(task.data_inicio)}
                            </div>
                            <div>
                              <span className="font-medium">Data de Fim:</span> {formatDate(task.data_fim)}
                            </div>
                            <div>
                              <span className="font-medium">ID Release:</span> {task.id_release || "-"}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </PollingWrapper>
    </AuthRequired>
  )
}

