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
import { Plus, X, Search, FolderIcon, Edit, Check, Trash } from "lucide-react"
import { DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "./file-upload"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getUserIcon } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"

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
  const [idRelease, setIdRelease] = useState<string | null>(null)
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
  const [projetoEditando, setProjetoEditando] = useState<Projeto | null>(null)
  const [nomeProjetoEditando, setNomeProjetoEditando] = useState("")
  const [isSubmittingEdicao, setIsSubmittingEdicao] = useState(false)
  const [isExcluindoProjeto, setIsExcluindoProjeto] = useState(false)
  const [projetoParaExcluir, setProjetoParaExcluir] = useState<Projeto | null>(null)
  const [erroExclusao, setErroExclusao] = useState("")
  
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
        console.log('Buscando projetos do servidor...');
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/projetos?includeTaskCount=true&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Projetos atualizados:', data);
          setProjetos(data);
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      }
    }

    // Buscar projetos inicialmente
    fetchProjetos()

    // Configurar intervalo para atualização periódica
    const intervalId = setInterval(() => {
      fetchProjetos()
    }, 10000) // Atualiza a cada 10 segundos

    // Adicionar listener para o evento de atualização de tarefas
    const handleTaskUpdated = (event: Event) => {
      console.log('Evento taskUpdated recebido:', (event as CustomEvent).detail);
      fetchProjetos();
    }
    
    window.addEventListener('taskUpdated', handleTaskUpdated)

    // Limpar intervalo e listener quando o componente for desmontado
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('taskUpdated', handleTaskUpdated)
    }
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
        
        // Se tiver anexos, faz o upload
        if (createdTask && cachedFiles.length > 0) {
          await uploadCachedFiles(createdTask.id)
        }
        
        // Disparar evento personalizado para notificar sobre a criação de tarefa
        const newProjetoId = parseInt(projetoId);
        console.log('Tarefa criada, projeto_id:', newProjetoId);
        const taskUpdatedEvent = new CustomEvent('taskUpdated', {
          detail: { 
            taskId: createdTask?.id, 
            newProjetoId: newProjetoId,
            action: 'create'
          }
        });
        window.dispatchEvent(taskUpdatedEvent);
        
        handleFinish()
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
    setIdRelease(null)
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

  const handleEditarProjeto = (projeto: Projeto) => {
    setProjetoEditando(projeto)
    setNomeProjetoEditando(projeto.nome)
  }

  const handleSalvarEdicao = async () => {
    if (!projetoEditando) return
    setIsSubmittingEdicao(true)

    try {
      const response = await fetch('/api/projetos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projetoEditando.id, nome: nomeProjetoEditando })
      })

      if (response.ok) {
        const projetoAtualizado = await response.json()
        setProjetos(prev => prev.map(p => 
          p.id === projetoAtualizado.id ? projetoAtualizado : p
        ))
        setProjetoEditando(null)
      }
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
    } finally {
      setIsSubmittingEdicao(false)
    }
  }

  const handleCancelarEdicao = () => {
    setProjetoEditando(null)
    setNomeProjetoEditando("")
  }

  const handleConfirmarExclusao = (projeto: Projeto) => {
    setProjetoParaExcluir(projeto)
    setIsExcluindoProjeto(true)
  }

  const handleExcluirProjeto = async () => {
    if (!projetoParaExcluir) return
    
    try {
      const response = await fetch(`/api/projetos?id=${projetoParaExcluir.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProjetos(prev => prev.filter(p => p.id !== projetoParaExcluir.id))
        setIsExcluindoProjeto(false)
        setProjetoParaExcluir(null)
        setErroExclusao("")
      } else {
        const data = await response.json()
        setErroExclusao(data.error || "Erro ao excluir projeto")
      }
    } catch (error) {
      console.error('Erro ao excluir projeto:', error)
      setErroExclusao("Erro ao excluir projeto")
    }
  }

  const handleCancelarExclusao = () => {
    setIsExcluindoProjeto(false)
    setProjetoParaExcluir(null)
    setErroExclusao("")
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
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-500"
              disabled={!isChefe && !isAdmin}
              title={!isChefe && !isAdmin ? "Apenas chefes e administradores podem gerenciar projetos" : ""}
            >
              <FolderIcon className="w-4 h-4 mr-2" />
              Projetos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Gerenciar Projetos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Lista de Projetos</h3>
                <Button 
                  onClick={() => setOpenProjeto(true)} 
                  size="sm" 
                  className="bg-blue-600 text-white hover:bg-blue-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Projeto
                </Button>
              </div>
              <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {projetos.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum projeto encontrado
                  </div>
                ) : (
                  projetos.map(projeto => (
                    <div 
                      key={projeto.id} 
                      className="p-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      {projetoEditando?.id === projeto.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <Input 
                            value={nomeProjetoEditando} 
                            onChange={(e) => setNomeProjetoEditando(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            size="sm" 
                            onClick={handleSalvarEdicao}
                            disabled={isSubmittingEdicao}
                            className="bg-green-600 hover:bg-green-500 text-white"
                          >
                            {isSubmittingEdicao ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancelarEdicao}
                            disabled={isSubmittingEdicao}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{projeto.nome}</span>
                            {projeto.taskCount !== undefined && (
                              <Badge variant="outline" className="ml-2">
                                {projeto.taskCount} {projeto.taskCount === 1 ? 'tarefa' : 'tarefas'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditarProjeto(projeto)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleConfirmarExclusao(projeto)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Modal para criar novo projeto */}
            <Dialog open={openProjeto} onOpenChange={setOpenProjeto}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Projeto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateProjeto}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nome-projeto">Nome do Projeto</Label>
                      <Input
                        id="nome-projeto"
                        value={novoProjeto}
                        onChange={(e) => setNovoProjeto(e.target.value)}
                        placeholder="Digite o nome do projeto"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setOpenProjeto(false)}
                      disabled={isSubmittingProjeto}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!novoProjeto.trim() || isSubmittingProjeto}
                      className="bg-blue-600 text-white hover:bg-blue-500"
                    >
                      {isSubmittingProjeto ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Projeto'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Modal de confirmação de exclusão */}
            <Dialog open={isExcluindoProjeto} onOpenChange={setIsExcluindoProjeto}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>Tem certeza que deseja excluir o projeto &quot;{projetoParaExcluir?.nome}&quot;?</p>
                  {projetoParaExcluir?.taskCount && projetoParaExcluir.taskCount > 0 ? (
                    <p className="mt-2 text-amber-600">
                      Este projeto possui {projetoParaExcluir.taskCount} {projetoParaExcluir.taskCount === 1 ? 'tarefa associada' : 'tarefas associadas'}.
                      Ao excluir o projeto, estas tarefas ficarão com projeto indefinido.
                    </p>
                  ) : null}
                  {erroExclusao && (
                    <p className="text-red-500 mt-2">{erroExclusao}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelarExclusao}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleExcluirProjeto}
                    className="bg-red-600 text-white hover:bg-red-500"
                  >
                    Excluir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                                      setIdRelease(null)
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
                        <div className="col-span-2">
                          <label className="text-sm text-gray-500">Responsáveis</label>
                          <div className="space-y-2">
                            <div className="relative">
                              <Input
                                value={responsavelInput}
                                onChange={(e) => {
                                  setResponsavelInput(e.target.value);
                                  setShowResponsavelSuggestions(true);
                                }}
                                onFocus={() => setShowResponsavelSuggestions(true)}
                                placeholder="Digite o nome do responsável"
                                className="h-9"
                              />
                              {showResponsavelSuggestions && responsavelInput && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
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
                                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b last:border-0 transition-colors"
                                        onClick={() => handleResponsavelSelect(responsavel)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Avatar className="w-6 h-6">
                                            <AvatarImage src={getUserIcon(responsavel.EMAIL)} />
                                            <AvatarFallback>
                                              {responsavel.EMAIL[0].toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium">{responsavel.NOME}</div>
                                            <div className="text-xs text-gray-500">{responsavel.EMAIL}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Lista de responsáveis selecionados */}
                            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-md">
                              {selectedResponsaveis.map((responsavel) => (
                                <div key={responsavel.EMAIL} className="flex items-center gap-2 bg-white rounded-full pl-1.5 pr-2 py-1 border shadow-sm">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={getUserIcon(responsavel.EMAIL)} />
                                    <AvatarFallback>
                                      {responsavel.EMAIL[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {responsavel.NOME || responsavel.EMAIL.split('@')[0].replace('.', ' ')}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:bg-gray-100 rounded-full ml-1"
                                    onClick={() => removeResponsavel(responsavel.EMAIL)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
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