"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2, Edit2, X, Check, Send, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTaskStore, getPriorityName, getStatusName } from "@/lib/store"
import { getUserIcon } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, isUserChefe, isUserAdmin } from "@/lib/rm-service"
import { TaskAttachments } from "./task-attachments"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface Responsavel {
  id: number;
  email: string;
  nome?: string;
  cargo?: string;
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
  responsaveis?: {
    id: number;
    email: string;
    nome?: string;
    cargo?: string;
  }[];
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
  const [titulo, setTitulo] = useState(task.titulo)
  const [descricao, setDescricao] = useState(task.descricao || "")
  const [prioridade, setPrioridade] = useState(task.prioridade_id.toString())
  const [estimativaHoras, setEstimativaHoras] = useState(task.estimativa_horas || "")
  const [dataInicio, setDataInicio] = useState(task.data_inicio ? new Date(task.data_inicio).toISOString().split('T')[0] : "")
  const [dataFim, setDataFim] = useState(task.data_fim ? new Date(task.data_fim).toISOString().split('T')[0] : "")
  const [responsavelInput, setResponsavelInput] = useState("")
  const [selectedResponsaveis, setSelectedResponsaveis] = useState(task.responsaveis || [])
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [projetoId, setProjetoId] = useState(task.projeto_id?.toString() || "")
  const setTasks = useTaskStore((state) => state.setTasks)
  const [comentario, setComentario] = useState("")
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [comentarioEditando, setComentarioEditando] = useState<number | null>(null)
  const [textoEditando, setTextoEditando] = useState("")

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
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  };

  const formatEstimativa = (estimativa: string | number | undefined | null) => {
    if (!estimativa) return "-"
    return `${estimativa}h`
  }

  useEffect(() => {
    const checkPermissions = async () => {
      if (session?.user?.email) {
        const isAdmin = isUserAdmin(session.user.email);
        
        if (isAdmin) {
          setCanEdit(true);
          return;
        }

        const userInfo = await getUserInfoFromRM(session.user.email);
        const isChefe = isUserChefe(userInfo);
        
        if (isChefe) {
          setCanEdit(true);
          return;
        }

        // Verificar se é responsável
        const isResponsavel = task.responsaveis?.some((responsavel: Responsavel) => responsavel.email === session.user.email);
        if (isResponsavel) {
          setCanEdit(true);
          return;
        }

        setCanEdit(false);
      }
    };

    checkPermissions();
  }, [session?.user?.email, task.responsaveis]);

  useEffect(() => {
    // Carregar projetos do banco
    const fetchProjetos = async () => {
      try {
        const response = await fetch('/api/projetos')
        if (response.ok) {
          const data = await response.json()
          setProjetos(data)
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error)
      }
    }

    // Carregar responsáveis do setor
    const fetchResponsaveis = async () => {
      if (session?.user?.email) {
        try {
          const userInfo = await getUserInfoFromRM(session.user.email);
          if (userInfo?.SECAO) {
            const response = await fetch(`/api/responsaveis?setor=${userInfo.SECAO}`);
            if (response.ok) {
              const data = await response.json();
              setResponsaveis(data);
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

  const handleResponsavelSelect = (responsavel: Responsavel) => {
    if (!selectedResponsaveis.find((r: Responsavel) => r.email === responsavel.email)) {
      setSelectedResponsaveis([...selectedResponsaveis, responsavel]);
    }
    setResponsavelInput("");
    setShowResponsavelSuggestions(false);
  }

  const removeResponsavel = (email: string) => {
    setSelectedResponsaveis(selectedResponsaveis.filter((r: Responsavel) => r.email !== email));
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/atividades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: task.id,
          titulo,
          descricao,
          projeto_id: parseInt(projetoId),
          responsaveis_emails: selectedResponsaveis.map((r: Responsavel) => r.email),
          data_inicio: dataInicio,
          data_fim: dataFim,
          prioridade_id: parseInt(prioridade),
          estimativa_horas: estimativaHoras,
          userEmail: session?.user?.email
        }),
      });

      if (response.ok) {
        const updatedTasks = await response.json();
        setTasks(updatedTasks);
        setIsEditing(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar tarefa');
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      alert('Erro ao atualizar tarefa');
    }
  };

  const deleteTask = useTaskStore((state) => state.deleteTask)

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setIsFading(true);
      
      // Primeiro faz a requisição ao banco
      const deletePromise = fetch(`/api/atividades?id=${task.id}`, {
        method: 'DELETE',
      }).catch(error => {
        console.log('Sincronização com o banco:', error);
      });

      // Após 1 segundo mostra o loading
      setTimeout(() => setShowLoading(true), 1000);

      // Aguarda 2 segundos para efeito visual
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Aguarda a conclusão da requisição ao banco
      await deletePromise;

      // Remove do estado local e fecha o modal
      await deleteTask(task.id);
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
        "sm:max-w-[600px] sm:h-auto",
        isFading && "opacity-50 pointer-events-none transition-opacity duration-[2000ms]"
      )}>
        {showLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="bg-white/80 p-3 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes da Tarefa</span>
            {canEdit && !isEditing && (
              <div className="flex items-center gap-2 mr-8">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
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
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSave}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="anexos">Anexos</TabsTrigger>
          </TabsList>

          <div className="min-h-[600px] overflow-y-auto pr-2">
            <TabsContent value="detalhes" className="space-y-6 py-4">
              {/* Cabeçalho com Badges */}
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

                  {isEditing ? (
                    <Select value={prioridade} onValueChange={setPrioridade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Alta</SelectItem>
                        <SelectItem value="2">Média</SelectItem>
                        <SelectItem value="3">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
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
                  )}
                </div>

                {isEditing ? (
                  <Select value={projetoId} onValueChange={setProjetoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projetos.map(projeto => (
                        <SelectItem key={projeto.id} value={projeto.id.toString()}>
                          {projeto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">
                    {task.projeto_nome || (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}
                  </Badge>
                )}
              </div>

              {/* Responsáveis e ID Release */}
              {!isEditing && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-4">
                      {task.responsaveis && task.responsaveis.length > 0 ? (
                        task.responsaveis.map((responsavel: Responsavel) => (
                          <Avatar key={responsavel.email} className="w-12 h-12 border-2 border-white">
                            <AvatarImage src={getUserIcon(responsavel.email)} />
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
                            .map((responsavel: Responsavel) => 
                              (responsavel.nome || responsavel.email.split('@')[0]).split(' ')[0]
                            )
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
              <div className="grid grid-cols-2 gap-6">
                {/* Coluna da esquerda */}
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-500">Título</div>
                    {isEditing ? (
                      <Input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Digite o título da tarefa"
                      />
                    ) : (
                      <div className="font-medium">{task.titulo}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Descrição</div>
                    {isEditing ? (
                      <Textarea
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Digite a descrição da tarefa"
                        className="min-h-[200px]"
                      />
                    ) : (
                      <div className="text-sm mt-1 whitespace-pre-wrap max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">{task.descricao || "-"}</div>
                    )}
                  </div>
                </div>

                {/* Coluna da direita */}
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-500">Data de Início</div>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
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
                  <div className="text-sm text-gray-500">Responsáveis</div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        value={responsavelInput}
                        onChange={(e) => {
                          setResponsavelInput(e.target.value)
                          setShowResponsavelSuggestions(true)
                        }}
                        onFocus={() => setShowResponsavelSuggestions(true)}
                        placeholder="Digite o nome do responsável"
                      />
                      {showResponsavelSuggestions && responsavelInput && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                          {responsaveis
                            .filter((r: Responsavel) => 
                              (r.nome || '').toLowerCase().includes(responsavelInput.toLowerCase()) &&
                              !selectedResponsaveis.find((sr: Responsavel) => sr.email === r.email)
                            )
                            .map((responsavel: Responsavel) => (
                              <div
                                key={responsavel.email}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleResponsavelSelect(responsavel)}
                              >
                                <div>{responsavel.nome}</div>
                                <div className="text-sm text-gray-500">{responsavel.email}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Lista de responsáveis selecionados */}
                    <div className="space-y-2">
                      {selectedResponsaveis.map((responsavel: Responsavel) => (
                        <div key={responsavel.email} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={getUserIcon(responsavel.email)} />
                              <AvatarFallback>
                                {responsavel.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {responsavel.nome || responsavel.email.split('@')[0].replace('.', ' ')}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeResponsavel(responsavel.email)}
                          >
                            <X className="w-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* Seção de Comentários */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Comentários</h4>
                </div>

                {/* Lista de Comentários */}
                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                  {comentarios.length > 0 ? (
                    comentarios.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={getUserIcon(comment.usuario_email)} />
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
                            <Textarea
                              value={textoEditando}
                              onChange={(e) => setTextoEditando(e.target.value)}
                              className="min-h-[60px]"
                            />
                            <div className="flex flex-col gap-2">
                              <Button
                                type="button"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditComment(comment.id, textoEditando)}
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
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comment.comentario}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center">
                      Nenhum comentário ainda
                    </div>
                  )}
                </div>

                {/* Campo de Novo Comentário */}
                <div className="flex gap-2">
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="min-h-[80px]"
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="self-end"
                    disabled={!comentario.trim() || !session?.user?.email}
                    onClick={handleSendComment}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Última Atualização e ID Release */}
              <div className="text-xs text-gray-400 text-center mt-6 space-y-1">
                <div>
                  ID Card: <span className="font-medium">{task.id}</span> | ID Release: <span className="font-medium">{task.id_release || "-"}</span>
                </div>
                <div>
                  {task.ultima_atualizacao 
                    ? `Última atualização: ${formatDateTime(task.ultima_atualizacao)}`
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
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 