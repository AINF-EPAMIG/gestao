"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskStore, Task } from "@/lib/store"
import { useSession } from "next-auth/react"
import { Plus, X, Search, FolderIcon, Edit, Check, Trash } from "lucide-react"
import { DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "./file-upload"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { needsProcessing, processLargeFile } from "@/lib/file-utils"

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
  const [estimativaHoras, setEstimativaHoras] = useState("8")
  const [modoPersonalizado, setModoPersonalizado] = useState(false)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [isChefe, setIsChefe] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [selectedSetor, setSelectedSetor] = useState<string>("")
  const setTasks = useTaskStore((state) => state.setTasks)
  const [projetoInput, setProjetoInput] = useState("")
  const [idRelease, setIdRelease] = useState<string | null>(null)
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedReleaseTask, setSelectedReleaseTask] = useState<Task | null>(null)
  
  // Novo estado para o modal de seleção de projeto
  const [openProjetoModal, setOpenProjetoModal] = useState(false)
  const [projetosSearchTerm, setProjetosSearchTerm] = useState("")
  const [filteredProjetos, setFilteredProjetos] = useState<Projeto[]>([])

  useEffect(() => {
    // Verificar se o usuário é chefe ou admin e pré-selecionar o próprio usuário
    const checkUserRole = async () => {
      if (session?.user?.email) {
        try {
          // Verificar se é admin
          const admin = await isUserAdmin();
          setIsAdmin(admin);

          // Buscar informações do usuário
          const userInfo = await getUserInfo(session.user.email);
          if (userInfo) {
            const isUserChefeResult = await isUserChefe(session.user.email);
            setIsChefe(isUserChefeResult);
            
            // Apenas define o setor se não for admin
            if (!admin) {
              setSelectedSetor(userInfo.secao);
            }

            // Se for chefe ou admin, buscar subordinados
            if (isUserChefeResult || admin) {
              const responsaveisData = await getResponsaveisBySetor(userInfo.secao);
              if (responsaveisData) {
                // Usar todos os responsáveis sem filtrar
                setResponsaveis(responsaveisData);
              }
            } else {
              // Para usuários comuns, buscar todos os responsáveis do setor e auto atribuir
              const responsaveisData = await getResponsaveisBySetor(userInfo.secao);
              if (responsaveisData) {
                // Usar todos os responsáveis sem filtrar
                setResponsaveis(responsaveisData);

                // Pré-seleciona o próprio usuário como responsável apenas para usuários comuns
                if (session?.user?.email) {
                  const userResponsavel: Responsavel = {
                    EMAIL: session.user.email,
                    NOME: userInfo.NOME_COMPLETO,
                    CARGO: userInfo.CARGO
                  };
                  
                  // Verifica se o usuário já não está na lista antes de adicionar
                  if (!responsaveisData.some((r: Responsavel) => r.EMAIL === userResponsavel.EMAIL)) {
                    setResponsaveis(prev => [userResponsavel, ...prev]);
                    setSelectedResponsaveis([userResponsavel]);
                  } else {
                    // Se o usuário já estiver na lista, apenas seleciona ele
                    setSelectedResponsaveis([responsaveisData.find((r: Responsavel) => r.EMAIL === userResponsavel.EMAIL)!]);
                  }
                }
              }
            }

            // Se for admin, buscar lista de setores
            if (admin) {
              try {
                const setoresResponse = await fetch('/api/setor');
                if (setoresResponse.ok) {
                  const setoresData = await setoresResponse.json();
                  setResponsaveis(setoresData);
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
            // Usar todos os responsáveis sem filtrar
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

  const handleFileSelect = async (files: File[]) => {
    try {
      // Verifica se algum arquivo é um arquivo compactado
      const compressedFormats = [
        'application/zip', 
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/vnd.rar',
        'application/x-7z-compressed',
        'application/gzip',
        'application/x-tar'
      ];
      
      // Verifica cada arquivo
      for (const file of files) {
        // Verifica pelo tipo MIME ou pela extensão do arquivo
        const isCompressedFile = 
          compressedFormats.includes(file.type) || 
          /\.(zip|rar|7z|tar|gz|tgz)$/i.test(file.name);
        
        if (isCompressedFile) {
          throw new Error("Não é permitido enviar arquivos compactados (ZIP, RAR, etc.) que podem conter múltiplos arquivos. Por favor, envie os arquivos individualmente.");
        }
      }
      
      let processedFiles = [...files];
      
      // Verifica se algum arquivo precisa ser processado
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (needsProcessing(file)) {
          try {
            // Processa o arquivo grande (apenas compactação)
            const result = await processLargeFile(file);
            // Substitui o arquivo original pelo compactado
            processedFiles = processedFiles.filter(f => f !== file).concat(result.files);
          } catch (error) {
            // Se houver erro na compactação, propaga o erro
            throw error;
          }
        }
      }
      
      const newCachedFiles = processedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substring(7) // ID temporário único
      }))
      setCachedFiles(prev => [...prev, ...newCachedFiles])
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
      alert(error instanceof Error ? error.message : "Erro ao processar arquivos grandes. Tente novamente.");
    }
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
    
    if (!titulo.trim()) {
      alert('Digite o título da tarefa')
      return
    }

    if (!projetoId) {
      alert('Selecione um projeto')
      return
    }
    
    if (selectedResponsaveis.length === 0) {
      alert('Selecione pelo menos um responsável para a tarefa')
      return
    }
    
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
          id_release: idRelease || null,
          estimativa_horas: estimativaHoras || null
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
        
        // Fechar o modal após a criação bem-sucedida
        setOpen(false);
        
        // Limpar o formulário
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
    setTitulo("")
    setDescricao("")
    setProjetoId("")
    setProjetoInput("")
    setPrioridade("2")
    setDataInicio(new Date().toISOString().split('T')[0])
    setDataFim("")
    setEstimativaHoras("8")
    setModoPersonalizado(false)
    
    // Manter apenas o usuário logado como responsável e remover os demais
    if (session?.user?.email) {
      // Usar função de callback para acessar o estado atual
      setSelectedResponsaveis(prevResponsaveis => {
        if (prevResponsaveis.length > 0) {
          // Filtrar para manter apenas o usuário logado
          const usuarioLogado = prevResponsaveis.find(r => r.EMAIL === session.user.email);
          if (usuarioLogado) {
            return [usuarioLogado];
          }
        }
        return [];
      });
    } else {
      setSelectedResponsaveis([]);
    }
    
    setActiveTab("detalhes")
    setCachedFiles([])
    setIdRelease(null)
    setResponsavelInput("")
    setShowResponsavelSuggestions(false)
  }

  const handleProjetoSelect = (projeto: Projeto) => {
    setProjetoId(projeto.id.toString())
    setProjetoInput(projeto.nome)
    setOpenProjetoModal(false)
  }

  const handleResponsavelSelect = (responsavel: Responsavel) => {
    // Verifica se o responsável já está selecionado
    const isAlreadySelected = selectedResponsaveis.some(r => r.EMAIL === responsavel.EMAIL);
    
    if (!isAlreadySelected) {
      // Cria uma nova instância do responsável para evitar referências compartilhadas
      const novoResponsavel = {
        EMAIL: responsavel.EMAIL,
        NOME: responsavel.NOME,
        CARGO: responsavel.CARGO
      };
      setSelectedResponsaveis(prev => [...prev, novoResponsavel]);
    }
    setResponsavelInput("");
    setShowResponsavelSuggestions(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSetorSelect = async (setor: Setor) => {
    setSelectedSetor(setor.sigla)
    try {
      const responsaveisData = await getResponsaveisBySetor(setor.sigla);
      if (responsaveisData) {
        setResponsaveis(responsaveisData);
      }
    } catch (error) {
      console.error("Erro ao buscar responsáveis por setor:", error);
    }
  };

  const removeResponsavel = (email: string) => {
    setSelectedResponsaveis(selectedResponsaveis.filter(r => r.EMAIL !== email));
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

  // Função para filtrar projetos com base no termo de busca
  const filterProjetos = useCallback((term: string) => {
    if (!term.trim()) {
      setFilteredProjetos(projetos)
      return
    }
    
    const lowerTerm = term.toLowerCase()
    const filtered = projetos.filter(projeto => 
      projeto.nome.toLowerCase().includes(lowerTerm)
    )
    
    setFilteredProjetos(filtered)
  }, [projetos])

  // Efeito para filtrar projetos quando o termo de busca muda
  useEffect(() => {
    filterProjetos(projetosSearchTerm)
  }, [projetosSearchTerm, filterProjetos])

  // Efeito para inicializar projetos filtrados quando o modal de projetos é aberto
  useEffect(() => {
    if (openProjetoModal) {
      setProjetosSearchTerm("")
      setFilteredProjetos(projetos)
    }
  }, [openProjetoModal, projetos])

  // Garantir que o usuário logado seja pré-atribuído quando o modal for aberto
  useEffect(() => {
    if (open && session?.user?.email) {
      // Buscar informações do usuário e pré-atribuir como responsável
      const preencherUsuarioLogado = async () => {
        try {
          if (session.user.email) {
            const userInfo = await getUserInfo(session.user.email);
            if (userInfo) {
              const userResponsavel: Responsavel = {
                EMAIL: session.user.email,
                NOME: userInfo.NOME_COMPLETO || '',
                CARGO: userInfo.CARGO || ''
              };
              
              // Usar função de callback para acessar o estado atual
              setSelectedResponsaveis(prevResponsaveis => {
                // Verificar se o usuário já não está na lista antes de adicionar
                if (prevResponsaveis.length === 0 || !prevResponsaveis.some((r: Responsavel) => r.EMAIL === userResponsavel.EMAIL)) {
                  return [userResponsavel];
                }
                return prevResponsaveis;
              });
            }
          }
        } catch (error) {
          console.error('Erro ao pré-atribuir usuário logado:', error);
        }
      };
      
      preencherUsuarioLogado();
    }
  // Remover selectedResponsaveis das dependências
  }, [open, session?.user?.email]);

  // Resetar estados quando o modal é fechado
  useEffect(() => {
    if (!open) {
      // Limpar campos quando o modal for fechado
      setTitulo("")
      setDescricao("")
      setProjetoId("")
      setProjetoInput("")
      setPrioridade("2")
      setDataInicio(new Date().toISOString().split('T')[0])
      setDataFim("")
      setEstimativaHoras("8")
      setModoPersonalizado(false)
      
      // Manter apenas o usuário logado como responsável e remover os demais
      if (session?.user?.email) {
        // Usar função de callback para acessar o estado atual
        setSelectedResponsaveis(prevResponsaveis => {
          if (prevResponsaveis.length > 0) {
            // Filtrar para manter apenas o usuário logado
            const usuarioLogado = prevResponsaveis.find((r: Responsavel) => r.EMAIL === session.user.email);
            if (usuarioLogado) {
              return [usuarioLogado];
            }
          }
          return [];
        });
      } else {
        setSelectedResponsaveis([]);
      }
      
      setActiveTab("detalhes")
      setCachedFiles([])
      setIdRelease(null)
      setSelectedReleaseTask(null)
      setResponsavelInput("")
      setShowResponsavelSuggestions(false)
    }
  // Remover selectedResponsaveis das dependências
  }, [open, session?.user?.email]);

  // Define a estimativa com um valor predefinido
  const definirEstimativa = (valor: number) => {
    // Se o valor já está selecionado, desmarca (limpa o valor)
    if (Number(estimativaHoras) === valor) {
      setEstimativaHoras("");
    } else {
      setEstimativaHoras(valor.toString());
    }
    setModoPersonalizado(false);
  };

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
          <DialogContent className="sm:max-w-[600px] sm:h-auto p-5 max-h-[95vh]">
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
          <DialogContent className="sm:max-w-[600px] sm:h-auto p-5 max-h-[95vh]">
            <DialogHeader className="pb-2">
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="anexos">
                  Anexos {cachedFiles.length > 0 ? ` (${cachedFiles.length})` : ""}
                </TabsTrigger>
              </TabsList>

              <div className="max-h-[75vh] overflow-y-auto pr-1">
                <div className="p-1">
                  <TabsContent value="detalhes" className="space-y-4 py-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Título *</label>
                          <Input
                            required
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Digite o título da tarefa"
                            className="h-8 mt-1"
                            maxLength={40}
                          />
                          <div className="flex justify-end mt-0.5">
                            <span className={`text-xs ${titulo.length > 32 ? 'text-red-500' : 'text-gray-500'}`}>
                              {titulo.length}/40
                            </span>
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Descrição</label>
                          <Textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Digite a descrição da tarefa"
                            className="h-14 min-h-[56px] mt-1"
                            maxLength={500}
                          />
                          <div className="flex justify-end mt-0.5">
                            <span className={`text-xs ${descricao.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                              {descricao.length}/500
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Projeto *</label>
                          <div className="flex gap-1 mt-1">
                            <div className="relative flex-1">
                              <Input
                                value={projetoInput}
                                placeholder="Selecione"
                                className="flex-1 bg-gray-50 pr-8 h-8"
                                readOnly
                              />
                              {projetoId && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                  onClick={() => {
                                    setProjetoId("")
                                    setProjetoInput("")
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setOpenProjetoModal(true)}
                              className="shrink-0 h-8"
                            >
                              Selecionar
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Prioridade</label>
                          <Select value={prioridade} onValueChange={setPrioridade}>
                            <SelectTrigger className="h-8 mt-1">
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                            <SelectContent position="item-aligned" side="bottom" align="start">
                              <SelectItem value="1">Alta</SelectItem>
                              <SelectItem value="2">Média</SelectItem>
                              <SelectItem value="3">Baixa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Data de Início *</label>
                          <Input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            required
                            className="h-8 mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Data de Fim Prevista</label>
                          <Input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="h-8 mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Estimativa de Horas</label>
                          <div className="space-y-1 mt-1">
                            <div className="grid grid-cols-5 gap-1">
                              {[0.5, 1, 2, 8].map((valor) => (
                                <Button
                                  key={valor}
                                  type="button"
                                  variant={Number(estimativaHoras) === valor ? "default" : "outline"}
                                  size="sm"
                                  className={`h-7 text-xs ${Number(estimativaHoras) === valor ? "bg-emerald-800 hover:bg-emerald-700 text-white" : ""}`}
                                  onClick={() => definirEstimativa(valor)}
                                >
                                  {valor < 1 ? `${valor * 60}min` : valor === 1 ? "1h" : `${valor}h`}
                                </Button>
                              ))}
                              <Button
                                type="button"
                                variant={modoPersonalizado ? "default" : "outline"}
                                size="sm"
                                className={`h-7 text-xs ${modoPersonalizado ? "bg-emerald-800 hover:bg-emerald-700 text-white" : ""}`}
                                onClick={() => setModoPersonalizado(!modoPersonalizado)}
                              >
                                Outro
                              </Button>
                            </div>
                            
                            {modoPersonalizado && (
                              <div className="flex items-center gap-1 mt-1">
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={estimativaHoras}
                                    onChange={(e) => setEstimativaHoras(e.target.value)}
                                    placeholder=""
                                    className="h-7"
                                  />
                                </div>
                                <span className="text-xs">h</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">ID Release</label>
                          <div className="flex gap-1 mt-1">
                            <div className="relative flex-1">
                              <Input
                                value={idRelease || ''}
                                placeholder="Selecione"
                                className="flex-1 bg-gray-50 pr-8 h-8"
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
                              className="shrink-0 h-8"
                            >
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 mt-2">
                        <label className="text-sm font-medium">Responsáveis *</label>
                        <div className="space-y-1 mt-1">
                          <div className="relative">
                            <Input
                              value={responsavelInput}
                              onChange={(e) => {
                                setResponsavelInput(e.target.value);
                                setShowResponsavelSuggestions(true);
                              }}
                              onFocus={() => setShowResponsavelSuggestions(true)}
                              placeholder="Digite o nome do responsável"
                              className="h-8"
                            />
                            {showResponsavelSuggestions && responsavelInput && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                {responsaveis
                                  .filter(r => {
                                    const nameMatches = !responsavelInput || 
                                      ((r.NOME || '').toLowerCase().includes(responsavelInput.toLowerCase()));
                                    const notAlreadySelected = !selectedResponsaveis.find((sr: Responsavel) => sr.EMAIL === r.EMAIL);
                                    return nameMatches && notAlreadySelected;
                                  })
                                  .map(responsavel => (
                                    <div
                                      key={responsavel.EMAIL}
                                      className="px-3 py-1.5 cursor-pointer hover:bg-gray-50 border-b last:border-0"
                                      onClick={() => handleResponsavelSelect(responsavel)}
                                    >
                                      <div className="flex flex-col">
                                        <div className="font-medium">
                                          {responsavel.NOME}
                                        </div>
                                        <div className="text-xs text-gray-500">{responsavel.EMAIL}</div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Lista de responsáveis selecionados */}
                          <div className="flex flex-wrap gap-1 min-h-[36px] p-1.5 bg-gray-50 rounded-md overflow-y-auto max-h-[70px] scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {selectedResponsaveis.map((responsavel) => (
                              <div key={responsavel.EMAIL} className="flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border shadow-sm">
                                <span className="text-sm font-medium">
                                  {responsavel.NOME || responsavel.EMAIL.split('@')[0].replace('.', ' ')}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-gray-100 rounded-full"
                                  onClick={() => removeResponsavel(responsavel.EMAIL)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="pt-1">
                        <Button 
                          type="submit" 
                          className="w-full bg-emerald-800 text-white hover:bg-emerald-700"
                          disabled={isSubmitting || !titulo.trim() || selectedResponsaveis.length === 0 || !projetoId}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Criando...
                            </>
                          ) : (
                            !titulo.trim() ? "Digite o título da tarefa" :
                            selectedResponsaveis.length === 0 ? "Selecione pelo menos um responsável" :
                            !projetoId ? "Selecione um projeto" : 
                            "Criar Tarefa"
                          )}
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
                      
                      {cachedFiles.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                          <p className="text-sm text-blue-700 flex items-start gap-2">
                            <span className="flex-shrink-0">ℹ️</span>
                            <span>Os arquivos serão enviados automaticamente quando a tarefa for criada.</span>
                          </p>
                        </div>
                      )}
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

      {/* Modal de seleção de Projeto */}
      <Dialog open={openProjetoModal} onOpenChange={setOpenProjetoModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Selecionar Projeto</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center border rounded-md mb-4">
              <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Buscar projeto..."
                value={projetosSearchTerm}
                onChange={(e) => setProjetosSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
              {projetosSearchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1"
                  onClick={() => setProjetosSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">
                {filteredProjetos.length > 0 ? `${filteredProjetos.length} projetos encontrados` : ''}
                <span className="text-xs text-gray-400 block mt-0.5">Novos projetos são criados apenas pela chefia imediata</span>
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              {filteredProjetos.length > 0 ? (
                <div className="divide-y">
                  {filteredProjetos.map((projeto) => (
                    <div
                      key={projeto.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                        projetoId === projeto.id.toString() ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => handleProjetoSelect(projeto)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{projeto.nome}</div>
                        {projeto.taskCount !== undefined && (
                          <div className="text-sm text-gray-500">
                            {projeto.taskCount} {projeto.taskCount === 1 ? 'tarefa' : 'tarefas'}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant={projetoId === projeto.id.toString() ? "default" : "ghost"} 
                        size="sm"
                        className="ml-2 shrink-0"
                      >
                        {projetoId === projeto.id.toString() ? "Selecionado" : "Selecionar"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-gray-500 mb-4">
                    {projetosSearchTerm ? 'Nenhum projeto encontrado para esta busca' : 'Nenhum projeto encontrado'}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenProjetoModal(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 