"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, X, Edit, Trash, Check, Loader2, FolderIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
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
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<Responsavel[]>([])
  const [prioridade, setPrioridade] = useState("2") // Média como padrão
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState("")
  const [estimativaHoras, setEstimativaHoras] = useState("8")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [modoPersonalizado, setModoPersonalizado] = useState(false)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [isChefe, setIsChefe] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [selectedSetor, setSelectedSetor] = useState<string>("")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [projetoInput, setProjetoInput] = useState("")
  const [idRelease, setIdRelease] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
  const responsavelRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("detalhes")
  const [cachedFiles, setCachedFiles] = useState<CachedFile[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [allTasks, setAllTasks] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchTerm, setSearchTerm] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingTasks, setLoadingTasks] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedReleaseTask, setSelectedReleaseTask] = useState<any | null>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  
  // Novo estado para o modal de seleção de projeto
  const [openProjetoModal, setOpenProjetoModal] = useState(false)
  const [projetosSearchTerm, setProjetosSearchTerm] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filteredProjetos, setFilteredProjetos] = useState<Projeto[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [responsavelInput, setResponsavelInput] = useState("")

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
              const setorUsuario = userInfo.departamento || userInfo.divisao || userInfo.assessoria || userInfo.secao;
              setSelectedSetor(setorUsuario);
            }

            // Se for chefe ou admin, buscar subordinados
            if (isUserChefeResult || admin) {
              const setorParaBuscar = userInfo.departamento || userInfo.divisao || userInfo.assessoria || userInfo.secao;
              const responsaveisData = await getResponsaveisBySetor(setorParaBuscar);
              if (responsaveisData) {
                // Usar todos os responsáveis sem filtrar
                setResponsaveis(responsaveisData);
              }
            } else {
              // Para usuários comuns, buscar todos os responsáveis do setor e auto atribuir
              const setorParaBuscar = userInfo.departamento || userInfo.divisao || userInfo.assessoria || userInfo.secao;
              const responsaveisData = await getResponsaveisBySetor(setorParaBuscar);
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
    const handleTaskUpdated = () => {
      fetchProjetos();
    }
    
    window.addEventListener('taskUpdated', handleTaskUpdated)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('taskUpdated', handleTaskUpdated)
    }
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.email) {
      alert('Usuário não autenticado')
      return
    }

    if (!titulo.trim()) {
      alert('Título é obrigatório')
      return
    }

    if (!projetoId) {
      alert('Projeto é obrigatório')
      return
    }

    if (selectedResponsaveis.length === 0) {
      alert('Pelo menos um responsável é obrigatório')
      return
    }

    setIsSubmitting(true)

    try {
      const responsaveisData = selectedResponsaveis.map(responsavel => ({
        email: responsavel.EMAIL,
        nome: responsavel.NOME
      }))

      const response = await fetch('/api/atividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo,
          descricao,
          projeto_id: parseInt(projetoId),
          responsaveis: responsaveisData,
          prioridade: parseInt(prioridade),
          data_inicio: dataInicio,
          data_fim: dataFim,
          horas_estimadas: estimativaHoras,
          userEmail: session.user.email
        }),
      })

      if (response.ok) {
        const newTask = await response.json()
        
        // Disparar evento para atualizar projetos
        window.dispatchEvent(new CustomEvent('taskUpdated', { 
          detail: { 
            action: 'created', 
            taskId: newTask.id,
            projetoId: newTask.projeto_id 
          } 
        }))

        alert('Tarefa criada com sucesso!')
        setOpen(false);
        handleFinish()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao criar tarefa')
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProjetoSelect = (projeto: Projeto) => {
    setProjetoId(projeto.id.toString())
    setProjetoInput(projeto.nome)
    setOpenProjetoModal(false)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        
        // Garantir que temos um array de tarefas
        if (Array.isArray(data)) {
          setAllTasks(data)
          setFilteredTasks(data)
          
          // Se já tiver um ID Release selecionado, encontre a tarefa correspondente
          if (idRelease) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const selectedTask = data.find((task: any) => task.id.toString() === idRelease)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectTaskAsRelease = (task: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setIdRelease(task.id.toString())
    setSelectedReleaseTask(task)
    setOpenReleaseModal(false)
  }

  // Efeito para buscar tarefas quando o modal de release é aberto
  useEffect(() => {
    if (openReleaseModal) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                      </div>
                    </form>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      </>
    )
  }