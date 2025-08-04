"use client"
import { PollingWrapper } from "@/components/polling-wrapper"
import { KanbanBoard } from "@/components/kanban-board"
import { useTaskStore } from "@/lib/store"
import { CreateTaskModal } from "@/components/create-task-modal"
import { SetorIndicator } from "@/components/setor-indicator"
import AuthRequired from "@/components/auth-required"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { usePermissions, useIsChefePlus } from "@/lib/hooks/use-permissions"
import { Loader2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"

type PeriodoFilter = "todos" | "hoje" | "esta_semana" | "este_mes" | "este_ano"

interface ResponsavelRM {
  NOME: string;
  EMAIL: string;
  CHEFE: string;
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

export default function KanbanPage() {
  const { data: session } = useSession()
  const tasks = useTaskStore((state) => state.tasks)
  const selectedSetor = useTaskStore((state) => state.selectedSetor)
  const { canViewAllSectors } = usePermissions()
  const isChefePlus = useIsChefePlus()
  const [responsavelFilter, setResponsavelFilter] = useState<string | null>(null)
  const [prioridadeFilter, setPrioridadeFilter] = useState<string | null>(null)
  const [periodoFilter, setPeriodoFilter] = useState<PeriodoFilter>("este_ano")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [projetoFilter, setProjetoFilter] = useState<string | null>(null)
  const [responsaveisSetor, setResponsaveisSetor] = useState<ResponsavelRM[]>([])
  const [projetos, setProjetos] = useState<{id: number, nome: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSetorData, setIsLoadingSetorData] = useState(false)
  
  // Estados para carregamento de tarefas - 10 por coluna
  const [visibleTasksPerColumn, setVisibleTasksPerColumn] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Buscar responsáveis do setor e configurar usuário atual
  useEffect(() => {
    const fetchResponsaveisSetor = async () => {
      if (session?.user?.email) {
        try {
          setIsLoading(true)
          if (selectedSetor && canViewAllSectors) {
            setIsLoadingSetorData(true)
          }
          
          const userInfo = await getUserInfo(session.user.email);
          
          // Configurar filtro inicial baseado em permissões
          if (isChefePlus || canViewAllSectors) {
            setResponsavelFilter(null); // Chefes/Diretores/Presidentes veem todos por padrão
          } else {
            setResponsavelFilter(session.user.email); // Colaboradores veem apenas suas tarefas
          }

          // Para diretores/presidentes: buscar responsáveis do setor selecionado
          // Para outros: buscar responsáveis do próprio setor
          const secaoParaBuscar = canViewAllSectors && selectedSetor 
            ? selectedSetor 
            : userInfo?.departamento || userInfo?.divisao || userInfo?.assessoria || userInfo?.secao;
            
          if (secaoParaBuscar) {
            const responsaveis = await getResponsaveisBySetor(secaoParaBuscar);
            setResponsaveisSetor(responsaveis);
          }
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setIsLoading(false)
          setIsLoadingSetorData(false)
        }
      }
    };

    fetchResponsaveisSetor();
  }, [session?.user?.email, selectedSetor, canViewAllSectors, isChefePlus]);

  // Buscar projetos
  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const res = await fetch('/api/projetos');
        const data = await res.json();
        setProjetos(data);
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      }
    };

    fetchProjetos();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesResponsavel = !responsavelFilter || task.responsaveis?.some(r => r.email === responsavelFilter)
      const matchesPrioridade = !prioridadeFilter || task.prioridade_id === parseInt(prioridadeFilter || "0")
      const matchesStatus = !statusFilter || task.status_id === parseInt(statusFilter || "0")
      const matchesProjeto = !projetoFilter || task.projeto_id === parseInt(projetoFilter || "0")
      
      // Lógica de filtragem por período (data de criação OU última atualização)
      let matchesPeriodo = true
      if (periodoFilter !== "todos") {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        
        const inicioSemana = new Date(hoje)
        inicioSemana.setDate(hoje.getDate() - hoje.getDay())
        
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const inicioAno = new Date(hoje.getFullYear(), 0, 1)
        
        const taskDateCreated = task.data_criacao ? new Date(task.data_criacao) : null
        const taskDateUpdated = task.ultima_atualizacao ? new Date(task.ultima_atualizacao) : null
        
        let dataRelevante = null
        if (taskDateUpdated && taskDateCreated) {
          dataRelevante = taskDateUpdated > taskDateCreated ? taskDateUpdated : taskDateCreated
        } else if (taskDateCreated) {
          dataRelevante = taskDateCreated
        } else if (taskDateUpdated) {
          dataRelevante = taskDateUpdated
        }
        
        if (dataRelevante) {
          dataRelevante.setHours(0, 0, 0, 0)
          
          switch (periodoFilter) {
            case "hoje":
              matchesPeriodo = dataRelevante.getTime() >= hoje.getTime()
              break
            case "esta_semana":
              matchesPeriodo = dataRelevante.getTime() >= inicioSemana.getTime()
              break
            case "este_mes":
              matchesPeriodo = dataRelevante.getTime() >= inicioMes.getTime()
              break
            case "este_ano":
              matchesPeriodo = dataRelevante.getTime() >= inicioAno.getTime()
              break
          }
        } else {
          matchesPeriodo = false
        }
      }
      
      return matchesResponsavel && matchesPrioridade && matchesStatus && matchesProjeto && matchesPeriodo
    })
  }, [tasks, responsavelFilter, prioridadeFilter, statusFilter, projetoFilter, periodoFilter])

  // Verificar se há mais tarefas para carregar
  const hasMoreTasks = useMemo(() => {
    const tasksByStatus = {
      1: filteredTasks.filter(task => task.status_id === 1).length,
      2: filteredTasks.filter(task => task.status_id === 2).length,
      3: filteredTasks.filter(task => task.status_id === 3).length,
      4: filteredTasks.filter(task => task.status_id === 4).length,
    };
    
    return Object.values(tasksByStatus).some(count => count > visibleTasksPerColumn);
  }, [filteredTasks, visibleTasksPerColumn]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreTasks) {
      setIsLoadingMore(true)
      // Simular loading
      setTimeout(() => {
        setVisibleTasksPerColumn(prev => prev + 10)
        setIsLoadingMore(false)
      }, 300)
    }
  }

  // Reset visible tasks count quando os filtros mudam
  useEffect(() => {
    setVisibleTasksPerColumn(10)
  }, [responsavelFilter, prioridadeFilter, periodoFilter, statusFilter, projetoFilter])

  return (
    <AuthRequired>
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden">
          <PollingWrapper>
            <div className="h-screen overflow-hidden flex flex-col">
              <SetorIndicator />
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 pt-24 sm:pt-16 lg:pt-6 max-w-[100vw] overflow-x-hidden pb-4">
                  {/* Título e botão criar */}
                  <PageHeader 
                    title="Kanban"
                    subtitle={isLoadingSetorData ? "Carregando dados do setor..." : undefined}
                  >
                    <CreateTaskModal />
                  </PageHeader>
                  
                  {/* Filtros */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-3 sm:mb-4 xl:mb-5 2xl:mb-6">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2 w-full">
                      <div className="lg:flex lg:items-end mb-1 lg:mb-0 lg:mr-2 lg:self-end hidden sm:block">
                        <span className="text-sm lg:text-base font-medium bg-gray-100 px-2 py-1 rounded-md">Filtros:</span>
                      </div>
                      
                      {/* Todos os filtros em uma linha em telas grandes, empilhados em mobile */}
                      <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-2 w-full">
                        <div className="space-y-1 min-w-0 lg:w-auto lg:min-w-fit">
                          <label className="text-xs text-gray-500">Responsável</label>
                          <Select 
                            value={responsavelFilter || "todos"}
                            onValueChange={(value) => setResponsavelFilter(value === "todos" ? null : value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="h-8 w-full lg:w-auto lg:min-w-[120px]">
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue placeholder="Todos" />
                              )}
                            </SelectTrigger>
                            <SelectContent className="overflow-y-auto max-h-[200px]">
                              <SelectItem value="todos">Todos</SelectItem>
                              {responsaveisSetor.map((responsavel) => (
                                <SelectItem key={responsavel.EMAIL} value={responsavel.EMAIL}>
                                  {responsavel.NOME}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 min-w-0 lg:w-auto lg:min-w-fit">
                          <label className="text-xs text-gray-500">Projeto</label>
                          <Select 
                            value={projetoFilter || "todos"}
                            onValueChange={(value) => setProjetoFilter(value === "todos" ? null : value)}
                          >
                            <SelectTrigger className="h-8 w-full lg:w-auto lg:min-w-[100px]">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="overflow-y-auto max-h-[200px]">
                              <SelectItem value="todos">Todos</SelectItem>
                              {projetos.map((projeto) => (
                                <SelectItem key={projeto.id} value={projeto.id.toString()}>
                                  {projeto.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 min-w-0 lg:w-auto lg:min-w-fit">
                          <label className="text-xs text-gray-500">Status</label>
                          <Select 
                            value={statusFilter || "todos"}
                            onValueChange={(value) => setStatusFilter(value === "todos" ? null : value)}
                          >
                            <SelectTrigger className="h-8 w-full lg:w-auto lg:min-w-[130px]">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="overflow-y-auto max-h-[200px]">
                              <SelectItem value="todos">Todos</SelectItem>
                              <SelectItem value="1">Não iniciada</SelectItem>
                              <SelectItem value="2">Em desenvolvimento</SelectItem>
                              <SelectItem value="3">Em testes</SelectItem>
                              <SelectItem value="4">Concluída</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 min-w-0 lg:w-auto lg:min-w-fit">
                          <label className="text-xs text-gray-500">Prioridade</label>
                          <Select 
                            value={prioridadeFilter || "todas"}
                            onValueChange={(value) => setPrioridadeFilter(value === "todas" ? null : value)}
                          >
                            <SelectTrigger className="h-8 w-full lg:w-auto lg:min-w-[80px]">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="overflow-y-auto max-h-[200px]">
                              <SelectItem value="todas">Todos</SelectItem>
                              <SelectItem value="1">Alta</SelectItem>
                              <SelectItem value="2">Média</SelectItem>
                              <SelectItem value="3">Baixa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 min-w-0 lg:w-auto lg:min-w-fit">
                          <label className="text-xs text-gray-500">Período</label>
                          <Select 
                            value={periodoFilter}
                            onValueChange={(value: PeriodoFilter) => setPeriodoFilter(value)}
                          >
                            <SelectTrigger className="h-8 w-full lg:w-auto lg:min-w-[100px]">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="overflow-y-auto max-h-[200px]">
                              <SelectItem value="todos">Todos</SelectItem>
                              <SelectItem value="hoje">Hoje</SelectItem>
                              <SelectItem value="esta_semana">Esta Semana</SelectItem>
                              <SelectItem value="este_mes">Este Mês</SelectItem>
                              <SelectItem value="este_ano">Este Ano</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center min-h-[500px] w-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[500px] w-full">
                      <span className="text-gray-500 text-lg">Nenhuma tarefa encontrada</span>
                    </div>
                  ) : (
                    <div className="w-full">
                      <KanbanBoard tasks={filteredTasks} tasksPerColumn={visibleTasksPerColumn} />
                      
                      {/* Botão para carregar mais tarefas */}
                      {hasMoreTasks && (
                        <div className="flex justify-center items-center py-8">
                          <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="px-8 py-3 bg-emerald-800 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all duration-200 font-medium"
                          >
                            {isLoadingMore ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Carregando...
                              </>
                            ) : (
                              "Ver Mais"
                            )}
                          </button>
                        </div>
                      )}

                      {/* Indicador de quantas tarefas foram carregadas */}
                      {filteredTasks.length > 0 && (
                        <div className="text-center py-4 text-sm text-gray-500">
                          Mostrando até {visibleTasksPerColumn} tarefas por coluna
                          {hasMoreTasks && (
                            <div className="mt-2 text-xs">
                              Há mais tarefas disponíveis. Clique em &ldquo;Ver Mais&rdquo;.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </PollingWrapper>
        </main>
      </div>
    </AuthRequired>
  )
}
