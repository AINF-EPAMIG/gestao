"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash, Edit2, X, Check, Send, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTaskStore, getPriorityName, getStatusName, formatHours } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, isUserChefe, isUserAdmin, getResponsaveisBySetor } from "@/lib/rm-service"
import { TaskAttachments } from "./task-attachments"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { usePolling } from "./polling-wrapper"

interface TaskResponsavel {
  id: number;
  email: string;
  nome?: string;
  cargo?: string;
}

interface Responsavel {
  EMAIL: string;
  NOME: string;
  CARGO?: string;
}

interface Projeto {
  id: number;
  nome: string;
}

interface Comentario {
  id: number;
  atividade_id: number;
  usuario_email: string;
  usuario_nome: string | null;
  comentario: string;
  data_criacao: string;
  data_edicao: string | null;
}

interface Task {
  id: number;
  titulo: string;
  descricao: string;
  projeto_id: number;
  projeto_nome?: string;
  status_id: number;
  prioridade_id: number;
  estimativa_horas: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  id_release: string | null;
  ultima_atualizacao: string | null;
  responsaveis?: TaskResponsavel[];
}

interface TaskDetailsModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsModal({ task, open, onOpenChange }: TaskDetailsModalProps) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // Estado local para armazenar a tarefa em edição
  const [localTask, setLocalTask] = useState<Task>(task)
  const [titulo, setTitulo] = useState(task.titulo)
  const [descricao, setDescricao] = useState(task.descricao || "")
  const [prioridade, setPrioridade] = useState(task.prioridade_id.toString())
  const [estimativaHoras, setEstimativaHoras] = useState(task.estimativa_horas || "")
  const [dataInicio, setDataInicio] = useState(task.data_inicio ? new Date(task.data_inicio).toISOString().split('T')[0] : "")
  const [dataFim, setDataFim] = useState(task.data_fim ? new Date(task.data_fim).toISOString().split('T')[0] : "")
  const [responsavelInput, setResponsavelInput] = useState("")
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<Responsavel[]>([])
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [projetoId, setProjetoId] = useState(task.projeto_id?.toString() || "")
  const setTasks = useTaskStore((state) => state.setTasks)
  const updateTaskTimestamp = useTaskStore((state) => state.updateTaskTimestamp)
  const [comentario, setComentario] = useState("")
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [comentarioEditando, setComentarioEditando] = useState<number | null>(null)
  const [textoEditando, setTextoEditando] = useState("")
  // Acesso ao contexto de polling
  const { pausePolling, resumePolling } = usePolling()
  // Definindo o limite máximo de caracteres
  const MAX_TITLE_LENGTH = 40
  const MAX_DESCRIPTION_LENGTH = 500
  const MAX_COMMENT_LENGTH = 200

  const formatDate = (date: string | undefined | null) => {
    if (!date) return "-"
    
    try {
      // Para datas simples como "2025-04-24"
      const parts = date.split('-');
      if (parts.length !== 3) return date; // Formato não reconhecido
      
      const [year, month, day] = parts.map(num => parseInt(num, 10));
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return date; // Em caso de erro, retorna o valor original
    }
  }

  const formatDateTime = (dateTime: string | undefined | null) => {
    if (!dateTime) return '-';
    
    try {
      // Analisa a string ISO diretamente
      const [datePart, timePart] = dateTime.split('T');
      if (!datePart || !timePart) return dateTime; // Formato não reconhecido, retorna como está
      
      const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
      const [hourPart] = timePart.split('.');
      const [hour, minute] = hourPart.split(':').map(num => parseInt(num, 10));
      
      const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      console.error('Erro ao formatar data/hora:', error);
      return dateTime || '-'; // Em caso de erro, retorna o valor original
    }
  };

  const formatEstimativa = (estimativa: string | number | undefined | null) => {
    if (!estimativa) return "-"
    return formatHours(estimativa)
  }

  const formatDateTimeWithTime = (dateTime: string | undefined | null) => {
    if (!dateTime) return '-';
    
    try {
      // Analisa a string ISO diretamente para extrair os componentes, evitando conversões automáticas
      // A string vem no formato "2025-04-24T09:53:01.000Z" ou similar
      const [datePart, timePart] = dateTime.split('T');
      if (!datePart || !timePart) return dateTime; // Formato não reconhecido, retorna como está
      
      const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
      const [hourPart] = timePart.split('.');
      const [hour, minute, second] = hourPart.split(':').map(num => parseInt(num, 10));
      
      // Formata diretamente sem passar por objeto Date
      const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateTime || '-'; // Em caso de erro, retorna o valor original
    }
  };

  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user?.email) {
        try {
          // Verificar se é admin
          const admin = isUserAdmin(session.user.email);
          setCanEdit(admin);

          // Verificar se é responsável
          const isResponsavel = task.responsaveis?.some(
            (responsavel) => responsavel.email === session.user.email
          );
          if (isResponsavel) {
            setCanEdit(true);
          }

          // Buscar informações do usuário
          const userInfo = await getUserInfoFromRM(session.user.email);
          if (userInfo) {
            const isUserChefeResult = isUserChefe(userInfo);
            if (isUserChefeResult) {
              setCanEdit(true);
            }

            // Buscar responsáveis do setor
            const responsaveisData = await getResponsaveisBySetor(userInfo.SECAO);
            if (responsaveisData) {
              // Usar todos os responsáveis sem filtrar
              setResponsaveis(responsaveisData);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar papel do usuário:', error);
        }
      }
    };

    if (open) {
      checkUserRole();
    }
  }, [session?.user?.email, task.responsaveis, open]);

  // Controlar o polling com base no estado de edição
  useEffect(() => {
    if (isEditing) {
      // Pausar o polling quando entrar no modo de edição
      pausePolling();
    } else {
      // Retomar o polling quando sair do modo de edição
      resumePolling();
    }
    
    // Garantir que o polling seja retomado quando o componente for desmontado
    return () => {
      resumePolling();
    };
  }, [isEditing, pausePolling, resumePolling]);

  // Atualizar o estado local da tarefa apenas quando o modal for aberto ou quando a tarefa mudar e não estiver em modo de edição
  useEffect(() => {
    if (open && !isEditing) {
      setLocalTask(task);
      setTitulo(task.titulo);
      setDescricao(task.descricao || "");
      setPrioridade(task.prioridade_id.toString());
      setEstimativaHoras(task.estimativa_horas || "");
      setDataInicio(task.data_inicio ? new Date(task.data_inicio).toISOString().split('T')[0] : "");
      setDataFim(task.data_fim ? new Date(task.data_fim).toISOString().split('T')[0] : "");
      setProjetoId(task.projeto_id?.toString() || "");
    }
  }, [open, task, isEditing]);

  // Inicializar responsáveis selecionados apenas quando o modal for aberto ou a tarefa mudar e não estiver em modo de edição
  useEffect(() => {
    if (open && task.responsaveis && !isEditing) {
      setSelectedResponsaveis(
        task.responsaveis.map(r => ({
          EMAIL: r.email,
          NOME: r.nome || r.email.split('@')[0],
          CARGO: r.cargo
        })) || []
      );
    }
  }, [open, task.id, task.responsaveis, isEditing]);

  useEffect(() => {
    // Carregar projetos do banco
    const fetchProjetos = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/projetos?t=${timestamp}`, {
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
    };

    // Carregar responsáveis do setor
    const fetchResponsaveis = async () => {
      if (session?.user?.email) {
        try {
          const userInfo = await getUserInfoFromRM(session.user.email);
          if (userInfo?.SECAO) {
            const responsaveisData = await getResponsaveisBySetor(userInfo.SECAO);
            if (responsaveisData) {
              // Usar todos os responsáveis sem filtrar
              setResponsaveis(responsaveisData);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar responsáveis:', error);
        }
      }
    };

    if (isEditing) {
      fetchProjetos();
      fetchResponsaveis();
    }
  }, [isEditing, session?.user?.email]);

  useEffect(() => {
    const fetchComentarios = async () => {
      try {
        const response = await fetch(`/api/comentarios?atividade_id=${task.id}`);
        if (response.ok) {
          const data = await response.json();
          setComentarios(data);
        }
      } catch (error) {
        console.error('Erro ao carregar comentários:', error);
      }
    };

    if (open && !isEditing) {
      fetchComentarios();
    }
  }, [task.id, open, isEditing]);

  useEffect(() => {
    if (open) {
      // Carregar anexos antecipadamente
      fetchAnexos();
    }
  }, [open]);

  const fetchAnexos = async () => {
    try {
      // Simulação de carregamento de dados de anexos
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Aqui você pode adicionar a lógica real para buscar os anexos
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    }
  };

  const handleResponsavelSelect = (responsavel: Responsavel) => {
    if (!selectedResponsaveis.find(r => r.EMAIL === responsavel.EMAIL)) {
      setSelectedResponsaveis(prevResponsaveis => [...prevResponsaveis, responsavel]);
      console.log('Responsável adicionado:', responsavel.NOME);
    }
    setResponsavelInput("");
    // Não esconder as sugestões imediatamente para permitir múltiplas seleções
    // setShowResponsavelSuggestions(false);
  }

  const removeResponsavel = (email: string) => {
    setSelectedResponsaveis(prevResponsaveis => prevResponsaveis.filter(r => r.EMAIL !== email));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSaving(true);
      setIsFading(true);

      // Identificar novos responsáveis
      const responsaveisAtuais = task.responsaveis?.map(r => r.email) || [];
      const novosResponsaveis = selectedResponsaveis
        .filter(r => !responsaveisAtuais.includes(r.EMAIL))
        .map(r => r.EMAIL);

      // Armazenar o projeto_id original para comparação
      const originalProjetoId = task.projeto_id;
      const newProjetoId = parseInt(projetoId);
      const projetoChanged = originalProjetoId !== newProjetoId;

      const requestBody = {
        id: task.id,
        titulo,
        descricao,
        projeto_id: newProjetoId,
        responsaveis_emails: selectedResponsaveis.map(r => r.EMAIL),
        data_inicio: dataInicio,
        data_fim: dataFim,
        prioridade_id: parseInt(prioridade),
        estimativa_horas: estimativaHoras,
        userEmail: session?.user?.email,
        novosResponsaveis,
        editorName: session?.user?.name || session?.user?.email
      };

      // Após 1 segundo mostra o loading
      setTimeout(() => setShowLoading(true), 1000);

      const response = await fetch('/api/atividades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Aguarda 2 segundos para efeito visual
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (response.ok) {
        const updatedTasks = await response.json();
        setTasks(updatedTasks);
        setIsEditing(false);
        
        // Disparar evento personalizado para notificar sobre a atualização de tarefas
        // Só dispara se o projeto foi alterado
        if (projetoChanged) {
          console.log('Projeto alterado de', originalProjetoId, 'para', newProjetoId);
          const taskUpdatedEvent = new CustomEvent('taskUpdated', {
            detail: { 
              taskId: task.id, 
              oldProjetoId: originalProjetoId,
              newProjetoId: newProjetoId,
              action: 'edit'
            }
          });
          window.dispatchEvent(taskUpdatedEvent);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar tarefa');
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    } finally {
      setIsSaving(false);
      setIsFading(false);
      setShowLoading(false);
      // Retomar o polling após salvar
      resumePolling();
    }
  };

  const deleteTask = useTaskStore((state) => state.deleteTask)

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setIsFading(true);
      
      // Armazenar o projeto_id para uso no evento
      const projetoId = task.projeto_id;
      
      // Primeiro faz a requisição ao banco
      const deletePromise = fetch(`/api/atividades?id=${task.id}`, {
        method: 'DELETE',
      }).catch(() => {
        // Silenciosamente captura o erro
      });

      // Após 1 segundo mostra o loading
      setTimeout(() => setShowLoading(true), 1000);

      // Aguarda 2 segundos para efeito visual
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Aguarda a conclusão da requisição ao banco
      await deletePromise;

      // Remove do estado local e fecha o modal
      await deleteTask(task.id);
      
      // Disparar evento personalizado para notificar sobre a exclusão de tarefa
      console.log('Tarefa excluída, projeto_id:', projetoId);
      const taskUpdatedEvent = new CustomEvent('taskUpdated', {
        detail: { 
          taskId: task.id, 
          oldProjetoId: projetoId,
          action: 'delete'
        }
      });
      window.dispatchEvent(taskUpdatedEvent);
      
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    } finally {
      setIsDeleting(false);
      setIsFading(false);
      setShowLoading(false);
    }
  }

  const handleSendComment = async () => {
    if (!session?.user?.email || !comentario.trim()) return;
    
    // Verificar se o comentário excede o limite de caracteres
    if (comentario.length > MAX_COMMENT_LENGTH) {
      alert(`O comentário excede o limite de ${MAX_COMMENT_LENGTH} caracteres.`);
      return;
    }

    try {
      const response = await fetch('/api/comentarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          atividade_id: task.id,
          usuario_email: session.user.email,
          usuario_nome: session.user.name,
          comentario: comentario.trim()
        }),
      });

      if (response.ok) {
        const novoComentario = await response.json();
        setComentarios([...comentarios, novoComentario]);
        setComentario('');
        
        // Atualiza o timestamp da tarefa no store
        updateTaskTimestamp(task.id);
      } else {
        alert('Erro ao enviar comentário');
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      alert('Erro ao enviar comentário');
    }
  };

  const handleEditComment = async (id: number, novoTexto: string) => {
    if (!session?.user?.email) return;
    
    // Verificar se o comentário editado excede o limite de caracteres
    if (novoTexto.length > MAX_COMMENT_LENGTH) {
      alert(`O comentário excede o limite de ${MAX_COMMENT_LENGTH} caracteres.`);
      return;
    }

    try {
      const response = await fetch('/api/comentarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          comentario: novoTexto.trim(),
          usuario_email: session.user.email
        }),
      });

      if (response.ok) {
        const comentarioAtualizado = await response.json();
        setComentarios(comentarios.map(c => 
          c.id === id ? comentarioAtualizado : c
        ));
        setComentarioEditando(null);
        setTextoEditando("");
        
        // Atualiza o timestamp da tarefa no store
        updateTaskTimestamp(task.id);
      } else {
        alert('Erro ao atualizar comentário');
      }
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      alert('Erro ao atualizar comentário');
    }
  };

  // Adicionar essa função para renderizar texto com links clicáveis
  const renderTextWithLinks = (text: string) => {
    // Expressão regular mais completa para identificar URLs
    const urlRegex = /(https?:\/\/[^\s\)\"\']+|www\.[^\s\)\"\']+\.[^\s\)\"\']+)/gi;
    
    // Se não houver URLs, retornar o texto original
    if (!text.match(urlRegex)) {
      return text;
    }
    
    // Dividir o texto em partes e criar elementos para cada parte
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Iterar sobre todas as correspondências de URLs no texto
    while ((match = urlRegex.exec(text)) !== null) {
      // Adicionar o texto antes da URL
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      // Adicionar a URL como um link
      let url = match[0];
      // Adicionar http:// se a URL não começar com protocolo
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      parts.push(
        <a 
          key={`link-${match.index}`} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {match[0]}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Adicionar o texto restante após a última URL
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }
    
    return parts;
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Quando o modal for fechado, garantir que o polling seja retomado
      if (!newOpen && isEditing) {
        setIsEditing(false);
        resumePolling();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className={cn(
        "sm:max-w-[600px] h-[85vh] p-0 flex flex-col overflow-hidden",
        (isFading || isSaving) && "opacity-50 pointer-events-none transition-opacity duration-[2000ms]",
        "[&>button]:hidden" // Oculta o botão de fechar padrão do DialogContent
      )}>
        {showLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="p-3 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
            </div>
          </div>
        )}
        
        <div className="absolute top-3 right-4 flex items-center gap-2 z-10">
          {!isEditing && (
            <>
              <div className="relative">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button"
                      variant="ghost"
                      className="h-6 w-6 p-0 rounded-full bg-red-500 hover:bg-red-600 hover:scale-110 transition-transform border-0 flex items-center justify-center"
                      disabled={!canEdit || isEditing}
                      title="Excluir tarefa"
                    >
                      <Trash className="h-3 w-3 text-white" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a tarefa.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        className="bg-red-500 hover:bg-red-600 text-white"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Excluindo..." : "Excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <div className="relative">
                <Button 
                  type="button"
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full bg-yellow-400 hover:bg-yellow-500 hover:scale-110 transition-transform border-0 flex items-center justify-center"
                  onClick={() => {
                    if (canEdit && !isEditing) {
                      setLocalTask(task);
                      setIsEditing(true);
                    }
                  }}
                  disabled={!canEdit || isEditing}
                  title="Editar tarefa"
                >
                  <Edit2 className="h-3 w-3 text-white" />
                </Button>
              </div>
              
              <div className="relative">
                <Button 
                  type="button"
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full bg-green-500 hover:bg-green-600 hover:scale-110 transition-transform border-0 flex items-center justify-center"
                  onClick={() => onOpenChange(false)}
                  title="Fechar"
                >
                  <X className="h-3 w-3 text-white" />
                </Button>
              </div>
            </>
          )}
        </div>
        
        <Tabs defaultValue="detalhes" className="flex flex-col h-full">
          <DialogHeader className="px-6 py-3 border-b shrink-0">
            <DialogTitle className="sr-only">Detalhes da Tarefa</DialogTitle>
            <div className="flex items-center justify-between">
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="anexos">Anexos</TabsTrigger>
              </TabsList>
              
              {canEdit && !isEditing && (
                <div className="invisible">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 w-9 p-0"
                  >
                    <Edit2 className="h-[18px] w-[18px] text-gray-500" />
                  </Button>
                </div>
              )}
              
              {isEditing && (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSubmit}
                    disabled={isSaving || selectedResponsaveis.length === 0}
                    className="h-9 w-9 p-0 bg-green-600 hover:bg-green-500 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    ) : (
                      <Check className="h-[18px] w-[18px]" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      // Restaurar os dados originais da tarefa
                      setLocalTask(task);
                      setTitulo(task.titulo);
                      setDescricao(task.descricao || "");
                      setPrioridade(task.prioridade_id.toString());
                      setEstimativaHoras(task.estimativa_horas || "");
                      setDataInicio(task.data_inicio ? new Date(task.data_inicio).toISOString().split('T')[0] : "");
                      setDataFim(task.data_fim ? new Date(task.data_fim).toISOString().split('T')[0] : "");
                      setProjetoId(task.projeto_id?.toString() || "");
                      setSelectedResponsaveis(
                        task.responsaveis?.map(r => ({
                          EMAIL: r.email,
                          NOME: r.nome || r.email.split('@')[0],
                          CARGO: r.cargo
                        })) || []
                      );
                      // Retomar o polling
                      resumePolling();
                    }}
                    disabled={isSaving}
                    className="h-9 w-9 p-0"
                  >
                    <X className="h-[18px] w-[18px]" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="p-4 flex flex-col h-full">
              <TabsContent value="detalhes" className="flex flex-col h-full">
                {/* Conteúdo principal */}
                <div className="space-y-2 flex-grow">
                  {/* Cabeçalho com Avatar, Status, Prioridade e Projeto */}
                  {!isEditing && (
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {(task.responsaveis ?? []).map(resp => (
                          <Avatar key={resp.email} className="w-10 h-10 border-2 border-white">
                            <AvatarImage email={resp.email} />
                            <AvatarFallback>
                              {resp.email ? resp.email[0].toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {!(task.responsaveis ?? []).length && (
                          <Avatar className="w-10 h-10 border-2 border-white">
                            <AvatarFallback>?</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={
                            getStatusName(task.status_id) === "Concluída"
                              ? "bg-emerald-500"
                              : getStatusName(task.status_id) === "Em desenvolvimento"
                              ? "bg-blue-500"
                              : getStatusName(task.status_id) === "Em testes"
                              ? "bg-yellow-400"
                              : "bg-red-500"
                          }
                        >
                          {getStatusName(task.status_id)}
                        </Badge>
                        <Badge
                          className={
                            getPriorityName(task.prioridade_id) === "Alta"
                              ? "bg-red-500"
                              : getPriorityName(task.prioridade_id) === "Média"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }
                        >
                          {getPriorityName(task.prioridade_id)}
                        </Badge>
                        <Badge variant="outline">
                          {task.projeto_nome || (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Prioridade e Projeto - Modo Edição */}
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm text-gray-500">Prioridade</label>
                        <Select value={prioridade} onValueChange={setPrioridade}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Alta</SelectItem>
                            <SelectItem value="2">Média</SelectItem>
                            <SelectItem value="3">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm text-gray-500">Projeto</label>
                        <Select value={projetoId} onValueChange={setProjetoId}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione o projeto" />
                          </SelectTrigger>
                          <SelectContent className="!max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {projetos.map(projeto => (
                              <SelectItem 
                                key={projeto.id} 
                                value={projeto.id.toString()}
                                className="truncate"
                                title={projeto.nome}
                              >
                                {projeto.nome.length > 30 ? `${projeto.nome.slice(0, 30)}...` : projeto.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}

                  {/* Conteúdo em duas colunas */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Coluna da esquerda */}
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-500">Título</div>
                        {isEditing ? (
                          <Input
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Digite o título da tarefa"
                            className="h-8"
                            maxLength={MAX_TITLE_LENGTH}
                          />
                        ) : (
                          <div className="font-medium max-h-20 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 break-words whitespace-pre-wrap">
                            {task.titulo}
                          </div>
                        )}
                        {isEditing && (
                          <div className="flex justify-end">
                            <span className={`text-xs ${titulo.length > MAX_TITLE_LENGTH * 0.8 ? 'text-red-500' : 'text-gray-500'}`}>
                              {titulo.length}/{MAX_TITLE_LENGTH}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">Descrição</div>
                        {isEditing ? (
                          <>
                            <Textarea
                              value={descricao}
                              onChange={(e) => setDescricao(e.target.value)}
                              placeholder="Digite a descrição da tarefa"
                              className="h-16 resize-none"
                              maxLength={MAX_DESCRIPTION_LENGTH}
                            />
                            <div className="flex justify-end">
                              <span className={`text-xs ${descricao.length > MAX_DESCRIPTION_LENGTH * 0.8 ? 'text-red-500' : 'text-gray-500'}`}>
                                {descricao.length}/{MAX_DESCRIPTION_LENGTH}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm mt-1 whitespace-pre-wrap max-h-[120px] overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 break-words">
                            {localTask.descricao || "-"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Coluna da direita */}
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-500">Data de Início</div>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <div className="text-sm">{formatDate(localTask.data_inicio)}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">Data de Fim</div>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <div className="text-sm">{formatDate(localTask.data_fim)}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-gray-500">Estimativa</div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={estimativaHoras}
                                  onChange={(e) => setEstimativaHoras(e.target.value)}
                                  className="h-8"
                                  placeholder=""
                                />
                              </div>
                              <span className="text-xs">h</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Use valores decimais: 0.5 = 30min, 1.5 = 1h e 30min
                            </p>
                          </div>
                        ) : (
                          <div className="text-sm">{formatEstimativa(localTask.estimativa_horas)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Responsáveis - Modo de Edição */}
                  {isEditing && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Responsáveis</div>
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Input
                            value={responsavelInput}
                            onChange={(e) => {
                              setResponsavelInput(e.target.value);
                              setShowResponsavelSuggestions(true);
                            }}
                            onFocus={() => setShowResponsavelSuggestions(true)}
                            onBlur={() => {
                              // Atraso para permitir que o clique na sugestão seja processado
                              setTimeout(() => setShowResponsavelSuggestions(false), 200);
                            }}
                            placeholder="Digite o nome do responsável"
                            className="h-8"
                          />
                          {showResponsavelSuggestions && (
                            <div className="absolute z-10 w-full mt-0.5 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
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
                                    className="px-4 py-1.5 cursor-pointer hover:bg-gray-50 border-b last:border-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResponsavelSelect(responsavel);
                                    }}
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
                        <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-gray-50 rounded-md">
                          {selectedResponsaveis.map((responsavel) => (
                            <div key={responsavel.EMAIL} className="flex items-center gap-2 bg-white rounded-md px-2 py-1 border shadow-sm">
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
                          {selectedResponsaveis.length === 0 && (
                            <div className="text-sm text-red-500 py-1 px-2">
                              É necessário pelo menos um responsável
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Linha divisória - só aparece quando há comentários */}
                  {comentarios.length > 0 && !isEditing && <Separator className="my-3" />}

                  {/* Seção de Comentários */}
                  {!isEditing && (
                    <div className={cn(
                      "space-y-2",
                      comentarios.length === 0 ? "pt-12" : comentarios.length <= 2 ? "pt-6" : "" // Muito mais espaço quando não há comentários
                    )}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Comentários</h4>
                      </div>

                      {/* Lista de Comentários */}
                      <div className="space-y-1.5 min-h-[40px] max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {comentarios.length > 0 ? (
                          comentarios.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 p-2 rounded-lg space-y-1.5 w-full overflow-hidden">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage email={comment.usuario_email} />
                                    <AvatarFallback>
                                      {comment.usuario_email[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {comment.usuario_nome || comment.usuario_email.split('@')[0]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {session?.user?.email === comment.usuario_email && comentarioEditando !== comment.id && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        setComentarioEditando(comment.id);
                                        setTextoEditando(comment.comentario);
                                      }}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {comment.data_edicao 
                                      ? `Editado em ${formatDateTime(comment.data_edicao)}`
                                      : formatDateTime(comment.data_criacao)
                                    }
                                  </span>
                                </div>
                              </div>
                              {comentarioEditando === comment.id ? (
                                <div className="flex gap-2">
                                  <div className="flex flex-col w-full">
                                    <Textarea
                                      value={textoEditando}
                                      onChange={(e) => setTextoEditando(e.target.value)}
                                      className="h-14 resize-none"
                                      maxLength={MAX_COMMENT_LENGTH}
                                    />
                                    <div className="flex justify-end">
                                      <span className={`text-xs ${textoEditando.length > MAX_COMMENT_LENGTH * 0.8 ? 'text-red-500' : 'text-gray-500'}`}>
                                        {textoEditando.length}/{MAX_COMMENT_LENGTH}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEditComment(comment.id, textoEditando)}
                                      disabled={textoEditando.length > MAX_COMMENT_LENGTH}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setComentarioEditando(null);
                                        setTextoEditando("");
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="max-w-full overflow-hidden">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap [overflow-wrap:break-word] [word-break:normal] [hyphens:auto] [text-wrap:pretty] overflow-hidden text-ellipsis">
                                    {renderTextWithLinks(comment.comentario)}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center text-sm text-gray-500">
                            -
                          </div>
                        )}
                      </div>

                      {/* Espaço adicional quando há poucos comentários */}
                      {comentarios.length > 0 && comentarios.length <= 3 && (
                        <div className="h-6"></div>
                      )}

                      {/* Campo de Novo Comentário */}
                      <div className="flex gap-2">
                        <div className="flex flex-col w-full">
                          <Textarea
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Escreva um comentário..."
                            className="h-12 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            maxLength={MAX_COMMENT_LENGTH}
                          />
                          <div className="flex justify-end">
                            <span className={`text-xs ${comentario.length > MAX_COMMENT_LENGTH * 0.8 ? 'text-red-500' : 'text-gray-500'}`}>
                              {comentario.length}/{MAX_COMMENT_LENGTH}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          className="self-end"
                          disabled={!comentario.trim() || !session?.user?.email || comentario.length > MAX_COMMENT_LENGTH}
                          onClick={handleSendComment}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Última Atualização e ID Release - Sempre no final */}
                <div className="text-xs text-gray-400 text-center space-y-0.5 mt-auto pt-2 border-t">
                  <div>
                    ID Card: <span className="font-medium">{task.id}</span> | ID Release: <span className="font-medium">{task.id_release || "-"}</span>
                  </div>
                  <div>
                    {task.ultima_atualizacao 
                      ? `Última atualização: ${formatDateTimeWithTime(task.ultima_atualizacao)}`
                      : '-'}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="anexos" className="space-y-3 py-3">
                <TaskAttachments 
                  taskId={task.id} 
                  canEdit={canEdit}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 