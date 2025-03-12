"use client"
import { PollingWrapper } from "@/components/polling-wrapper"
import { KanbanBoard } from "@/components/kanban-board"
import { useTaskStore } from "@/lib/store"
import { CreateTaskModal } from "@/components/create-task-modal"
import AuthRequired from "@/components/auth-required"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, isUserChefe, getResponsaveisBySetor, isUserAdmin } from "@/lib/rm-service"
import { Loader2 } from "lucide-react"

type PeriodoFilter = "todos" | "hoje" | "esta_semana" | "este_mes" | "este_ano"

interface ResponsavelRM {
  NOME: string;
  EMAIL: string;
  CHEFE: string;
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
          const userInfo = await getUserInfoFromRM(session.user.email);
          
          // Verifica se é admin
          const isAdmin = isUserAdmin(session.user.email);
          
          // Verifica se é chefe e configura o filtro inicial
          const isChefe = isUserChefe(userInfo);
          if (!isChefe && !isAdmin) {
            setResponsavelFilter(session.user.email);
          }

          // Busca responsáveis do setor selecionado ou do setor do usuário
          const setorParaBuscar = selectedSetor || userInfo?.SECAO;
          if (setorParaBuscar) {
            const responsaveis = await getResponsaveisBySetor(setorParaBuscar);
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
      <PollingWrapper>
        <div className="p-3 sm:p-4 md:p-8 pt-12 md:pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">Kanban</h1>
            <div className="mt-2 md:mt-0">
              <CreateTaskModal />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 sm:mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-2 flex-wrap w-full">
              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-sm text-gray-500">Filtrar por Responsável</label>
                <Select 
                  value={responsavelFilter || "todos"}
                  onValueChange={(value) => setResponsavelFilter(value === "todos" ? null : value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full md:w-[400px]">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SelectValue placeholder="Responsável" />
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

              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-sm text-gray-500">Filtrar por Projeto</label>
                <Select 
                  value={projetoFilter || "todos"}
                  onValueChange={(value) => setProjetoFilter(value === "todos" ? null : value)}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Projeto" />
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

              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-sm text-gray-500">Filtrar por Status</label>
                <Select 
                  value={statusFilter || "todos"}
                  onValueChange={(value) => setStatusFilter(value === "todos" ? null : value)}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Status" />
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

              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-sm text-gray-500">Filtrar por Prioridade</label>
                <Select 
                  value={prioridadeFilter || "todas"}
                  onValueChange={(value) => setPrioridadeFilter(value === "todas" ? null : value)}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto max-h-[200px]">
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="1">Alta</SelectItem>
                    <SelectItem value="2">Média</SelectItem>
                    <SelectItem value="3">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-sm text-gray-500">Filtrar por Período</label>
                <Select 
                  value={periodoFilter}
                  onValueChange={(value: PeriodoFilter) => setPeriodoFilter(value)}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto max-h-[200px]">
                    <SelectItem value="todos">Todos os Períodos</SelectItem>
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
            <div className="flex items-center justify-center min-h-[600px] w-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[600px] w-full">
              <span className="text-gray-500 text-lg">Nenhuma tarefa encontrada</span>
            </div>
          ) : (
            <KanbanBoard tasks={filteredTasks} />
          )}
        </div>
      </PollingWrapper>
    </AuthRequired>
  )
}

