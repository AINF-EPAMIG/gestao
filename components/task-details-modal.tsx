"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash, Edit2, X, Check, Send, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTaskStore, getPriorityName, getStatusName } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, isUserChefe, isUserAdmin, getSubordinadosFromRM, getResponsaveisBySetor } from "@/lib/rm-service"
import { TaskAttachments } from "./task-attachments"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getResponsavelName } from '@/lib/utils'

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
  // Definindo o limite máximo de caracteres
  const MAX_TITLE_LENGTH = 40
  const MAX_DESCRIPTION_LENGTH = 100
  const MAX_COMMENT_LENGTH = 100

  const formatDate = (date: string | undefined | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateTime: string | undefined | null) => {
    if (!dateTime) return '-';
    
    const date = new Date(dateTime);
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEstimativa = (estimativa: string | number | undefined | null) => {
    if (!estimativa) return "-"
    return `${estimativa}h`
  }

  const formatDateTimeWithTime = (dateTime: string | undefined | null) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  useEffect(() => {
    const checkPermissions = async () => {
      if (session?.user?.email) {
        // Verificar se é admin
        if (isUserAdmin(session.user.email)) {
          setCanEdit(true);
          return;
        }

        // Buscar informações do usuário
        const userInfo = await getUserInfoFromRM(session.user.email);
        if (userInfo) {
          // Verificar se é chefe
          if (isUserChefe(userInfo)) {
            setCanEdit(true);
          }

          // Verificar se é responsável
          const isResponsavel = task.responsaveis?.some(
            (responsavel) => responsavel.email === session.user.email
          );
          if (isResponsavel) {
            setCanEdit(true);
          }

          // Carregar responsáveis baseado no papel do usuário
          const isAdmin = isUserAdmin(session.user.email);
          const isChefe = isUserChefe(userInfo);

          if (isChefe || isAdmin) {
            const subordinadosData = await getSubordinadosFromRM(session.user.email);
            if (subordinadosData) {
              setResponsaveis(subordinadosData.map(sub => ({
                EMAIL: sub.EMAIL_SUBORDINADO,
                NOME: sub.NOME_SUBORDINADO,
                CARGO: sub.CARGO_SUBORDINADO
              })));
            }
          } else if (userInfo.SECAO) {
            const responsaveisData = await getResponsaveisBySetor(userInfo.SECAO);
            if (responsaveisData) {
              setResponsaveis(responsaveisData);
            }
          }

          // Converter responsáveis atuais
          setSelectedResponsaveis(
            task.responsaveis?.map(r => ({
              EMAIL: r.email,
              NOME: r.nome || r.email.split('@')[0].replace('.', ' '),
              CARGO: r.cargo
            })) || []
          );
        }
      }
    };

    if (open) {
      checkPermissions();
    }
  }, [session?.user?.email, task.responsaveis, open]);

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

    if (open) {
      fetchComentarios();
    }
  }, [task.id, open]);

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
      setSelectedResponsaveis([...selectedResponsaveis, responsavel]);
    }
    setResponsavelInput("");
    setShowResponsavelSuggestions(false);
  }

  const removeResponsavel = (email: string) => {
    setSelectedResponsaveis(selectedResponsaveis.filter(r => r.EMAIL !== email));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[600px] h-[90vh] p-0 flex flex-col overflow-hidden",
        (isFading || isSaving) && "opacity-50 pointer-events-none transition-opacity duration-[2000ms]"
      )}>
        {showLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="p-3 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
            </div>
          </div>
        )}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes da Tarefa</span>
            {canEdit && !isEditing && (
              <div className="flex items-center gap-2 mr-4">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsEditing(true)}
                  className="h-9 w-9 p-0"
                >
                  <Edit2 className="h-[18px] w-[18px] text-gray-500" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0"
                    >
                      <Trash className="h-[18px] w-[18px] text-red-500" />
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
            )}
            {isEditing && (
              <div className="flex items-center gap-2 mr-4">
                <Button 
                  size="sm" 
                  onClick={handleSubmit}
                  disabled={isSaving}
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
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-[18px] w-[18px]" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="detalhes" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 px-6 shrink-0">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="anexos">Anexos</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="p-6">
              <TabsContent value="detalhes" className="space-y-3 mt-0 h-full">
                {/* Cabeçalho com Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={
                        getStatusName(task.status_id) === "Concluída"
                          ? "bg-emerald-500"
                          : getStatusName(task.status_id) === "Em desenvolvimento"
                          ? "bg-blue-500"
                          : getStatusName(task.status_id) === "Em testes"
                          ? "bg-amber-500"
                          : "bg-orange-500"
                      }
                    >
                      {getStatusName(task.status_id)}
                    </Badge>
                  </div>
                </div>

                {/* Prioridade e Projeto */}
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
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
                ) : (
                  <div className="flex items-center justify-between">
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
                )}

                {/* Responsáveis e ID Release */}
                {!isEditing && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {task.responsaveis && task.responsaveis.length > 0 ? (
                          task.responsaveis.map((responsavel) => (
                            <Avatar key={responsavel.email} className="w-8 h-8 border-2 border-white">
                              <AvatarImage email={responsavel.email} />
                              <AvatarFallback>
                                {responsavel.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))
                        ) : null}
                      </div>
                      <div>
                        {task.responsaveis && task.responsaveis.length > 0 ? (
                          <span className="text-sm">
                            {task.responsaveis
                              .map((responsavel) => getResponsavelName(responsavel.email))
                              .join(', ')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Sem responsáveis atribuídos</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conteúdo em duas colunas */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Coluna da esquerda */}
                  <div className="space-y-3">
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
                        <div className="flex justify-end mt-1">
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
                            className="h-20 resize-none"
                            maxLength={MAX_DESCRIPTION_LENGTH}
                          />
                          <div className="flex justify-end mt-1">
                            <span className={`text-xs ${descricao.length > MAX_DESCRIPTION_LENGTH * 0.8 ? 'text-red-500' : 'text-gray-500'}`}>
                              {descricao.length}/{MAX_DESCRIPTION_LENGTH}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm mt-1 whitespace-pre-wrap max-h-40 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 break-words">
                          {task.descricao || "-"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coluna da direita */}
                  <div className="space-y-3">
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
                        <div className="text-sm">{formatDate(task.data_inicio)}</div>
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
                        <div className="text-sm">{formatDate(task.data_fim)}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Estimativa</div>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={estimativaHoras}
                          onChange={(e) => setEstimativaHoras(e.target.value)}
                          placeholder="Ex: 8"
                          className="h-8"
                        />
                      ) : (
                        <div className="text-sm">{formatEstimativa(task.estimativa_horas)}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Responsáveis - Modo de Edição */}
                {isEditing && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1.5">Responsáveis</div>
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
                          className="h-8"
                        />
                        {showResponsavelSuggestions && responsavelInput && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
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
                                  className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 border-b last:border-0"
                                  onClick={() => handleResponsavelSelect(responsavel)}
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage email={responsavel.EMAIL} />
                                      <AvatarFallback>
                                        {responsavel.EMAIL[0].toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium truncate" title={responsavel.NOME}>
                                        {responsavel.NOME.length > 25 
                                          ? `${responsavel.NOME.slice(0, 25)}...`
                                          : responsavel.NOME}
                                      </div>
                                      <div className="text-xs text-gray-500 truncate">{responsavel.EMAIL}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Lista de responsáveis selecionados */}
                      <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-gray-50 rounded-md">
                        {selectedResponsaveis.map((responsavel) => (
                          <div key={responsavel.EMAIL} className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1 border shadow-sm">
                            <Avatar className="w-5 h-5">
                              <AvatarImage email={responsavel.EMAIL} />
                              <AvatarFallback>
                                {responsavel.EMAIL[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">
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
                )}

                <Separator className="my-4" />

                {/* Seção de Comentários */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Comentários</h4>
                  </div>

                  {/* Lista de Comentários */}
                  <div className="space-y-2 min-h-[40px] max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {comentarios.length > 0 ? (
                      comentarios.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg space-y-2 w-full overflow-hidden">
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
                                  className="h-16 resize-none"
                                  maxLength={MAX_COMMENT_LENGTH}
                                />
                                <div className="flex justify-end mt-1">
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
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-all break-words hyphens-auto overflow-hidden text-ellipsis">
                                {comment.comentario}
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

                  {/* Campo de Novo Comentário */}
                  <div className="flex gap-2">
                    <div className="flex flex-col w-full">
                      <Textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Escreva um comentário..."
                        className="h-14 resize-none"
                        maxLength={MAX_COMMENT_LENGTH}
                      />
                      <div className="flex justify-end mt-1">
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

                {/* Última Atualização e ID Release */}
                <div className="text-xs text-gray-400 text-center space-y-1">
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
              <TabsContent value="anexos" className="space-y-4 py-4">
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