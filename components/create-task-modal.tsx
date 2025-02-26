"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskStore } from "@/lib/store"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, isUserChefe, isUserAdmin, getSubordinadosFromRM, getResponsaveisBySetor } from "@/lib/rm-service"
import { Plus, X } from "lucide-react"
import { DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "./file-upload"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getUserIcon } from "@/lib/utils"

interface Projeto {
  id: number
  nome: string
  taskCount?: number
}

interface Responsavel {
  EMAIL: string;
  NOME: string;
  CARGO?: string;
}

interface Setor {
  id: number;
  sigla: string;
  nome: string;
}

interface CachedFile {
  file: File;
  id: string; // ID temporário para gerenciamento
}

export function CreateTaskModal() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [openProjeto, setOpenProjeto] = useState(false)
  const [novoProjeto, setNovoProjeto] = useState("")
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [projetoId, setProjetoId] = useState<string>("")
  const [responsavelInput, setResponsavelInput] = useState("")
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<Responsavel[]>([])
  const [prioridade, setPrioridade] = useState("2") // Média como padrão
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState("")
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [isChefe, setIsChefe] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [setores, setSetores] = useState<Setor[]>([])
  const [selectedSetor, setSelectedSetor] = useState<string>("")
  const setTasks = useTaskStore((state) => state.setTasks)
  const [projetoInput, setProjetoInput] = useState("")
  const [idRelease, setIdRelease] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
  const [setorInput, setSetorInput] = useState("")
  const [showSetorSuggestions, setShowSetorSuggestions] = useState(false)
  const setorRef = useRef<HTMLInputElement>(null)
  const responsavelRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("detalhes")
  const [cachedFiles, setCachedFiles] = useState<CachedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingProjeto, setIsSubmittingProjeto] = useState(false)

  useEffect(() => {
    // Verificar se o usuário é chefe ou admin e pré-selecionar o próprio usuário
    const checkUserRole = async () => {
      if (session?.user?.email) {
        try {
          // Verificar se é admin
          const admin = isUserAdmin(session.user.email);
          setIsAdmin(admin);

          // Buscar informações do usuário
          const userInfo = await getUserInfoFromRM(session.user.email);
          if (userInfo) {
            const isUserChefeResult = isUserChefe(userInfo);
            setIsChefe(isUserChefeResult);
            setSelectedSetor(userInfo.SECAO);
            setSetorInput(userInfo.SECAO);

            // Se for chefe ou admin, buscar subordinados
            if (isUserChefeResult || admin) {
              const subordinadosData = await getSubordinadosFromRM(session.user.email);
              if (subordinadosData) {
                const formattedSubordinados = subordinadosData.map(sub => ({
                  EMAIL: sub.EMAIL_SUBORDINADO,
                  NOME: sub.NOME_SUBORDINADO,
                  CARGO: sub.CARGO_SUBORDINADO
                }));
                setResponsaveis(formattedSubordinados);
              }
            } else {
              // Para usuários comuns, buscar todos os responsáveis do setor
              const responsaveisData = await getResponsaveisBySetor(userInfo.SECAO);
              if (responsaveisData) {
                setResponsaveis(responsaveisData);
              }
            }

            // Pré-seleciona o próprio usuário como responsável
            if (session?.user?.email) {
              const userResponsavel: Responsavel = {
                EMAIL: session.user.email,
                NOME: userInfo.NOME_COMPLETO,
                CARGO: userInfo.CARGO
              };
              
              setResponsaveis(prev => [userResponsavel, ...prev]);
              setSelectedResponsaveis([userResponsavel]);
            }

            // Se for admin, buscar lista de setores
            if (admin) {
              try {
                const setoresResponse = await fetch('/api/setor');
                if (setoresResponse.ok) {
                  const setoresData = await setoresResponse.json();
                  setSetores(setoresData);
                }
              } catch (error) {
                console.error('Erro ao carregar dados:', error);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar papel do usuário:', error);
        }
      }
    };

    checkUserRole();
  }, [session?.user?.email]);

  useEffect(() => {
    // Atualizar responsáveis quando o setor selecionado mudar (para todos os usuários)
    const updateResponsaveis = async () => {
      if (selectedSetor) {
        try {
          const responsaveisData = await getResponsaveisBySetor(selectedSetor);
          if (responsaveisData) {
            setResponsaveis(responsaveisData);
          }
        } catch (error) {
          console.error('Erro ao carregar responsáveis:', error);
        }
      }
    };

    updateResponsaveis();
  }, [selectedSetor]);

  useEffect(() => {
    // Carregar projetos do banco com contagem de tarefas
    const fetchProjetos = async () => {
      try {
        const response = await fetch('/api/projetos?includeTaskCount=true')
        if (response.ok) {
          const data = await response.json()
          setProjetos(data)
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error)
      }
    }

    fetchProjetos()
  }, [])

  const handleFileSelect = (files: File[]) => {
    const newCachedFiles = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(7) // ID temporário único
    }))
    setCachedFiles(prev => [...prev, ...newCachedFiles])
  }

  const handleRemoveFile = (id: string) => {
    setCachedFiles(prev => prev.filter(file => file.id !== id))
  }

  const uploadCachedFiles = async (taskId: number) => {
    if (cachedFiles.length === 0) return

    const formData = new FormData()
    formData.append("taskId", taskId.toString())
    
    cachedFiles.forEach(({file}) => {
      formData.append("files", file)
    })

    try {
      const response = await fetch("/api/anexos/upload", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("Erro ao fazer upload dos arquivos")
      }

      setCachedFiles([])
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      alert("Alguns anexos podem não ter sido enviados. Por favor, verifique na tela de detalhes da tarefa.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/atividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo,
          descricao,
          projeto_id: parseInt(projetoId),
          responsaveis_emails: selectedResponsaveis.map(r => r.EMAIL),
          data_inicio: dataInicio,
          data_fim: dataFim,
          status_id: 1,
          prioridade_id: parseInt(prioridade),
          userEmail: session?.user?.email,
          setorSigla: selectedSetor,
          data_criacao: new Date().toISOString(),
          id_release: idRelease || null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(data)
        
        const createdTask = data.find((task: { titulo: string; descricao: string }) => 
          task.titulo === titulo && 
          task.descricao === descricao
        )
        
        if (createdTask) {
          // Upload dos arquivos em cache
          await uploadCachedFiles(createdTask.id)
          handleFinish()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar tarefa')
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      alert('Erro ao criar tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = () => {
    setOpen(false)
    // Resetar campos
    setTitulo("")
    setDescricao("")
    setProjetoId("")
    setPrioridade("2")
    setDataFim("")
    setSelectedResponsaveis([])
    setActiveTab("detalhes")
    setCachedFiles([])
  }

  const handleProjetoSelect = (projeto: Projeto) => {
    setProjetoId(projeto.id.toString())
    setProjetoInput(projeto.nome)
    setShowSuggestions(false)
  }

  const handleResponsavelSelect = (responsavel: Responsavel) => {
    if (!selectedResponsaveis.find(r => r.EMAIL === responsavel.EMAIL)) {
      setSelectedResponsaveis([...selectedResponsaveis, responsavel]);
    }
    setResponsavelInput("");
    setShowResponsavelSuggestions(false);
  }

  const removeResponsavel = (email: string) => {
    setSelectedResponsaveis(selectedResponsaveis.filter(r => r.EMAIL !== email));
  }

  const handleSetorSelect = async (setor: Setor) => {
    setSelectedSetor(setor.sigla)
    setSetorInput(setor.sigla + (setor.nome ? ` ${setor.nome}` : ''))
    setShowSetorSuggestions(false)

    try {
      const responsaveisData = await getResponsaveisBySetor(setor.sigla);
      if (responsaveisData) {
        setResponsaveis(responsaveisData);
      }
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
    }
  }

  const handleCreateProjeto = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingProjeto(true)
    
    try {
      const nomeCapitalizado = novoProjeto.charAt(0).toUpperCase() + novoProjeto.slice(1);
      
      // Adiciona um delay artificial de 1.5 segundos
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch('/api/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeCapitalizado })
      })

      if (response.ok) {
        const novoProjeto = await response.json()
        setProjetos(prev => [...prev, novoProjeto])
        setOpenProjeto(false)
        setNovoProjeto("")
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
    } finally {
      setIsSubmittingProjeto(false)
    }
  }

  // Efeito para fechar a lista de sugestões quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (responsavelRef.current && !responsavelRef.current.contains(event.target as Node)) {
        setShowResponsavelSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="flex gap-2">
        <Dialog open={openProjeto} onOpenChange={setOpenProjeto}>
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-500"
              disabled={!isChefe && !isAdmin}
              title={!isChefe && !isAdmin ? "Apenas chefes e administradores podem criar novos projetos" : ""}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {projetos.map(projeto => (
                    <div 
                      key={projeto.id} 
                      className="p-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <span className="font-medium">{projeto.nome}</span>
                      <span className="text-sm text-gray-500">
                        {projeto.taskCount || 0} tarefa{projeto.taskCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {(isChefe || isAdmin) && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Criar Novo Projeto</span>
                    </div>
                  </div>

                  <form onSubmit={handleCreateProjeto} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome do Projeto *</label>
                      <Input
                        required
                        value={novoProjeto}
                        onChange={(e) => setNovoProjeto(e.target.value)}
                        placeholder="Digite o nome do projeto"
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white hover:bg-blue-500"
                        disabled={isSubmittingProjeto}
                      >
                        {isSubmittingProjeto ? "Criando..." : "Criar Projeto"}
                      </Button>
                    </DialogFooter>
                  </form>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-emerald-800 text-white hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] sm:h-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="anexos">
                  Anexos {cachedFiles.length > 0 ? ` (${cachedFiles.length})` : ""}
                </TabsTrigger>
              </TabsList>

              <div className="min-h-[600px] overflow-y-auto pr-2">
                <TabsContent value="detalhes" className="space-y-4 py-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Título *</label>
                      <Input
                        required
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Digite o título da tarefa"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Digite a descrição da tarefa"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Projeto</label>
                        <div className="relative">
                          <Input
                            ref={inputRef}
                            value={projetoInput}
                            onChange={(e) => {
                              setProjetoInput(e.target.value)
                              setShowSuggestions(true)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Digite o nome do projeto"
                            className="w-full"
                          />
                          {showSuggestions && projetoInput && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                              {projetos
                                .filter(p => p.nome.toLowerCase().includes(projetoInput.toLowerCase()))
                                .map(projeto => (
                                  <div
                                    key={projeto.id}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleProjetoSelect(projeto)}
                                  >
                                    {projeto.nome}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">ID Release</label>
                        <Input
                          value={idRelease}
                          onChange={(e) => setIdRelease(e.target.value)}
                          placeholder="Digite o ID da release"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Prioridade</label>
                        <Select value={prioridade} onValueChange={setPrioridade}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                          <SelectContent position="item-aligned" side="bottom" align="start">
                            <SelectItem value="1">Alta</SelectItem>
                            <SelectItem value="2">Média</SelectItem>
                            <SelectItem value="3">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Setor</label>
                        {isAdmin ? (
                          <div className="relative">
                            <Input
                              ref={setorRef}
                              value={setorInput}
                              onChange={(e) => {
                                setSetorInput(e.target.value)
                                setShowSetorSuggestions(true)
                              }}
                              onFocus={() => setShowSetorSuggestions(true)}
                              placeholder="Digite o setor"
                              className="w-full"
                            />
                            {showSetorSuggestions && setorInput && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                                {setores
                                  .filter(s => 
                                    s.sigla.toLowerCase().includes(setorInput.toLowerCase()) ||
                                    (s.nome && s.nome.toLowerCase().includes(setorInput.toLowerCase()))
                                  )
                                  .map(setor => (
                                    <div
                                      key={setor.id}
                                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                      onClick={() => handleSetorSelect(setor)}
                                    >
                                      {setor.sigla}{setor.nome ? ` ${setor.nome}` : ''}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Input
                            value={setorInput}
                            disabled
                            className="bg-gray-100"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Responsáveis</label>
                      <div className="relative" ref={responsavelRef}>
                        <Input
                          value={responsavelInput}
                          onChange={(e) => {
                            setResponsavelInput(e.target.value);
                            setShowResponsavelSuggestions(true);
                          }}
                          onFocus={() => setShowResponsavelSuggestions(true)}
                          placeholder="Digite o nome do responsável"
                        />
                        {showResponsavelSuggestions && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                            {responsaveis
                              .filter(r => {
                                const nameMatches = !responsavelInput || 
                                  ((r.NOME || '').toLowerCase().includes(responsavelInput.toLowerCase()));
                                const notAlreadySelected = !selectedResponsaveis.find(sr => sr.EMAIL === r.EMAIL);
                                return nameMatches && notAlreadySelected;
                              })
                              .map(responsavel => (
                                <div
                                  key={responsavel.EMAIL}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleResponsavelSelect(responsavel)}
                                >
                                  <div>{responsavel.NOME}</div>
                                  <div className="text-sm text-gray-500">{responsavel.EMAIL}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Lista de responsáveis selecionados */}
                      <div className="mt-2 space-y-2">
                        {selectedResponsaveis.map((responsavel) => (
                          <div key={responsavel.EMAIL} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={getUserIcon(responsavel.EMAIL)} />
                                <AvatarFallback>
                                  {responsavel.EMAIL[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {responsavel.NOME || responsavel.EMAIL.split('@')[0].replace('.', ' ')}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeResponsavel(responsavel.EMAIL)}
                            >
                              <X className="w-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Data de Início</label>
                        <Input
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Data de Fim Prevista</label>
                        <Input
                          type="date"
                          value={dataFim}
                          onChange={(e) => setDataFim(e.target.value)}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="w-full bg-emerald-800 text-white hover:bg-emerald-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Criando..." : "Criar Tarefa"}
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>

                <TabsContent value="anexos" className="space-y-4 py-4">
                  <div className="space-y-4">
                    <FileUpload 
                      onFileSelect={handleFileSelect}
                      onRemoveFile={handleRemoveFile}
                      files={cachedFiles}
                      showUploadButton={false}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
} 