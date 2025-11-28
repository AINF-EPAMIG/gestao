"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Edit,
  FileText,
  Code,
  Server,
  Link2,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { Sistema } from "@/types/sistema"
import { SidebarSistema } from "@/components/sidebar-sistema"

interface FormData {
  nome: string
  sigla: string
  objetivo: string
  tipo: string
  status: string
  tecnologia_principal: string
  banco_dados: string
  servidor: string
  url_producao: string
  url_homologacao: string
  url_documentacao: string
  repositorio_git: string
  sistemas_integrados: string
  rotinas_principais: string
  data_inicio: string
  observacoes: string
}

const initialFormData: FormData = {
  nome: "",
  sigla: "",
  objetivo: "",
  tipo: "",
  status: "",
  tecnologia_principal: "",
  banco_dados: "",
  servidor: "",
  url_producao: "",
  url_homologacao: "",
  url_documentacao: "",
  repositorio_git: "",
  sistemas_integrados: "",
  rotinas_principais: "",
  data_inicio: "",
  observacoes: "",
}

export default function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [originalData, setOriginalData] = useState<Sistema | null>(null)
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
        const projeto = data.find((p: Sistema) => p.id === parseInt(id))
        
        if (!projeto) {
          toast({
            title: "Erro",
            description: "Projeto não encontrado",
            variant: "destructive",
          })
          router.push("/asti/gestao-sistema/consultar")
          return
        }

        setOriginalData(projeto)
        
        // Formatar datas para o formato do input date
        const formatDate = (dateString: string | null | undefined) => {
          if (!dateString) return ""
          const date = new Date(dateString)
          return date.toISOString().split("T")[0]
        }

        setFormData({
          nome: projeto.nome || "",
          sigla: projeto.sigla || "",
          objetivo: projeto.objetivo || "",
          tipo: projeto.tipo?.toString() || "",
          status: projeto.status?.toString() || "",
          tecnologia_principal: projeto.tecnologia_principal || "",
          banco_dados: projeto.banco_dados || "",
          servidor: projeto.servidor || "",
          url_producao: projeto.url_producao || "",
          url_homologacao: projeto.url_homologacao || "",
          url_documentacao: projeto.url_documentacao || "",
          repositorio_git: projeto.repositorio_git || "",
          sistemas_integrados: projeto.sistemas_integrados || "",
          rotinas_principais: projeto.rotinas_principais || "",
          data_inicio: formatDate(projeto.data_inicio),
          observacoes: projeto.observacoes || "",
        })
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

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}
    
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório"
    }
    if (!formData.tipo) {
      newErrors.tipo = "Tipo é obrigatório"
    }
    if (!formData.status) {
      newErrors.status = "Status é obrigatório"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        id: parseInt(id),
        ...formData,
        tipo: formData.tipo ? parseInt(formData.tipo) : null,
        status: formData.status ? parseInt(formData.status) : null,
      }

      const response = await fetch("/api/projetos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar projeto")
      }

      toast({
        title: "Sucesso!",
        description: "Projeto atualizado com sucesso.",
      })

      router.push("/asti/gestao-sistema/consultar")
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar projeto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const handleReset = () => {
    if (originalData) {
      const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return ""
        const date = new Date(dateString)
        return date.toISOString().split("T")[0]
      }

      setFormData({
        nome: originalData.nome || "",
        sigla: originalData.sigla || "",
        objetivo: originalData.objetivo || "",
        tipo: originalData.tipo?.toString() || "",
        status: originalData.status?.toString() || "",
        tecnologia_principal: originalData.tecnologia_principal || "",
        banco_dados: originalData.banco_dados || "",
        servidor: originalData.servidor || "",
        url_producao: originalData.url_producao || "",
        url_homologacao: originalData.url_homologacao || "",
        url_documentacao: originalData.url_documentacao || "",
        repositorio_git: originalData.repositorio_git || "",
        sistemas_integrados: originalData.sistemas_integrados || "",
        rotinas_principais: originalData.rotinas_principais || "",
        data_inicio: formatDate(originalData.data_inicio),
        observacoes: originalData.observacoes || "",
      })
      setErrors({})
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
        <SidebarSistema />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-600">Carregando dados do projeto...</p>
            </div>
          </div>
        </main>
      </div>
    )
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
                <Edit className="h-5 w-5 text-yellow-600" />
                <h1 className="text-lg font-semibold text-gray-900">
                  Editar Projeto: {originalData?.nome}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Restaurar
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto">
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="geral" className="space-y-6">
                <TabsList className="bg-white border border-gray-200 p-1 shadow-sm">
                  <TabsTrigger value="geral" className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Informações Gerais
                  </TabsTrigger>
                  <TabsTrigger value="tecnico" className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700">
                    <Code className="h-4 w-4 mr-2" />
                    Dados Técnicos
                  </TabsTrigger>
                  <TabsTrigger value="links" className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700">
                    <Link2 className="h-4 w-4 mr-2" />
                    Links e Documentação
                  </TabsTrigger>
                </TabsList>

            {/* Informações Gerais */}
            <TabsContent value="geral">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-yellow-600" />
                    Informações Gerais
                  </CardTitle>
                  <CardDescription>
                    Edite as informações básicas do projeto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-sm font-medium">
                        Nome do Projeto <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleChange("nome", e.target.value)}
                        placeholder="Ex: Sistema de Gestão de Projetos"
                        className={errors.nome ? "border-red-500" : ""}
                      />
                      {errors.nome && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.nome}
                        </p>
                      )}
                    </div>

                    {/* Sigla */}
                    <div className="space-y-2">
                      <Label htmlFor="sigla" className="text-sm font-medium">
                        Sigla
                      </Label>
                      <Input
                        id="sigla"
                        value={formData.sigla}
                        onChange={(e) => handleChange("sigla", e.target.value.toUpperCase())}
                        placeholder="Ex: SGP"
                        maxLength={20}
                      />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="text-sm font-medium">
                        Tipo de Projeto <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.tipo} 
                        onValueChange={(value) => handleChange("tipo", value)}
                      >
                        <SelectTrigger className={errors.tipo ? "border-red-500" : ""}>
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
                      {errors.tipo && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.tipo}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => handleChange("status", value)}
                      >
                        <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Produção</SelectItem>
                          <SelectItem value="2">Em Desenvolvimento</SelectItem>
                          <SelectItem value="3">Manutenção</SelectItem>
                          <SelectItem value="4">Descontinuado</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.status}
                        </p>
                      )}
                    </div>

                    {/* Data de Início */}
                    <div className="space-y-2">
                      <Label htmlFor="data_inicio" className="text-sm font-medium">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Data de Início
                      </Label>
                      <Input
                        id="data_inicio"
                        type="date"
                        value={formData.data_inicio}
                        onChange={(e) => handleChange("data_inicio", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Objetivo */}
                  <div className="space-y-2">
                    <Label htmlFor="objetivo" className="text-sm font-medium">
                      Objetivo / Descrição
                    </Label>
                    <Textarea
                      id="objetivo"
                      value={formData.objetivo}
                      onChange={(e) => handleChange("objetivo", e.target.value)}
                      placeholder="Descreva o objetivo e finalidade do projeto..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dados Técnicos */}
            <TabsContent value="tecnico">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-yellow-600" />
                    Dados Técnicos
                  </CardTitle>
                  <CardDescription>
                    Informações sobre tecnologias e stack utilizado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tecnologia Principal */}
                    <div className="space-y-2">
                      <Label htmlFor="tecnologia_principal" className="text-sm font-medium">
                        Tecnologia Principal
                      </Label>
                      <Input
                        id="tecnologia_principal"
                        value={formData.tecnologia_principal}
                        onChange={(e) => handleChange("tecnologia_principal", e.target.value)}
                        placeholder="Ex: Node.js, Python, Java..."
                      />
                    </div>

                    {/* Banco de Dados */}
                    <div className="space-y-2">
                      <Label htmlFor="banco_dados" className="text-sm font-medium">
                        Banco de Dados
                      </Label>
                      <Input
                        id="banco_dados"
                        value={formData.banco_dados}
                        onChange={(e) => handleChange("banco_dados", e.target.value)}
                        placeholder="Ex: MySQL, PostgreSQL, MongoDB..."
                      />
                    </div>

                    {/* Servidor */}
                    <div className="space-y-2">
                      <Label htmlFor="servidor" className="text-sm font-medium">
                        <Server className="h-4 w-4 inline mr-1" />
                        Servidor
                      </Label>
                      <Input
                        id="servidor"
                        value={formData.servidor}
                        onChange={(e) => handleChange("servidor", e.target.value)}
                        placeholder="Ex: srv-web-01, AWS EC2..."
                      />
                    </div>

                    {/* Repositório Git */}
                    <div className="space-y-2">
                      <Label htmlFor="repositorio_git" className="text-sm font-medium">
                        Repositório Git
                      </Label>
                      <Input
                        id="repositorio_git"
                        type="url"
                        value={formData.repositorio_git}
                        onChange={(e) => handleChange("repositorio_git", e.target.value)}
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>

                  {/* Sistemas Integrados */}
                  <div className="space-y-2">
                    <Label htmlFor="sistemas_integrados" className="text-sm font-medium">
                      Sistemas Integrados
                    </Label>
                    <Textarea
                      id="sistemas_integrados"
                      value={formData.sistemas_integrados}
                      onChange={(e) => handleChange("sistemas_integrados", e.target.value)}
                      placeholder="Liste os sistemas que se integram com este projeto..."
                      rows={3}
                    />
                  </div>

                  {/* Rotinas Principais */}
                  <div className="space-y-2">
                    <Label htmlFor="rotinas_principais" className="text-sm font-medium">
                      Rotinas Principais
                    </Label>
                    <Textarea
                      id="rotinas_principais"
                      value={formData.rotinas_principais}
                      onChange={(e) => handleChange("rotinas_principais", e.target.value)}
                      placeholder="Descreva as principais rotinas do sistema..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Links e Documentação */}
            <TabsContent value="links">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-yellow-600" />
                    Links e Documentação
                  </CardTitle>
                  <CardDescription>
                    URLs e links de acesso ao projeto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* URL Produção */}
                    <div className="space-y-2">
                      <Label htmlFor="url_producao" className="text-sm font-medium">
                        URL de Produção
                      </Label>
                      <Input
                        id="url_producao"
                        type="url"
                        value={formData.url_producao}
                        onChange={(e) => handleChange("url_producao", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    {/* URL Homologação */}
                    <div className="space-y-2">
                      <Label htmlFor="url_homologacao" className="text-sm font-medium">
                        URL de Homologação
                      </Label>
                      <Input
                        id="url_homologacao"
                        type="url"
                        value={formData.url_homologacao}
                        onChange={(e) => handleChange("url_homologacao", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    {/* URL Documentação */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="url_documentacao" className="text-sm font-medium">
                        URL da Documentação
                      </Label>
                      <Input
                        id="url_documentacao"
                        type="url"
                        value={formData.url_documentacao}
                        onChange={(e) => handleChange("url_documentacao", e.target.value)}
                        placeholder="https://docs...."
                      />
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label htmlFor="observacoes" className="text-sm font-medium">
                      Observações
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => handleChange("observacoes", e.target.value)}
                      placeholder="Observações adicionais sobre o projeto..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end gap-3">
            <Button 
              type="button"
              variant="destructive" 
              onClick={handleCancel}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </main>
</div>
  )
}
