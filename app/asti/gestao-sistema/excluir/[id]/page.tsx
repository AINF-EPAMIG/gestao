"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  Code,
  Server,
  Calendar,
  Users,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Sistema } from "@/types/sistema"
import { getTipoLabel, getStatusLabel } from "@/lib/sistema-utils"
import { SidebarSistema } from "@/components/sidebar-sistema"

const getTipoBadgeColor = (tipo?: number) => {
  switch (tipo) {
    case 1: return "bg-blue-600 text-white hover:bg-blue-700"
    case 2: return "bg-green-600 text-white hover:bg-green-700"
    case 3: return "bg-yellow-600 text-white hover:bg-yellow-700"
    case 4: return "bg-teal-600 text-white hover:bg-teal-700"
    case 5: return "bg-gray-600 text-white hover:bg-gray-700"
    case 6: return "bg-stone-600 text-white hover:bg-stone-700"
    case 7: return "bg-slate-600 text-white hover:bg-slate-700"
    default: return "bg-gray-600 text-white hover:bg-gray-700"
  }
}

const getStatusBadgeColor = (status?: number) => {
  switch (status) {
    case 1: return "bg-green-500 text-white hover:bg-green-600"
    case 2: return "bg-blue-500 text-white hover:bg-blue-600"
    case 3: return "bg-yellow-500 text-white hover:bg-yellow-600"
    case 4: return "bg-red-500 text-white hover:bg-red-600"
    default: return "bg-gray-500 text-white hover:bg-gray-600"
  }
}

export default function ExcluirProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [projeto, setProjeto] = useState<Sistema | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const { toast } = useToast()

  // Carregar dados do projeto
  useEffect(() => {
    const fetchProjeto = async () => {
      try {
        const response = await fetch(`/api/projetos?type=full`)
        if (!response.ok) {
          throw new Error("Erro ao buscar projeto")
        }
        
        const data = await response.json()
        const projetoEncontrado = data.find((p: Sistema) => p.id === parseInt(id))
        
        if (!projetoEncontrado) {
          toast({
            title: "Erro",
            description: "Projeto não encontrado",
            variant: "destructive",
          })
          router.push("/asti/gestao-sistema/consultar")
          return
        }

        setProjeto(projetoEncontrado)
      } catch (error) {
        console.error("Erro ao buscar projeto:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do projeto",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjeto()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router])

  const handleDelete = async () => {
    if (confirmText !== projeto?.nome) {
      toast({
        title: "Confirmação inválida",
        description: "Digite o nome do projeto corretamente para confirmar a exclusão.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/projetos?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir projeto")
      }

      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído permanentemente.",
      })

      router.push("/asti/gestao-sistema/consultar")
    } catch (error) {
      console.error("Erro ao excluir projeto:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir projeto",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
        <SidebarSistema />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-gray-600">Carregando dados do projeto...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!projeto) {
    return null
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
      <SidebarSistema />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h1 className="text-lg font-semibold text-gray-900">Excluir Projeto</h1>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
        {/* Warning Card */}
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-6 w-6" />
              Atenção: Esta ação é irreversível!
            </CardTitle>
            <CardDescription className="text-red-700">
              Você está prestes a excluir permanentemente o projeto abaixo. Esta ação não pode ser desfeita.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Project Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  {projeto.nome}
                </CardTitle>
                {projeto.sigla && (
                  <CardDescription className="mt-1">
                    Sigla: {projeto.sigla}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Badge className={getTipoBadgeColor(projeto.tipo)}>
                  {getTipoLabel(projeto.tipo)}
                </Badge>
                <Badge className={getStatusBadgeColor(projeto.status)}>
                  {getStatusLabel(projeto.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Objetivo */}
            {projeto.objetivo && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Objetivo</h4>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                  {projeto.objetivo}
                </p>
              </div>
            )}

            {/* Informações Técnicas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {projeto.tecnologia_principal && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Code className="h-3 w-3" />
                    Tecnologia
                  </div>
                  <p className="text-sm font-medium text-gray-900">{projeto.tecnologia_principal}</p>
                </div>
              )}
              
              {projeto.banco_dados && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Banco de Dados</div>
                  <p className="text-sm font-medium text-gray-900">{projeto.banco_dados}</p>
                </div>
              )}
              
              {projeto.servidor && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Server className="h-3 w-3" />
                    Servidor
                  </div>
                  <p className="text-sm font-medium text-gray-900">{projeto.servidor}</p>
                </div>
              )}
              
              {projeto.quem_cadastrou && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Users className="h-3 w-3" />
                    Cadastrado por
                  </div>
                  <p className="text-sm font-medium text-gray-900">{projeto.quem_cadastrou}</p>
                </div>
              )}
            </div>

            {/* Datas */}
            <div className="flex gap-6 text-sm">
              {projeto.data_inicio && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Início: {formatDate(projeto.data_inicio)}</span>
                </div>
              )}
              {projeto.created_at && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Cadastro: {formatDate(projeto.created_at)}</span>
                </div>
              )}
            </div>

            {/* URLs */}
            {(projeto.url_producao || projeto.url_homologacao || projeto.repositorio_git) && (
              <div className="flex flex-wrap gap-2">
                {projeto.url_producao && (
                  <a 
                    href={projeto.url_producao} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Produção
                  </a>
                )}
                {projeto.url_homologacao && (
                  <a 
                    href={projeto.url_homologacao} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Homologação
                  </a>
                )}
                {projeto.repositorio_git && (
                  <a 
                    href={projeto.repositorio_git} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Repositório
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-800">Confirmar Exclusão</CardTitle>
            <CardDescription>
              Para confirmar a exclusão, digite o nome do projeto: <strong>{projeto.nome}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite o nome do projeto"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="destructive" 
                onClick={handleCancel}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== projeto.nome}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </main>
</div>
  )
}
