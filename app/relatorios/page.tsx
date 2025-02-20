"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTaskStore, getStatusName, getPriorityName, formatHours } from "@/lib/store"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TasksByResponsavelChart } from "@/components/charts/tasks-by-responsavel-chart"
import AuthRequired from "@/components/auth-required"
import { getUserIcon } from "@/lib/utils"

const STATUS_COLORS = {
  Desenvolvimento: "bg-blue-500",
  "Não iniciada": "bg-orange-500",
  Concluída: "bg-emerald-500",
  "Em testes": "bg-amber-500",
} as const

function formatStatusName(statusId: number): string {
  const status = getStatusName(statusId)
  return status === "Em desenvolvimento" ? "Desenvolvimento" : status
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("pt-BR")
}

export default function PlanilhaPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const [expandedTasks, setExpandedTasks] = useState<number[]>([])
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos")
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("todos")
  const [projetoFilter, setProjetoFilter] = useState<string>("todos")
  const [dataInicioFilter, setDataInicioFilter] = useState<string>("")
  const [dataFimFilter, setDataFimFilter] = useState<string>("")

  // Obter listas únicas para os selects
  const uniqueResponsaveis = useMemo(() => {
    const responsaveisInfo = tasks.flatMap(task => 
      task.responsaveis?.map(resp => ({
        email: resp.email,
        nome: resp.nome || resp.email.split('@')[0].replace('.', ' ')
      })) || []
    );
    
    // Remove duplicados baseado no email e ordena por nome
    return Array.from(
      new Map(responsaveisInfo.map(item => [item.email, item])).values()
    ).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [tasks]);

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
      <div className="min-h-screen w-full bg-background">
        {/* Reduced spacer height from h-14 to h-10 */}
        <div className="h-10 md:hidden" />
        <div className="p-4 sm:p-6 md:p-10">
          {/* Reduced margin-bottom from mb-6 to mb-4 */}
          <div className="flex flex-col mb-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold">Relatórios</h1>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{completedTasks}</div>
              </CardContent>
            </Card>
          </div>

          {/* Novo gráfico de barras */}
          <div className="mb-6">
            <TasksByResponsavelChart />
          </div>

          {/* Nova seção de filtros */}
          <div className="mb-6 grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {uniqueStatus.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                <SelectTrigger id="responsavel">
                  <SelectValue placeholder="Todos os responsáveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os responsáveis</SelectItem>
                  {uniqueResponsaveis.map((resp) => (
                    <SelectItem key={resp.email} value={resp.email}>
                      {resp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                <SelectTrigger id="prioridade">
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as prioridades</SelectItem>
                  {uniquePrioridades.map(prioridade => (
                    <SelectItem key={prioridade} value={prioridade}>
                      {prioridade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projeto">Projeto</Label>
              <Select value={projetoFilter} onValueChange={setProjetoFilter}>
                <SelectTrigger id="projeto">
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os projetos</SelectItem>
                  {uniqueProjetos
                    .filter((projeto): projeto is string => projeto !== undefined)
                    .map(projeto => (
                      <SelectItem key={projeto} value={projeto}>
                        {projeto}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicioFilter}
                onChange={(e) => setDataInicioFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFimFilter}
                onChange={(e) => setDataFimFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop view */}
          <div className="hidden md:block border rounded-md">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Título</TableHead>
                    <TableHead className="min-w-[180px]">Responsável</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Prioridade</TableHead>
                    <TableHead className="min-w-[150px]">Projeto</TableHead>
                    <TableHead className="min-w-[100px]">Estimativa</TableHead>
                    <TableHead className="min-w-[120px]">Data de Início</TableHead>
                    <TableHead className="min-w-[120px]">Data de Fim</TableHead>
                    <TableHead className="min-w-[100px]">ID Release</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.id}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{task.titulo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {(task.responsaveis ?? []).map(resp => (
                              <Avatar key={resp.email} className="w-6 h-6 border-2 border-white">
                                <AvatarImage src={getUserIcon(resp.email)} />
                                <AvatarFallback>
                                  {resp.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {!(task.responsaveis ?? []).length && (
                              <Avatar className="w-6 h-6">
                                <AvatarFallback>?</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <span className="text-sm">
                            {(task.responsaveis ?? []).length > 0 
                              ? (task.responsaveis ?? []).map(r => {
                                  const displayName = r.nome 
                                    ? r.nome.split(' ')[0] 
                                    : r.email.split('@')[0].split('.')[0];
                                  return displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
                                }).join(', ')
                              : 'Não atribuído'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[formatStatusName(task.status_id) as keyof typeof STATUS_COLORS]}>
                          {formatStatusName(task.status_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            getPriorityName(task.prioridade_id) === "Alta"
                              ? "text-red-500 border-red-200"
                              : getPriorityName(task.prioridade_id) === "Média"
                                ? "text-yellow-600 border-yellow-200"
                                : "text-green-500 border-green-200"
                          }
                        >
                          {getPriorityName(task.prioridade_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.projeto_nome || (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}</TableCell>
                      <TableCell>{formatHours(task.estimativa_horas)}</TableCell>
                      <TableCell>{formatDate(task.data_inicio)}</TableCell>
                      <TableCell>{formatDate(task.data_fim)}</TableCell>
                      <TableCell>{task.id_release || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4">
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
                        <div className="flex -space-x-2">
                          {(task.responsaveis ?? []).map(resp => (
                            <Avatar key={resp.email} className="w-6 h-6 border-2 border-white">
                              <AvatarImage src={getUserIcon(resp.email)} />
                              <AvatarFallback>
                                {resp.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {!(task.responsaveis ?? []).length && (
                            <Avatar className="w-6 h-6">
                              <AvatarFallback>?</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <span>
                          {(task.responsaveis ?? []).length > 0 
                            ? (task.responsaveis ?? []).map(r => {
                                const displayName = r.nome 
                                  ? r.nome.split(' ')[0] 
                                  : r.email.split('@')[0].split('.')[0];
                                return displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
                              }).join(', ')
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
                            ? "text-red-500 border-red-200"
                            : getPriorityName(task.prioridade_id) === "Média"
                              ? "text-yellow-600 border-yellow-200"
                              : "text-green-500 border-green-200"
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
    </AuthRequired>
  )
}

