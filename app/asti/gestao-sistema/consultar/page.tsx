"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FilterPanel } from "./components/filter-panel"
import { ResultsSection } from "./components/results-section"
import { SidebarSistema } from "@/components/sidebar-sistema"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, PlusCircle, Info, Code, Server, Link, FileText, Calendar, User, Eye, Building } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Sistema } from "@/types/sistema"
import { useToast } from "@/hooks/use-toast"
import { getTipoLabel, getStatusLabel } from "@/lib/sistema-utils"

// Tipagem local para atividades (apenas campos usados nesta página)
type Atividade = {
  id: number
  titulo: string
  descricao?: string | null
  projeto_id: number
  data_inicio?: string | null
  data_fim?: string | null
  status_id: number
  ultima_atualizacao?: string | null
  data_criacao?: string | null
}

export default function ConsultarSistemasPage() {
  const router = useRouter()
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")
  
  // Estados para dialog de visualização
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingSistema, setViewingSistema] = useState<Sistema | null>(null)
  
  // Estados para atividades do projeto
  const [projectActivities, setProjectActivities] = useState<Atividade[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  
  // Estados para setores
  const [setores, setSetores] = useState<{id: number, sigla: string, nome: string}[]>([])
  
  const { toast } = useToast()

  useEffect(() => {
    fetchSistemas()
    fetchSetores()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSistemas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/projetos?type=full")
      if (!response.ok) throw new Error("Erro ao carregar projetos")
      const data = await response.json()
      setSistemas(data)
    } catch (error) {
      console.error("Erro ao buscar projetos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSetores = async () => {
    try {
      const response = await fetch("/api/setor")
      if (!response.ok) throw new Error("Erro ao carregar setores")
      const data = await response.json()
      setSetores(data)
    } catch (error) {
      console.error("Erro ao buscar setores:", error)
    }
  }

  const fetchProjectActivities = async (projectId: number) => {
    try {
      setActivitiesLoading(true)
      const response = await fetch("/api/atividades?all=true")
      if (!response.ok) throw new Error("Erro ao carregar atividades")
      const data = (await response.json()) as Atividade[]

      // Filtrar atividades do projeto específico
      const projectActivities = data.filter((activity: Atividade) => activity.projeto_id === projectId)

      // Ordenar por ordem decrescente (mais recentes primeiro)
      projectActivities.sort((a: Atividade, b: Atividade) => {
        const dateA = new Date(a.ultima_atualizacao || a.data_criacao || '')
        const dateB = new Date(b.ultima_atualizacao || b.data_criacao || '')
        return dateB.getTime() - dateA.getTime()
      })
      
      setProjectActivities(projectActivities)
    } catch (error) {
      console.error("Erro ao buscar atividades do projeto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as atividades do projeto",
        variant: "destructive",
      })
    } finally {
      setActivitiesLoading(false)
    }
  }

  const filteredSistemas = sistemas.filter((sistema) => {
    const matchesSearch = 
      sistema.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sistema.sigla?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sistema.objetivo?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTipo = tipoFilter === "todos" || sistema.tipo === Number(tipoFilter)
    const matchesStatus = statusFilter === "todos" || sistema.status === Number(statusFilter)
    
    return matchesSearch && matchesTipo && matchesStatus
  })

  const handleEdit = (sistema: Sistema) => {
    // Navegar para a página de edição
    router.push(`/asti/gestao-sistema/editar/${sistema.id}`)
  }

  const handleView = (sistema: Sistema) => {
    setViewingSistema(sistema)
    setViewDialogOpen(true)
    fetchProjectActivities(sistema.id)
  }

  const getSetorNome = (setorId: number | null): string => {
    if (!setorId) return "Não informado"
    const setor = setores.find(s => s.id === setorId)
    return setor ? `${setor.sigla} - ${setor.nome}` : "Setor não encontrado"
  }

  const getActivityStatusLabel = (statusId: number): string => {
    switch (statusId) {
      case 1: return "Não Iniciada"
      case 2: return "Em Desenvolvimento"
      case 3: return "Em Testes"
      case 4: return "Concluída"
      default: return "Desconhecido"
    }
  }

  const handleNewProject = () => {
    router.push("/asti/gestao-sistema/cadastrar")
  }

  // Quantitativos das atividades do projeto (usado na aba 'Tarefas do Kanban')
  const totalActivities = projectActivities.length
  const countNotStarted = projectActivities.filter(a => a.status_id === 1).length
  const countDev = projectActivities.filter(a => a.status_id === 2).length
  const countTests = projectActivities.filter(a => a.status_id === 3).length
  const countDone = projectActivities.filter(a => a.status_id === 4).length

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
      <SidebarSistema />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="w-full space-y-6">
          {/* Header com botão de novo projeto */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Consultar Projetos</h1>
              <p className="text-gray-500 mt-1">Visualize, edite ou exclua projetos cadastrados</p>
            </div>
            <Button 
              onClick={handleNewProject}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </div>

          {/* Filters */}
          <FilterPanel
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            tipoFilter={tipoFilter}
            setTipoFilter={setTipoFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {/* Results */}
          <ResultsSection
            sistemas={filteredSistemas}
            loading={loading}
            onEdit={handleEdit}
            onDelete={() => {}}
            onView={handleView}
          />
        </div>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {viewingSistema && (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Eye className="h-6 w-6 text-blue-600" />
                    {viewingSistema.nome}
                  </DialogTitle>
                </DialogHeader>

                {/* Badges de Status */}
                <div className="flex gap-2 flex-wrap">
                  {viewingSistema.tipo && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {getTipoLabel(viewingSistema.tipo)}
                    </Badge>
                  )}
                  {viewingSistema.status && (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                      {getStatusLabel(viewingSistema.status)}
                    </Badge>
                  )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="geral" className="space-y-6">
                  <TabsList className="bg-white border border-gray-200 p-1 shadow-sm">
                    <TabsTrigger value="geral" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <FileText className="h-4 w-4 mr-2" />
                      Informações Gerais
                    </TabsTrigger>
                    <TabsTrigger value="tecnico" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <Code className="h-4 w-4 mr-2" />
                      Dados Técnicos
                    </TabsTrigger>
                    <TabsTrigger value="links" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <Link className="h-4 w-4 mr-2" />
                      Links e Documentação
                    </TabsTrigger>
                    <TabsTrigger value="tarefas" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <Info className="h-4 w-4 mr-2" />
                      Tarefas do Kanban
                    </TabsTrigger>
                  </TabsList>

                  {/* Informações Gerais */}
                  <TabsContent value="geral">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Informações Gerais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Nome do Projeto */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600">Nome do Projeto</label>
                            <p className="text-gray-900 font-medium">{viewingSistema.nome}</p>
                          </div>

                          {/* Sigla */}
                          {viewingSistema.sigla && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-600">Sigla</label>
                              <p className="text-gray-900 font-medium">{viewingSistema.sigla}</p>
                            </div>
                          )}

                          {/* Tipo de Projeto */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600">Tipo de Projeto</label>
                            <Badge variant="outline" className="text-sm">
                              {viewingSistema.tipo === 1 ? 'Sistema' :
                               viewingSistema.tipo === 2 ? 'Site' :
                               viewingSistema.tipo === 3 ? 'API' :
                               viewingSistema.tipo === 4 ? 'Mobile' :
                               viewingSistema.tipo === 5 ? 'Rotina' :
                               viewingSistema.tipo === 6 ? 'Infraestrutura' : 'Outros'}
                            </Badge>
                          </div>

                          {/* Status */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <Badge
                              variant={
                                viewingSistema.status === 1 ? 'default' :
                                viewingSistema.status === 2 ? 'secondary' :
                                viewingSistema.status === 3 ? 'outline' : 'destructive'
                              }
                              className="text-sm"
                            >
                              {viewingSistema.status === 1 ? 'Produção' :
                               viewingSistema.status === 2 ? 'Em Desenvolvimento' :
                               viewingSistema.status === 3 ? 'Manutenção' : 'Descontinuado'}
                            </Badge>
                          </div>

                          {/* Setor */}
                          {viewingSistema.setor_id && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                Setor
                              </label>
                              <p className="text-gray-900">{getSetorNome(viewingSistema.setor_id)}</p>
                            </div>
                          )}

                          {/* Data de Início */}
                          {viewingSistema.data_inicio && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Data de Início
                              </label>
                              <p className="text-gray-900">{new Date(viewingSistema.data_inicio).toLocaleDateString('pt-BR')}</p>
                            </div>
                          )}
                        </div>

                        {/* Objetivo / Descrição */}
                        {viewingSistema.objetivo && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Objetivo / Descrição</label>
                            <div className="p-4 bg-gray-50 rounded-md">
                              <p className="text-gray-900 whitespace-pre-wrap">{viewingSistema.objetivo}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Dados Técnicos */}
                  <TabsContent value="tecnico">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-blue-600" />
                          Dados Técnicos
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {viewingSistema.tecnologia_principal && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-600">Tecnologia Principal</label>
                              <p className="text-gray-900">{viewingSistema.tecnologia_principal}</p>
                            </div>
                          )}
                          {viewingSistema.banco_dados && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-600">Banco de Dados</label>
                              <p className="text-gray-900">{viewingSistema.banco_dados}</p>
                            </div>
                          )}
                          {viewingSistema.servidor && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                <Server className="h-4 w-4" />
                                Servidor
                              </label>
                              <p className="text-gray-900">{viewingSistema.servidor}</p>
                            </div>
                          )}
                          {viewingSistema.repositorio_git && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-600">Repositório Git</label>
                              <a 
                                href={viewingSistema.repositorio_git} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                              >
                                {viewingSistema.repositorio_git}
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Links e Documentação */}
                  <TabsContent value="links">
                    <div className="space-y-6">
                      {/* URLs */}
                      {(viewingSistema.url_producao || viewingSistema.url_homologacao || viewingSistema.url_documentacao) && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Link className="h-5 w-5 text-blue-600" />
                              URLs de Acesso
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {viewingSistema.url_producao && (
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-600">URL de Produção</label>
                                  <a 
                                    href={viewingSistema.url_producao} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {viewingSistema.url_producao}
                                  </a>
                                </div>
                              )}
                              {viewingSistema.url_homologacao && (
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-600">URL de Homologação</label>
                                  <a 
                                    href={viewingSistema.url_homologacao} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {viewingSistema.url_homologacao}
                                  </a>
                                </div>
                              )}
                              {viewingSistema.url_documentacao && (
                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-sm font-medium text-gray-600">URL da Documentação</label>
                                  <a 
                                    href={viewingSistema.url_documentacao} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {viewingSistema.url_documentacao}
                                  </a>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Integrações e Funcionalidades */}
                      {(viewingSistema.sistemas_integrados || viewingSistema.rotinas_principais) && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Code className="h-5 w-5 text-blue-600" />
                              Integrações e Funcionalidades
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {viewingSistema.sistemas_integrados && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Sistemas Integrados</label>
                                  <div className="p-3 bg-gray-50 rounded-md">
                                    <p className="text-gray-900 whitespace-pre-wrap">{viewingSistema.sistemas_integrados}</p>
                                  </div>
                                </div>
                              )}
                              {viewingSistema.rotinas_principais && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Rotinas Principais</label>
                                  <div className="p-3 bg-gray-50 rounded-md">
                                    <p className="text-gray-900 whitespace-pre-wrap">{viewingSistema.rotinas_principais}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Observações */}
                      {viewingSistema.observacoes && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              Observações
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="p-4 bg-gray-50 rounded-md">
                              <p className="text-gray-900 whitespace-pre-wrap">{viewingSistema.observacoes}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tarefas do Kanban */}
                  <TabsContent value="tarefas">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          Tarefas do Kanban
                        </CardTitle>
                        <CardDescription>
                          Lista de tarefas associadas a este projeto
                        </CardDescription>

                        {/* Quantitativos por status e total */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-800 font-semibold">{countNotStarted}</span>
                            <span className="whitespace-nowrap">Não Iniciada</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 font-semibold">{countDev}</span>
                            <span className="whitespace-nowrap">Em Desenvolvimento</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 text-yellow-800 font-semibold">{countTests}</span>
                            <span className="whitespace-nowrap">Em Testes</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 font-semibold">{countDone}</span>
                            <span className="whitespace-nowrap">Concluída</span>
                          </div>

                          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                            <span className="text-sm text-gray-500">Total</span>
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-800 text-white font-semibold">{totalActivities}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {activitiesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-gray-500">Carregando tarefas...</div>
                          </div>
                        ) : projectActivities.length === 0 ? (
                          <div className="text-center py-8">
                            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma tarefa encontrada para este projeto</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {projectActivities.map((activity) => (
                              <Card key={activity.id} className="border-l-4 border-l-blue-500">
                                <CardContent className="pt-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Título */}
                                    <div className="space-y-1">
                                      <label className="text-sm font-medium text-gray-600">Título</label>
                                      <p className="text-gray-900 font-medium">{activity.titulo}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1">
                                      <label className="text-sm font-medium text-gray-600">Status</label>
                                      <Badge
                                        variant={
                                          activity.status_id === 1 ? 'secondary' :
                                          activity.status_id === 2 ? 'default' :
                                          activity.status_id === 3 ? 'outline' :
                                          activity.status_id === 4 ? 'default' : 'secondary'
                                        }
                                        className={
                                          activity.status_id === 1 ? 'bg-gray-100 text-gray-800' :
                                          activity.status_id === 2 ? 'bg-blue-100 text-blue-800' :
                                          activity.status_id === 3 ? 'bg-yellow-100 text-yellow-800' :
                                          activity.status_id === 4 ? 'bg-green-100 text-green-800' : ''
                                        }
                                      >
                                        {getActivityStatusLabel(activity.status_id)}
                                      </Badge>
                                    </div>

                                    {/* Data de Início */}
                                    <div className="space-y-1">
                                      <label className="text-sm font-medium text-gray-600">Data de Início</label>
                                      <p className="text-gray-900">
                                        {activity.data_inicio ? new Date(activity.data_inicio).toLocaleDateString('pt-BR') : 'Não definida'}
                                      </p>
                                    </div>

                                    {/* Data de Fim */}
                                    <div className="space-y-1">
                                      <label className="text-sm font-medium text-gray-600">Data de Fim</label>
                                      <p className="text-gray-900">
                                        {activity.data_fim ? new Date(activity.data_fim).toLocaleDateString('pt-BR') : 'Não definida'}
                                      </p>
                                    </div>

                                    {/* Última Atualização */}
                                    <div className="space-y-1">
                                      <label className="text-sm font-medium text-gray-600">Última Atualização</label>
                                      <p className="text-gray-900 text-sm">
                                        {activity.ultima_atualizacao ? new Date(activity.ultima_atualizacao).toLocaleString('pt-BR') : 
                                         activity.data_criacao ? new Date(activity.data_criacao).toLocaleString('pt-BR') : 'Não disponível'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Descrição */}
                                  {activity.descricao && (
                                    <div className="mt-4 space-y-2">
                                      <label className="text-sm font-medium text-gray-600">Descrição</label>
                                      <div className="p-3 bg-gray-50 rounded-md">
                                        <p className="text-gray-900 whitespace-pre-wrap text-sm">{activity.descricao}</p>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Metadados */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      {viewingSistema.quem_cadastrou && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Cadastrado por: {viewingSistema.quem_cadastrou}</span>
                        </div>
                      )}
                      {viewingSistema.quem_editou && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Última edição por: {viewingSistema.quem_editou}</span>
                        </div>
                      )}
                      {viewingSistema.created_at && (
                        <div>
                          Criado em: {new Date(viewingSistema.created_at).toLocaleString('pt-BR')}
                        </div>
                      )}
                      {viewingSistema.updated_at && (
                        <div>
                          Última atualização: {new Date(viewingSistema.updated_at).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Action buttons */}
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setViewDialogOpen(false)}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                  >
                    Fechar
                  </Button>
                  <Button 
                    onClick={() => {
                      setViewDialogOpen(false)
                      router.push(`/asti/gestao-sistema/editar/${viewingSistema.id}`)
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
