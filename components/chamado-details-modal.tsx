"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, X, Check, UserPlus, Trash2, Edit2, Send, Download, ChevronDown, ExternalLink } from "lucide-react"
import { cn, getResponsavelName } from "@/lib/utils"
import { type Chamado as ChamadoBase } from "@/components/chamados-board"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useChamadosStore } from "@/lib/chamados-store"

interface Chamado extends ChamadoBase {
  tecnicos_responsaveis?: string; // múltiplos responsáveis separados por vírgula
  anexo?: string; // caminho ou id do anexo
  anexo_nome?: string; // nome do arquivo
}

interface ChamadoDetailsModalProps {
  chamado: Chamado
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Funcionario {
  NOME: string;
  EMAIL: string;
  CHEFE: string;
}

interface Comentario {
  id: number;
  tipo_registro: 'atividade' | 'chamado';
  registro_id: number;
  responsavel_comentario: string;
  comentario: string;
  data_criacao: string;
  data_edicao?: string | null;
}

interface AnexoChamado {
  id: number;
  tipo_registro: string;
  registro_id: number;
  nome_arquivo: string;
  caminho_arquivo: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
  data_upload: string;
  usuario_upload: string;
  google_drive_id?: string;
  google_drive_link?: string;
}

export function ChamadoDetailsModal({ chamado: chamadoBase, open, onOpenChange }: ChamadoDetailsModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [editingResponsavel, setEditingResponsavel] = useState(false)
  const [editingRespostaConclusao, setEditingRespostaConclusao] = useState(false)
  const [respostaConclusao, setRespostaConclusao] = useState(chamadoBase?.resposta_conclusao || "")

  const [funcionariosSetor, setFuncionariosSetor] = useState<Funcionario[]>([])
  const [error, setError] = useState<string | null>(null)
  const [responsavelInput, setResponsavelInput] = useState("")
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
  const responsavelRef = useRef<HTMLDivElement>(null)
  const fetchChamados = useChamadosStore((state) => state.fetchChamados)
  const [chefiaImediata, setChefiaImediata] = useState<string | null>(null)
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<Funcionario[]>([])
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [comentario, setComentario] = useState("")
  const [comentarioEditando, setComentarioEditando] = useState<number | null>(null)
  const [textoEditando, setTextoEditando] = useState("")
  const [anexos, setAnexos] = useState<AnexoChamado[]>([])
  const [loadingDownload, setLoadingDownload] = useState<number | null>(null)
  const [showAnexosDropdown, setShowAnexosDropdown] = useState(false)
  const MAX_COMMENT_LENGTH = 600

  // Garantir que chamado tem os campos opcionais
  const chamado = chamadoBase as Chamado;

  // Buscar funcionários do setor quando o modal abrir
  useEffect(() => {
    const fetchFuncionariosSetor = async () => {
      if (chamado?.secao) {
        try {
          const res = await fetch(`/api/funcionarios?action=responsaveisSetor&secao=${encodeURIComponent(chamado.secao)}`);
          const data = await res.json();
          setFuncionariosSetor(data);
        } catch (error) {
          console.error('Erro ao buscar funcionários do setor:', error);
        }
      }
    };

    fetchFuncionariosSetor();
  }, [chamado?.secao]);
  
  // Buscar chefia imediata do solicitante quando o modal abrir
  useEffect(() => {
    const fetchChefiaImediata = async () => {
      // Usar o nome do solicitante para buscar a chefia
      if (chamado?.nome_solicitante) {
        try {
          console.log('Debug - Dados do chamado:', {
            chamado,
            nomeSolicitante: chamado.nome_solicitante,
            origem: chamado.origem
          });
          
          const res = await fetch(`/api/funcionarios?action=getChefiaImediata&nome=${encodeURIComponent(chamado.nome_solicitante)}`);
          const data = await res.json();
          
          console.log('Debug - Resposta da API de chefia:', {
            data,
            status: res.status,
            ok: res.ok
          });
          
          if (data && data.nome) {
            console.log(`Chefia imediata encontrada: ${data.nome}`);
            setChefiaImediata(data.nome);
          } else {
            console.log('Nenhuma chefia imediata encontrada');
            setChefiaImediata(null);
          }
        } catch (error) {
          console.error('Erro ao buscar chefia imediata do solicitante:', error);
          setChefiaImediata(null);
        }
      }
    };
  
    fetchChefiaImediata();
  }, [chamado]);

  // Função auxiliar para carregar responsáveis originais
  const loadOriginalResponsaveis = useCallback(() => {
    console.log('loadOriginalResponsaveis chamada - editingResponsavel:', editingResponsavel);
    if (chamado?.tecnicos_responsaveis) {
      const emails = chamado.tecnicos_responsaveis.split(',').map((e: string) => e.trim()).filter(Boolean);
      const responsaveisEncontrados = emails.map(email => {
        const funcionario = funcionariosSetor.find(f => f.EMAIL === email);
        return funcionario || {
          EMAIL: email,
          NOME: getResponsavelName(email),
          CHEFE: ''
        };
      });
      console.log('Carregando responsáveis múltiplos:', responsaveisEncontrados.length);
      setSelectedResponsaveis(responsaveisEncontrados);
    } else if (chamado?.tecnico_responsavel) {
      // fallback para um responsável
      const responsavel = funcionariosSetor.find(f => f.EMAIL === chamado.tecnico_responsavel);
      const responsavelObj = responsavel || {
        EMAIL: chamado.tecnico_responsavel,
        NOME: getResponsavelName(chamado.tecnico_responsavel),
        CHEFE: ''
      };
      console.log('Carregando responsável único:', responsavelObj.NOME);
      setSelectedResponsaveis([responsavelObj]);
    } else {
      console.log('Nenhum responsável para carregar');
      setSelectedResponsaveis([]);
    }
  }, [chamado, funcionariosSetor, editingResponsavel]);

  // Carregar responsáveis múltiplos ao abrir (apenas quando não está editando)
  useEffect(() => {
    // Não sobrescrever seleções do usuário quando está editando
    if (editingResponsavel) return;
    
    loadOriginalResponsaveis();
  }, [loadOriginalResponsaveis, editingResponsavel]);

  // Carregar comentários ao abrir
  useEffect(() => {
    async function fetchComentarios() {
      if (!chamado?.id) return;
      try {
        const res = await fetch(`/api/comentarios?chamado_id=${chamado.id}`);
        const data = await res.json();
        setComentarios(data);
      } catch (e) {
        console.error('Erro ao carregar comentários:', e);
        setComentarios([]);
      }
    }
    fetchComentarios();
  }, [chamado]);

  // Carregar anexos ao abrir
  useEffect(() => {
    async function fetchAnexos() {
      if (!chamado?.id) return;
      try {
        const res = await fetch(`/api/chamados/anexos?chamadoId=${chamado.id}`);
        const data = await res.json();
        setAnexos(data);
      } catch (e) {
        console.error('Erro ao carregar anexos:', e);
        setAnexos([]);
      }
    }
    fetchAnexos();
  }, [chamado]);

  // Debug do estado inicial
  console.log('Estado inicial do modal:', {
    session,
    editingResponsavel,
    selectedResponsaveis,
    funcionariosSetor,
    chamadoId: chamado?.id,
    tecnicoAtual: chamado?.tecnico_responsavel
  });

  // Verifica se o usuário pode editar (é o responsável ou não tem responsável atribuído)
  const canEdit = session?.user?.email ? true : false; // Temporariamente permitindo edição para qualquer usuário logado

  console.log('Debug Modal:', {
    session,
    canEdit,
    editingResponsavel,
    chamado
  });

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return dateString
    }
  }

  const handleSaveResponsavel = useCallback(async () => {
    if (selectedResponsaveis.length === 0) {
      setError('Selecione pelo menos um responsável');
      return;
    }

    if (!chamado?.id) {
      setError('Chamado não encontrado');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Preparar lista de emails dos responsáveis
      const emailsResponsaveis = selectedResponsaveis.map(r => r.EMAIL).join(',');
      const primeiroResponsavel = selectedResponsaveis[0];
      const userName = primeiroResponsavel.EMAIL.includes('@') ? primeiroResponsavel.EMAIL.split('@')[0] : primeiroResponsavel.EMAIL;
      
      console.log('Enviando requisição para múltiplos responsáveis:', {
        chamadoId: chamado.id,
        origem: chamado.origem,
        userName,
        emailsResponsaveis,
        totalResponsaveis: selectedResponsaveis.length
      });

      const response = await fetch('/api/chamados/assign', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chamadoId: chamado.id,
          origem: chamado.origem,
          userName,
          emailsResponsaveis, // Enviar lista completa de emails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar responsáveis');
      }

      const data = await response.json();
      console.log('Resposta da API:', data);

      // Atualiza o estado local
      if (chamado) {
        chamado.tecnico_responsavel = userName; // Primeiro responsável para compatibilidade
        chamado.tecnicos_responsaveis = emailsResponsaveis; // Lista completa
      }
      setEditingResponsavel(false);
      setResponsavelInput("");

      // Atualiza o estado global
      await fetchChamados();
    } catch (error) {
      console.error('Erro ao atribuir técnicos responsáveis:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar responsáveis. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedResponsaveis, chamado, fetchChamados]);

  const handleRemoveResponsavel = useCallback(async () => {
    if (!chamado?.id) {
      setError('Chamado não encontrado');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Removendo responsável do chamado:', {
        chamadoId: chamado.id,
        origem: chamado.origem
      });

      const response = await fetch('/api/chamados/assign', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chamadoId: chamado.id,
          origem: chamado.origem,
          userName: null, // Envia null para remover o responsável
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover responsável');
      }

      const data = await response.json();
      console.log('Resposta da API:', data);

      // Atualiza o estado local
      if (chamado) {
        chamado.tecnico_responsavel = null;
        chamado.tecnicos_responsaveis = undefined;
      }
      setSelectedResponsaveis([]);
      setEditingResponsavel(false);
      setResponsavelInput("");

      // Atualiza o estado global
      await fetchChamados();
    } catch (error) {
      console.error('Erro ao remover técnico responsável:', error);
      setError(error instanceof Error ? error.message : 'Erro ao remover responsável. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [chamado, fetchChamados]);

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (responsavelRef.current && !responsavelRef.current.contains(event.target as Node)) {
        setShowResponsavelSuggestions(false);
      }
    }

    // Só adiciona o listener se o dropdown estiver aberto
    if (showResponsavelSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showResponsavelSuggestions]);

  const handleSaveRespostaConclusao = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chamados/resposta-conclusao', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chamadoId: chamado.id,
          origem: chamado.origem,
          respostaConclusao,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar resposta de conclusão')
      }

      const data = await response.json()
      console.log('Resposta da API:', data)

      // Atualiza o estado local
      chamado.resposta_conclusao = respostaConclusao
      setEditingRespostaConclusao(false)

      // Atualiza o estado global
      await fetchChamados()
    } catch (error) {
      console.error('Erro ao atualizar resposta de conclusão:', error)
      setError('Erro ao atualizar resposta de conclusão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chamados/delete?id=${chamado.id}&origem=${chamado.origem}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir chamado');
      }

      // Fecha o modal
      onOpenChange(false);

      // Atualiza o estado global
      await fetchChamados();
    } catch (error) {
      console.error('Erro ao excluir chamado:', error);
      setError('Erro ao excluir chamado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalTitle = chamado.origem === 'criacao_acessos' 
    ? `Detalhes da Criação de Acessos - ${chamado.chapa_colaborador || ''}`
    : `Detalhes do Chamado - ${chamado.categoria}`

  // Função para adicionar comentário
  const handleSendComment = async () => {
    if (!comentario.trim() || !session?.user?.email) return;
    
    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chamado_id: chamado.id, 
          comentario: comentario.trim(),
          usuario_email: session.user.email,
          usuario_nome: session.user.name
        })
      });
      
      if (res.ok) {
        const novo = await res.json();
        setComentarios([novo, ...comentarios]);
        setComentario("");
      } else {
        const error = await res.json();
        console.error('Erro na resposta:', error);
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
    }
  };

  // Função para editar comentário
  const handleEditComment = async (id: number, novoTexto: string) => {
    if (!novoTexto.trim() || !session?.user?.email) return;
    
    try {
      const res = await fetch('/api/comentarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          comentario: novoTexto.trim(),
          usuario_email: session.user.email,
          tipo_registro: 'chamado'
        })
      });
      
      if (res.ok) {
        const atualizado = await res.json();
        setComentarios(comentarios.map(c => c.id === id ? atualizado : c));
        setComentarioEditando(null);
        setTextoEditando("");
      }
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
    }
  };

  // Função para download de anexos
  const handleDownloadAnexo = async (anexoId: number, fileName: string) => {
    try {
      setLoadingDownload(anexoId);
      const response = await fetch(`/api/chamados/anexos/download/${anexoId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao baixar anexo');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
      alert(error instanceof Error ? error.message : 'Erro ao baixar anexo');
    } finally {
      setLoadingDownload(null);
    }
  };

  // Função para abrir anexo no Google Drive
  const handleOpenInGoogleDrive = (googleDriveLink: string, anexoId: number) => {
    try {
      setLoadingDownload(anexoId);
      if (!googleDriveLink) {
        throw new Error('Link do Google Drive não disponível');
      }
      
      // Abre o link em uma nova aba
      window.open(googleDriveLink, '_blank');
    } catch (error) {
      console.error('Erro ao abrir arquivo no Google Drive:', error);
      alert(error instanceof Error ? error.message : 'Erro ao abrir arquivo no Google Drive');
    } finally {
      setLoadingDownload(null);
    }
  };

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Função para obter ícone do arquivo
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
    return '📁';
  };

  // Função para renderizar texto com links
  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] p-0 flex flex-col overflow-hidden [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="p-4 flex flex-col h-full">
            {/* Cabeçalho com badges e botões de ação */}
            <div className="flex items-center justify-between mb-6">
              {/* Badges no lado esquerdo */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={cn(
                    "text-white",
                    (chamado.status as string) === "Concluído" || (chamado.status as string) === "Concluída"
                      ? "bg-emerald-500"
                      : (chamado.status as string) === "Em atendimento" || (chamado.status as string) === "Em desenvolvimento"
                      ? "bg-blue-500"
                      : (chamado.status as string) === "Em aguardo" || (chamado.status as string) === "Em testes"
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  )}
                >
                  {chamado.status}
                </Badge>
                <Badge
                  className={cn(
                    chamado.prioridade === "Alta"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : chamado.prioridade === "Média"
                      ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                      : "bg-green-50 text-green-600 border-green-100"
                  )}
                >
                  {chamado.prioridade}
                </Badge>
                <Badge variant="outline">
                  {chamado.origem === 'criacao_acessos' ? chamado.secao_colaborador : chamado.secao}
                </Badge>
                {/* Badge de Anexos */}
                {anexos.length > 0 && (
                  anexos.length === 1 ? (
                    // Abrir no Google Drive para um único anexo
                    <Badge 
                      variant="outline" 
                      className="bg-blue-50 text-blue-600 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors flex items-center gap-1"
                      onClick={() => handleOpenInGoogleDrive(anexos[0].google_drive_link || "", anexos[0].id)}
                      title={`Abrir ${anexos[0].nome_arquivo} no Google Drive`}
                    >
                      {loadingDownload === anexos[0].id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3 w-3" />
                      )}
                      Ver Anexo
                    </Badge>
                  ) : (
                    // Dropdown para múltiplos anexos
                    <DropdownMenu open={showAnexosDropdown} onOpenChange={setShowAnexosDropdown}>
                      <DropdownMenuTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className="bg-blue-50 text-blue-600 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver {anexos.length} Anexos
                          <ChevronDown className="h-3 w-3" />
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64">
                        {anexos.map((anexo) => (
                          <DropdownMenuItem
                            key={anexo.id}
                            onClick={() => handleOpenInGoogleDrive(anexo.google_drive_link || "", anexo.id)}
                            disabled={loadingDownload === anexo.id}
                            className="flex items-center gap-3 p-3 cursor-pointer"
                          >
                            <span className="text-lg">{getFileIcon(anexo.tipo_arquivo)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {anexo.nome_arquivo}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(anexo.tamanho_bytes)}
                              </div>
                            </div>
                            {loadingDownload === anexo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                )}
              </div>
              
              {/* Botões de ação no lado direito */}
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                    onClick={handleDelete}
                    disabled={isLoading}
                    title="Excluir chamado"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs font-medium">Excluir</span>
                  </Button>
                )}
                <Button 
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-gray-600 hover:text-gray-700 hover:bg-gray-50 border border-gray-200"
                  onClick={() => onOpenChange(false)}
                  title="Fechar"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs font-medium">Fechar</span>
                </Button>
              </div>
            </div>

            {/* Conteúdo em duas colunas */}
            <div className="grid grid-cols-2 gap-4 flex-grow">
              {/* Coluna da esquerda */}
              <div className="space-y-4">
                {/* Título/Categoria */}
                <div>
                  <div className="text-sm text-gray-500">
                    {chamado.origem === 'criacao_acessos' ? 'Criação de Acessos' : 'Categoria'}
                  </div>
                  <div className="font-medium">
                    {chamado.origem === 'criacao_acessos' 
                      ? `${chamado.chapa_colaborador || ''}`
                      : chamado.categoria}
                  </div>
                </div>

                {/* Subcategoria (apenas para chamados normais) */}
                {chamado.origem !== 'criacao_acessos' && chamado.subcategoria && (
                  <div>
                    <div className="text-sm text-gray-500">Subcategoria</div>
                    <div className="text-sm font-medium">{chamado.subcategoria}</div>
                  </div>
                )}

                {/* Título (apenas para chamados normais) */}
                {chamado.origem !== 'criacao_acessos' && (
                  <div>
                    <div className="text-sm text-gray-500">Título</div>
                    <div className="text-sm font-medium">{chamado.titulo || '-'}</div>
                  </div>
                )}

                {/* Descrição */}
                {chamado.descricao && (
                  <div>
                    <div className="text-sm text-gray-500">
                      {chamado.origem === 'criacao_acessos' ? 'Observação' : 'Descrição'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap max-h-[120px] overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 break-words">
                      {chamado.descricao}
                    </div>
                  </div>
                )}

                {/* Observação */}
                {chamado.observacao && (
                  <div>
                    <div className="text-sm text-gray-500">Observação</div>
                    <div className="text-sm whitespace-pre-wrap max-h-[120px] overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 break-words">
                      {chamado.observacao}
                    </div>
                  </div>
                )}

                {/* Campos específicos de criação de acessos - coluna esquerda */}
                {chamado.origem === 'criacao_acessos' && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Nome do Colaborador</div>
                      <div className="text-sm">{chamado.nome_colaborador || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Seção</div>
                      <div className="text-sm">{chamado.secao_colaborador || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Chefia do Novo Colaborador</div>
                      <div className="text-sm">{chamado.nome_chefia_colaborador || '-'}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Coluna da direita */}
              <div className="space-y-4">
                {/* Solicitante */}
                <div>
                  <div className="text-sm text-gray-500">Solicitante</div>
                  <div className="text-sm">{chamado.nome_solicitante}</div>
                </div>

                {/* Chefia Imediata do Solicitante */}
                <div>
                  <div className="text-sm text-gray-500">Chefia do Solicitante</div>
                  <div className="text-sm">{chefiaImediata || '-'}</div>
                </div>

                {/* Data solicitação */}
                <div>
                  <div className="text-sm text-gray-500">Data solicitação</div>
                  <div className="text-sm">{formatDateTime(chamado.data_solicitacao)}</div>
                </div>

                {/* Data conclusão */}
                {chamado.data_conclusao && (
                  <div>
                    <div className="text-sm text-gray-500">Data conclusão</div>
                    <div className="text-sm">{formatDateTime(chamado.data_conclusao)}</div>
                  </div>
                )}

                {/* Campos específicos de criação de acessos - coluna direita */}
                {chamado.origem === 'criacao_acessos' && (
                  <div>
                    <div className="text-sm text-gray-500">Sistemas solicitados</div>
                    <div className="text-sm">{(chamado.sistemas_solicitados || '-').toUpperCase()}</div>
                  </div>
                )}

                
              </div>
            </div>

            {/* Responsáveis */}
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2 flex items-center justify-between">
                <span>Responsável Técnico</span>
                {canEdit && !editingResponsavel && selectedResponsaveis.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200"
                      onClick={() => {
                        console.log('Clicou em editar responsável');
                        setEditingResponsavel(true);
                        setResponsavelInput("");
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs font-medium">Alterar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                      onClick={handleRemoveResponsavel}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5 mr-1" />
                      )}
                      <span className="text-xs font-medium">Remover</span>
                    </Button>
                  </div>
                )}
                {canEdit && !editingResponsavel && selectedResponsaveis.length === 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200"
                    onClick={() => {
                      console.log('Clicou em atribuir responsável');
                      setEditingResponsavel(true);
                      setResponsavelInput("");
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs font-medium">Atribuir</span>
                  </Button>
                )}
              </div>

              {editingResponsavel ? (
                <div className="space-y-3">
                  {/* Lista de responsáveis selecionados */}
                  {selectedResponsaveis.length > 0 && (
                    <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-gray-50 rounded-md">
                      {selectedResponsaveis.map((responsavel, index) => (
                        <div key={responsavel.EMAIL} className="flex items-center gap-2 bg-white rounded-md px-2 py-1 border shadow-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarImage email={responsavel.EMAIL} />
                            <AvatarFallback className="text-xs">{responsavel.NOME[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{responsavel.NOME}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const novosResponsaveis = selectedResponsaveis.filter((_, i) => i !== index);
                              setSelectedResponsaveis(novosResponsaveis);
                              setError(null);
                            }}
                            className="text-red-500 hover:text-red-700 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <Input
                      value={responsavelInput}
                      onChange={(e) => {
                        setResponsavelInput(e.target.value);
                        setShowResponsavelSuggestions(e.target.value.trim().length > 0);
                      }}
                      onFocus={() => {
                        if (responsavelInput.trim().length > 0) {
                          setShowResponsavelSuggestions(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowResponsavelSuggestions(false);
                        }
                      }}
                      placeholder="Digite o nome para adicionar responsáveis"
                      className="h-8"
                      autoFocus
                    />
                    {showResponsavelSuggestions && responsavelInput.trim().length > 0 && (
                      <div className="absolute z-10 w-full mt-0.5 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {funcionariosSetor
                          .filter(r => {
                            const nameMatches = !responsavelInput || 
                              ((r.NOME || '').toLowerCase().includes(responsavelInput.toLowerCase()));
                            const notAlreadySelected = !selectedResponsaveis.some(selected => selected.EMAIL === r.EMAIL);
                            return nameMatches && notAlreadySelected;
                          })
                          .map(responsavel => (
                            <div
                              key={responsavel.EMAIL}
                              className="px-4 py-1.5 cursor-pointer hover:bg-gray-50 border-b last:border-0"
                              onClick={() => {
                                const novosResponsaveis = [...selectedResponsaveis, responsavel];
                                console.log('Adicionando responsável:', responsavel.NOME, 'Total responsáveis:', novosResponsaveis.length);
                                setSelectedResponsaveis(novosResponsaveis);
                                setResponsavelInput("");
                                setShowResponsavelSuggestions(false);
                                setError(null);
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
                        {funcionariosSetor.filter(r => {
                          const nameMatches = !responsavelInput || 
                            ((r.NOME || '').toLowerCase().includes(responsavelInput.toLowerCase()));
                          const notAlreadySelected = !selectedResponsaveis.some(selected => selected.EMAIL === r.EMAIL);
                          return nameMatches && notAlreadySelected;
                        }).length === 0 && (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            Nenhum funcionário encontrado ou todos já foram selecionados
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setEditingResponsavel(false);
                        setError(null);
                        setResponsavelInput("");
                        loadOriginalResponsaveis();
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs font-medium">Cancelar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleSaveResponsavel}
                      disabled={isLoading || selectedResponsaveis.length === 0}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      )}
                      <span className="text-xs font-medium">Confirmar</span>
                    </Button>
                  </div>

                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedResponsaveis.length > 0 ? (
                    <div className="flex -space-x-2">
                      {selectedResponsaveis.map((responsavel) => (
                        <Avatar key={responsavel.EMAIL} className="h-8 w-8 border-2 border-white" title={responsavel.NOME}>
                          <AvatarImage email={responsavel.EMAIL} />
                          <AvatarFallback>{responsavel.NOME[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  ) : (
                    <Avatar className="h-8 w-8" title="Não atribuído">
                      <AvatarFallback className="bg-gray-200 text-gray-500">?</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
            </div>

            {/* Resposta de Conclusão */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">Resposta de Conclusão</div>
                {canEdit && !editingRespostaConclusao && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-gray-600 hover:text-gray-700 hover:bg-gray-50 border border-gray-200"
                    onClick={() => setEditingRespostaConclusao(true)}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs font-medium">Editar</span>
                  </Button>
                )}
              </div>

              {editingRespostaConclusao ? (
                <div className="space-y-2">
                  <div>
                    <Textarea
                      value={respostaConclusao}
                      onChange={(e) => {
                        const text = e.target.value;
                        if (text.length <= 600) {
                          setRespostaConclusao(text);
                        }
                      }}
                      placeholder="Digite a resposta de conclusão..."
                      className="min-h-[100px]"
                      maxLength={600}
                    />
                    <div className="text-right mt-1 text-xs text-gray-400">
                      {respostaConclusao.length}/600
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveRespostaConclusao}
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                      <Check className="h-3.5 w-3.5 mr-1" />
                      <span>Salvar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRespostaConclusao(false)
                        setRespostaConclusao(chamado?.resposta_conclusao || "")
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      <span>Cancelar</span>
                    </Button>
                  </div>
                  {error && (
                    <div className="text-sm text-red-600">{error}</div>
                  )}
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap">
                  {chamado.resposta_conclusao || '-'}
                </div>
              )}
            </div>

            {/* Comentários */}
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Comentários</h4>
              </div>
              <div className="space-y-2 min-h-[40px] max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {comentarios.length > 0 ? (
                  comentarios.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-2 rounded-lg space-y-1.5 w-full overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage email={comment.responsavel_comentario} />
                            <AvatarFallback>
                              {(comment.responsavel_comentario || '?')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {funcionariosSetor.find(f => f.EMAIL === comment.responsavel_comentario)?.NOME ||
                             getResponsavelName(comment.responsavel_comentario || '') ||
                             (comment.responsavel_comentario || '').split('@')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {session?.user?.email === comment.responsavel_comentario && comentarioEditando !== comment.id && (
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
                              ? `Editado em ${new Date(comment.data_edicao).toLocaleString('pt-BR')}`
                              : new Date(comment.data_criacao).toLocaleString('pt-BR')
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
                        <div className="text-sm whitespace-pre-wrap">
                          {renderTextWithLinks(comment.comentario)}
                        </div>
                      )}
                    </div>
                  ))
                ) : <span className="text-sm text-gray-400">Nenhum comentário</span>}
              </div>
              {/* Adicionar novo comentário */}
              <div className="mt-2 flex gap-2">
                <div className="flex flex-col w-full">
                  <Textarea
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
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

            {/* Informações do chamado no final */}
            <div className="text-xs text-gray-400 text-center space-y-0.5 mt-auto pt-2 pb-2 border-t">
              <div>
                ID Chamado: <span className="font-medium">{chamado.id}</span>
              </div>
              <div>
                Data de solicitação: {formatDateTime(chamado.data_solicitacao)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 