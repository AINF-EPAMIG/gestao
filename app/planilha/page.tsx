"use client"

import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, getStatusName, getPriorityName, formatHours } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SetorIndicator } from "@/components/setor-indicator"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthRequired from "@/components/auth-required"
import { getResponsavelName } from '@/lib/utils'
import { PollingWrapper } from "@/components/polling-wrapper"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import AuthenticatedLayout from "../authenticated-layout"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { PageHeader } from "@/components/page-header"

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

function getStatusColor(statusName: string): string {
  return (statusName in STATUS_COLORS) 
    ? STATUS_COLORS[statusName as keyof typeof STATUS_COLORS] 
    : "bg-gray-500 text-white"
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("pt-BR")
}

// Helpers para nova API
async function getUserInfo(email: string) {
  const res = await fetch(`/api/funcionarios?action=userInfo&email=${encodeURIComponent(email)}`);
  return res.json();
}
async function getResponsaveisBySetor(secao: string) {
  const res = await fetch(`/api/funcionarios?action=responsaveisSetor&secao=${encodeURIComponent(secao)}`);
  return res.json();
}

export default function PlanilhaPage() {
  const { data: session } = useSession()
  const tasks = useTaskStore((state) => state.tasks)
  const selectedSetor = useTaskStore((state) => state.selectedSetor)
  const { canViewAllSectors } = usePermissions()
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
          const userInfo = await getUserInfo(session.user.email)
          
          // Para diretores/presidentes: buscar responsáveis do setor selecionado
          // Para outros: buscar responsáveis do próprio setor
          const secaoParaBuscar = canViewAllSectors && selectedSetor 
            ? selectedSetor 
            : userInfo?.departamento || userInfo?.divisao || userInfo?.assessoria || userInfo?.secao;
            
          if (secaoParaBuscar) {
            const responsaveisData = await getResponsaveisBySetor(secaoParaBuscar)
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
  }, [session?.user?.email, selectedSetor, canViewAllSectors])

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
      <AuthenticatedLayout>
        <PollingWrapper>
          {isLoading ? (
            <div className="flex min-h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="min-h-screen w-full bg-background overflow-x-hidden">
              <SetorIndicator />
              <div className="p-3 sm:p-4 pt-16 lg:pt-4 w-full">
                <PageHeader title="Planilha Kanban" />

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

                {/* Tabela para telas grandes - usando TableHead e TableHeader para sticky header */}
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
                          <TableRow 
                            key={task.id} 
                            className={cn(
                              "border-b border-gray-200 hover:bg-gray-50 cursor-pointer",
                              expandedTasks.includes(task.id) && "bg-gray-50"
                            )}
                            onClick={() => toggleTaskExpansion(task.id)}
                          >
                            <TableCell className="text-center">{task.id}</TableCell>
                            <TableCell className="text-sm font-medium max-w-0 truncate">
                              {task.titulo}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {task.responsaveis && task.responsaveis.length > 0 
                                ? getResponsavelName(task.responsaveis[0].email)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn("text-xs font-medium", getStatusColor(formatStatusName(task.status_id)))}>
                                {formatStatusName(task.status_id)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {getPriorityName(task.prioridade_id)}
                            </TableCell>
                            <TableCell className="text-center text-sm max-w-0 truncate">
                              {task.projeto_nome || "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {formatHours(task.estimativa_horas)}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {formatDate(task.data_inicio)}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {formatDate(task.data_fim)}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {task.id_release || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Cards para telas pequenas/médias */}
                <div className="lg:hidden grid grid-cols-1 gap-3">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <CardHeader className="p-3 pb-0">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{task.id}
                              </Badge>
                              <Badge className={cn("text-xs", getStatusColor(formatStatusName(task.status_id)))}>
                                {formatStatusName(task.status_id)}
                              </Badge>
                            </div>
                            <CardTitle className="text-base font-medium">{task.titulo}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 mt-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleTaskExpansion(task.id)
                            }}
                          >
                            {expandedTasks.includes(task.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Responsável:</span>
                          </div>
                          <div>
                            {task.responsaveis && task.responsaveis.length > 0 
                              ? getResponsavelName(task.responsaveis[0].email)
                              : "-"}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prioridade:</span>
                          </div>
                          <div>{getPriorityName(task.prioridade_id)}</div>
                          
                          {expandedTasks.includes(task.id) && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Projeto:</span>
                              </div>
                              <div>{task.projeto_nome || "-"}</div>
                              
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Estimativa:</span>
                              </div>
                              <div>{formatHours(task.estimativa_horas)}</div>
                              
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Início:</span>
                              </div>
                              <div>{formatDate(task.data_inicio)}</div>
                              
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fim:</span>
                              </div>
                              <div>{formatDate(task.data_fim)}</div>
                              
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ID Release:</span>
                              </div>
                              <div>{task.id_release || "-"}</div>
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
      </AuthenticatedLayout>
    </AuthRequired>
  )
} 