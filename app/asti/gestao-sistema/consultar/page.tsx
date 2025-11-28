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
import { Edit, Trash2, PlusCircle } from "lucide-react"
import type { Sistema } from "@/types/sistema"
import { useToast } from "@/hooks/use-toast"
import { getTipoLabel, getStatusLabel } from "@/lib/sistema-utils"

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
  
  const { toast } = useToast()

  useEffect(() => {
    fetchSistemas()
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
  }

  const handleDelete = async (id: number) => {
    // Navegar para a página de exclusão com confirmação
    router.push(`/asti/gestao-sistema/excluir/${id}`)
  }

  const handleNewProject = () => {
    router.push("/asti/gestao-sistema/cadastrar")
  }

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
            onDelete={handleDelete}
            onView={handleView}
          />
        </div>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {viewingSistema && (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    {viewingSistema.nome}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="flex gap-2">
                    {viewingSistema.tipo && (
                      <Badge className="bg-blue-100 text-blue-800">{getTipoLabel(viewingSistema.tipo)}</Badge>
                    )}
                    {viewingSistema.status && (
                      <Badge className="bg-emerald-100 text-emerald-800">{getStatusLabel(viewingSistema.status)}</Badge>
                    )}
                  </div>
                  {viewingSistema.sigla && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="font-semibold text-gray-700">Sigla:</span>{" "}
                      <span className="text-gray-900">{viewingSistema.sigla}</span>
                    </div>
                  )}
                  {viewingSistema.objetivo && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="font-semibold text-gray-700">Objetivo:</span>{" "}
                      <span className="text-gray-900">{viewingSistema.objetivo}</span>
                    </div>
                  )}
                  {viewingSistema.tecnologia_principal && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="font-semibold text-gray-700">Tecnologia Principal:</span>{" "}
                      <span className="text-gray-900">{viewingSistema.tecnologia_principal}</span>
                    </div>
                  )}
                  {viewingSistema.repositorio_git && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="font-semibold text-gray-700">Repositório Git:</span>{" "}
                      <a 
                        href={viewingSistema.repositorio_git} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {viewingSistema.repositorio_git}
                      </a>
                    </div>
                  )}
                  {viewingSistema.url_producao && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="font-semibold text-gray-700">URL Produção:</span>{" "}
                      <a 
                        href={viewingSistema.url_producao} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {viewingSistema.url_producao}
                      </a>
                    </div>
                  )}
                  {viewingSistema.url_homologacao && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="font-semibold text-gray-700">URL Homologação:</span>{" "}
                      <a 
                        href={viewingSistema.url_homologacao} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {viewingSistema.url_homologacao}
                      </a>
                    </div>
                  )}
                  {viewingSistema.observacoes && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="font-semibold text-gray-700">Observações:</span>{" "}
                      <span className="text-gray-900">{viewingSistema.observacoes}</span>
                    </div>
                  )}
                </div>
                
                {/* Action buttons in view dialog */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => setViewDialogOpen(false)}
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
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setViewDialogOpen(false)
                      router.push(`/asti/gestao-sistema/excluir/${viewingSistema.id}`)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
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
