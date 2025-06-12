"use client"
import { PollingWrapper } from "@/components/polling-wrapper"
import { KanbanBoard } from "@/components/kanban-board"
import { useTaskStore } from "@/lib/store"
import { CreateTaskModal } from "@/components/create-task-modal"
import AuthRequired from "@/components/auth-required"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import AuthenticatedLayout from "../authenticated-layout"

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
async function isUserChefe(email: string) {
  const res = await fetch(`/api/funcionarios?action=isUserChefe&email=${encodeURIComponent(email)}`);
  const data = await res.json();
  return data.isChefe;
}
async function isUserAdmin() {
  // Adapte conforme sua lógica de admin, se necessário
  // Exemplo: checar se o email está em uma lista de admins
  return false;
}
async function getResponsaveisBySetor(secao: string) {
  const res = await fetch(`/api/funcionarios?action=responsaveisSetor&secao=${encodeURIComponent(secao)}`);
  return res.json();
}

export default function KanbanPage() {
  const { data: session } = useSession()
  const tasks = useTaskStore((state) => state.tasks)
  const selectedSetor = useTaskStore((state) => state.selectedSetor)
  const [responsavelFilter, setResponsavelFilter] = useState<string | null>(null)
  const [prioridadeFilter, setPrioridadeFilter] = useState<string | null>(null)
  const [periodoFilter, setPeriodoFilter] = useState<PeriodoFilter>("este_ano")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [projetoFilter, setProjetoFilter] = useState<string | null>(null)
  const [responsaveisSetor, setResponsaveisSetor] = useState<ResponsavelRM[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Buscar responsáveis do setor e configurar usuário atual
  useEffect(() => {
    const fetchResponsaveisSetor = async () => {
      if (session?.user?.email) {
        try {
          setIsLoading(true)
          const userInfo = await getUserInfo(session.user.email);
          
          // Verifica se é admin
          const isAdmin = await isUserAdmin();
          
          // Verifica se é chefe e configura o filtro inicial
          const isChefe = await isUserChefe(session.user.email);
          if (isChefe || isAdmin) {
            setResponsavelFilter(null); // Sempre mostra 'todos' para chefia/admin
          } else {
            setResponsavelFilter(session.user.email); // Usuário comum vê só suas tarefas
          }

          // Busca responsáveis do setor (usando o campo secao do banco)
          const secaoParaBuscar = selectedSetor || userInfo?.secao;
          if (secaoParaBuscar) {
            const responsaveis = await getResponsaveisBySetor(secaoParaBuscar);
            setResponsaveisSetor(responsaveis);
          }
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setIsLoading(false)
        }
      }
    };

    fetchResponsaveisSetor();
  }, [session?.user?.email, selectedSetor]);

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
        inicioSemana.setDate(hoje.getDate() - hoje.getDay()) // Domingo como início da semana
        
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

        const inicioAno = new Date(hoje.getFullYear(), 0, 1)

        // Verifica se alguma das datas está no período
        const verificarData = (dataStr: string | null) => {
          if (!dataStr) return false
          const data = new Date(dataStr)
          
          switch (periodoFilter) {
            case "hoje":
              return data.toDateString() === hoje.toDateString()
            case "esta_semana":
              return data >= inicioSemana && data <= hoje
            case "este_mes":
              return data >= inicioMes && data <= hoje
            case "este_ano":
              return data >= inicioAno && data <= hoje
            default:
              return false
          }
        }

        // A tarefa corresponde se QUALQUER uma das datas estiver no período
        matchesPeriodo = verificarData(task.data_criacao) || verificarData(task.ultima_atualizacao)
      }
      
      return matchesResponsavel && matchesPrioridade && matchesPeriodo && matchesStatus && matchesProjeto
    })
  }, [tasks, responsavelFilter, prioridadeFilter, periodoFilter, statusFilter, projetoFilter])

  return (
    <AuthRequired>
      <AuthenticatedLayout>
        <PollingWrapper>
          <div className="p-2 sm:p-3 lg:p-4 xl:p-6 2xl:p-8 pt-10 lg:pt-6 max-w-[100vw] overflow-x-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 xl:mb-4 2xl:mb-5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Kanban</h1>
              <div className="mt-2 lg:mt-0">
                <CreateTaskModal />
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-3 sm:mb-4 xl:mb-5 2xl:mb-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2 flex-wrap w-full">
                <div className="lg:flex lg:items-end mb-1 lg:mb-0 lg:mr-1 lg:self-end hidden sm:block">
                  <span className="text-sm lg:text-base font-medium bg-gray-100 px-2 py-1 rounded-md">Filtros:</span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Responsável</label>
                  <Select 
                    value={responsavelFilter || "todos"}
                    onValueChange={(value) => setResponsavelFilter(value === "todos" ? null : value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-8">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SelectValue placeholder="Todos" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="overflow-y-auto max-h-[200px]">
                      <SelectItem key="todos" value="todos">Todos</SelectItem>
                      {responsaveisSetor.map((resp) => (
                        <SelectItem key={`resp-${resp.EMAIL}`} value={resp.EMAIL}>
                          {resp.NOME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Projeto</label>
                  <Select 
                    value={projetoFilter || "todos"}
                    onValueChange={(value) => setProjetoFilter(value === "todos" ? null : value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="overflow-y-auto max-h-[200px]">
                      <SelectItem value="todos">Todos</SelectItem>
                      {Array.from(new Set(tasks.map(task => task.projeto_id))).filter(id => id).map((projetoId) => {
                        const projeto = tasks.find(t => t.projeto_id === projetoId);
                        return (
                          <SelectItem key={projetoId} value={projetoId.toString()}>
                            {projeto?.projeto_nome || `Projeto ${projetoId}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Status</label>
                  <Select 
                    value={statusFilter || "todos"}
                    onValueChange={(value) => setStatusFilter(value === "todos" ? null : value)}
                  >
                    <SelectTrigger className="h-8">
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

                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Prioridade</label>
                  <Select 
                    value={prioridadeFilter || "todas"}
                    onValueChange={(value) => setPrioridadeFilter(value === "todas" ? null : value)}
                  >
                    <SelectTrigger className="h-8">
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

                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Período</label>
                  <Select 
                    value={periodoFilter}
                    onValueChange={(value: PeriodoFilter) => setPeriodoFilter(value)}
                  >
                    <SelectTrigger className="h-8">
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

            {isLoading ? (
              <div className="flex items-center justify-center min-h-[500px] w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex items-center justify-center min-h-[500px] w-full">
                <span className="text-gray-500 text-lg">Nenhuma tarefa encontrada</span>
              </div>
            ) : (
              <div className="overflow-x-auto md:overflow-x-hidden w-full">
                <KanbanBoard tasks={filteredTasks} />
              </div>
            )}
          </div>
        </PollingWrapper>
      </AuthenticatedLayout>
    </AuthRequired>
  )
}

