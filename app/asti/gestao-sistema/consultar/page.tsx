"use client"

import { useEffect, useState } from "react"
import { FilterPanel } from "./components/filter-panel"
import { ResultsSection } from "./components/results-section"
import { SidebarSistema } from "@/components/sidebar-sistema"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Sistema } from "@/types/sistema"
import { useToast } from "@/hooks/use-toast"
import { getTipoLabel, getStatusLabel } from "@/lib/sistema-utils"

export default function ConsultarSistemasPage() {
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")
  
  // Estados para dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingSistema, setEditingSistema] = useState<Sistema | null>(null)
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
    setEditingSistema(sistema)
    setEditDialogOpen(true)
  }

  const handleView = (sistema: Sistema) => {
    setViewingSistema(sistema)
    setViewDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return

    try {
      const response = await fetch("/api/projetos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error("Erro ao excluir projeto")

      toast({
        title: "Sucesso",
        description: "Projeto excluído com sucesso!",
      })
      fetchSistemas()
    } catch (error) {
      console.error("Erro ao excluir projeto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o projeto",
        variant: "destructive",
      })
    }
  }

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingSistema) return

    try {
      const response = await fetch("/api/projetos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSistema),
      })

      if (!response.ok) throw new Error("Erro ao atualizar projeto")

      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso!",
      })
      setEditDialogOpen(false)
      setEditingSistema(null)
      fetchSistemas()
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o projeto",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
      <SidebarSistema />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="w-full space-y-6">
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Projeto</DialogTitle>
              <DialogDescription>
                Atualize as informações do projeto abaixo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-nome">Nome *</Label>
                  <Input
                    id="edit-nome"
                    value={editingSistema?.nome || ""}
                    onChange={(e) => setEditingSistema(prev => prev ? {...prev, nome: e.target.value} : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sigla">Sigla</Label>
                  <Input
                    id="edit-sigla"
                    value={editingSistema?.sigla || ""}
                    onChange={(e) => setEditingSistema(prev => prev ? {...prev, sigla: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tipo">Tipo</Label>
                  <Select
                    value={editingSistema?.tipo ? String(editingSistema.tipo) : ""}
                    onValueChange={(value) => setEditingSistema(prev => prev ? {...prev, tipo: Number(value) as Sistema['tipo']} : null)}
                  >
                    <SelectTrigger id="edit-tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Sistema</SelectItem>
                      <SelectItem value="2">Site</SelectItem>
                      <SelectItem value="3">API</SelectItem>
                      <SelectItem value="4">Mobile</SelectItem>
                      <SelectItem value="5">Rotina</SelectItem>
                      <SelectItem value="6">Infraestrutura</SelectItem>
                      <SelectItem value="7">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingSistema?.status ? String(editingSistema.status) : ""}
                    onValueChange={(value) => setEditingSistema(prev => prev ? {...prev, status: Number(value) as Sistema['status']} : null)}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Produção</SelectItem>
                      <SelectItem value="2">Em Desenvolvimento</SelectItem>
                      <SelectItem value="3">Manutenção</SelectItem>
                      <SelectItem value="4">Descontinuado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tecnologia">Tecnologia Principal</Label>
                  <Input
                    id="edit-tecnologia"
                    value={editingSistema?.tecnologia_principal || ""}
                    onChange={(e) => setEditingSistema(prev => prev ? {...prev, tecnologia_principal: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-objetivo">Objetivo</Label>
                  <Textarea
                    id="edit-objetivo"
                    value={editingSistema?.objetivo || ""}
                    onChange={(e) => setEditingSistema(prev => prev ? {...prev, objetivo: e.target.value} : null)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
