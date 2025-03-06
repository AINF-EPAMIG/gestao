"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskStore, Task } from "@/lib/store"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, isUserChefe, isUserAdmin, getSubordinadosFromRM, getResponsaveisBySetor } from "@/lib/rm-service"
import { Plus, X, Search } from "lucide-react"
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
  
  // Novo estado para o modal de seleção de ID Release
  const [openReleaseModal, setOpenReleaseModal] = useState(false)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [selectedReleaseTask, setSelectedReleaseTask] = useState<Task | null>(null)

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
    setIdRelease("")
    setSelectedReleaseTask(null)
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

  // Função para buscar todas as tarefas
  const fetchAllTasks = useCallback(async () => {
    try {
      setLoadingTasks(true)
      console.log('Buscando todas as tarefas do banco de dados...')
      
      // Buscar todas as tarefas sem filtros
      const response = await fetch('/api/atividades?all=true', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Resposta da API:', data)
        console.log('Tarefas encontradas:', data.length)
        
        // Garantir que temos um array de tarefas
        if (Array.isArray(data)) {
          setAllTasks(data)
          setFilteredTasks(data)
          
          // Se já tiver um ID Release selecionado, encontre a tarefa correspondente
          if (idRelease) {
            const selectedTask = data.find((task: Task) => task.id.toString() === idRelease)
            if (selectedTask) {
              setSelectedReleaseTask(selectedTask)
            }
          }
        } else {
          console.log('Formato inválido retornado da API:', data)
          setAllTasks([])
          setFilteredTasks([])
        }
      } else {
        console.error('Erro na resposta da API:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Detalhes do erro:', errorText)
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
    } finally {
      setLoadingTasks(false)
    }
  }, [idRelease])

  // Função para filtrar tarefas com base no termo de busca
  const filterTasks = useCallback((term: string) => {
    if (!term.trim()) {
      setFilteredTasks(allTasks)
      return
    }
    
    const lowerTerm = term.toLowerCase()
    const filtered = allTasks.filter(task => {
      // Verificar se o ID da tarefa contém o termo de busca
      const idMatch = task.id.toString().includes(lowerTerm)
      
      // Verificar se o título da tarefa contém o termo de busca (se existir)
      const tituloMatch = task.titulo ? task.titulo.toLowerCase().includes(lowerTerm) : false
      
      // Verificar se a descrição da tarefa contém o termo de busca (se existir)
      const descricaoMatch = task.descricao ? task.descricao.toLowerCase().includes(lowerTerm) : false
      
      return idMatch || tituloMatch || descricaoMatch
    })
    
    setFilteredTasks(filtered)
  }, [allTasks])

  // Função para selecionar uma tarefa como ID Release
  const selectTaskAsRelease = (task: Task) => {
    setIdRelease(task.id.toString())
    setSelectedReleaseTask(task)
    setOpenReleaseModal(false)
  }

  // Efeito para buscar tarefas quando o modal de release é aberto
  useEffect(() => {
    if (openReleaseModal) {
      console.log('Modal de release aberto, buscando tarefas...')
      fetchAllTasks()
    }
  }, [openReleaseModal, fetchAllTasks])

  // Efeito para filtrar tarefas quando o termo de busca muda
  useEffect(() => {
    filterTasks(searchTerm)
  }, [searchTerm, filterTasks])

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
          <DialogContent className="sm:max-w-[600px] sm:h-auto p-6">
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

              <div className="max-h-[70vh] overflow-y-auto">
                <div className="p-1">
                  <TabsContent value="detalhes" className="space-y-2 py-2">
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Título *</label>
                        <Input
                          required
                          value={titulo}
                          onChange={(e) => setTitulo(e.target.value)}
                          placeholder="Digite o título da tarefa"
                          className="h-8"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Descrição</label>
                        <Textarea
                          value={descricao}
                          onChange={(e) => setDescricao(e.target.value)}
                          placeholder="Digite a descrição da tarefa"
                          className="h-20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  value={idRelease || ''}
                                  placeholder="Selecione um ID de release"
                                  className="flex-1 bg-gray-50 pr-8"
                                  readOnly
                                />
                                {idRelease && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                    onClick={() => {
                                      setIdRelease("")
                                      setSelectedReleaseTask(null)
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setOpenReleaseModal(true)}
                                className="shrink-0"
                              >
                                Selecionar
                              </Button>
                            </div>
                            {selectedReleaseTask && (
                              <div className="text-sm text-gray-500 truncate">
                                {selectedReleaseTask.titulo}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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

                      <div className="grid grid-cols-2 gap-3">
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
                          <div className="mt-1 space-y-1">
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
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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

                  <TabsContent value="anexos" className="py-2">
                    <div>
                      <FileUpload 
                        onFileSelect={handleFileSelect}
                        onRemoveFile={handleRemoveFile}
                        files={cachedFiles}
                        showUploadButton={false}
                        totalAnexos={cachedFiles.length}
                      />
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal de seleção de ID Release */}
      <Dialog open={openReleaseModal} onOpenChange={setOpenReleaseModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Selecionar ID Release</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center border rounded-md mb-4">
              <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">
                {filteredTasks.length > 0 ? `${filteredTasks.length} tarefas encontradas` : ''}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAllTasks}
                disabled={loadingTasks}
              >
                {loadingTasks ? 'Carregando...' : 'Recarregar'}
              </Button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              {loadingTasks ? (
                <div className="p-8 flex justify-center items-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="ml-2">Carregando tarefas...</span>
                </div>
              ) : filteredTasks.length > 0 ? (
                <div className="divide-y">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                        idRelease === task.id.toString() ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => selectTaskAsRelease(task)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          <span className="inline-block min-w-[30px] text-center bg-gray-100 rounded-md mr-2">
                            {task.id}
                          </span>
                          {task.titulo || 'Sem título'}
                        </div>
                        {task.descricao && (
                          <div className="text-sm text-gray-500 truncate max-w-[400px] pl-[40px]">
                            {task.descricao}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant={idRelease === task.id.toString() ? "default" : "ghost"} 
                        size="sm"
                        className="ml-2 shrink-0"
                      >
                        {idRelease === task.id.toString() ? "Selecionada" : "Selecionar"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-gray-500 mb-4">
                    {searchTerm ? 'Nenhuma tarefa encontrada para esta busca' : 'Nenhuma tarefa encontrada'}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={fetchAllTasks}
                    disabled={loadingTasks}
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReleaseModal(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 