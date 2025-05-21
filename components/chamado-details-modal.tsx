"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, X, Check, UserPlus, Trash2 } from "lucide-react"
import { cn, getResponsavelName } from "@/lib/utils"
import { type Chamado } from "@/components/chamados-board"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useChamadosStore } from "@/lib/chamados-store"

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

export function ChamadoDetailsModal({ chamado, open, onOpenChange }: ChamadoDetailsModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [editingResponsavel, setEditingResponsavel] = useState(false)
  const [editingRespostaConclusao, setEditingRespostaConclusao] = useState(false)
  const [respostaConclusao, setRespostaConclusao] = useState(chamado?.resposta_conclusao || "")
  const [selectedResponsavel, setSelectedResponsavel] = useState<Funcionario | null>(null)
  const [funcionariosSetor, setFuncionariosSetor] = useState<Funcionario[]>([])
  const [error, setError] = useState<string | null>(null)
  const [responsavelInput, setResponsavelInput] = useState("")
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
  const responsavelRef = useRef<HTMLDivElement>(null)
  const fetchChamados = useChamadosStore((state) => state.fetchChamados)
  const [chefiaImediata, setChefiaImediata] = useState<string | null>(null)

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

  // Initialize selectedResponsavel when chamado changes
  useEffect(() => {
    if (chamado?.tecnico_responsavel) {
      const responsavel = funcionariosSetor.find(f => f.EMAIL === chamado.tecnico_responsavel);
      if (responsavel) {
        setSelectedResponsavel(responsavel);
      } else {
        // Se não encontrar na lista, cria um objeto básico
        setSelectedResponsavel({
          EMAIL: chamado.tecnico_responsavel,
          NOME: getResponsavelName(chamado.tecnico_responsavel),
          CHEFE: ''
        });
      }
    } else {
      setSelectedResponsavel(null);
    }
  }, [chamado, funcionariosSetor]);

  // Debug do estado inicial
  console.log('Estado inicial do modal:', {
    session,
    editingResponsavel,
    selectedResponsavel,
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

  const handleSaveResponsavel = async () => {
    if (!selectedResponsavel) {
      setError('Selecione um responsável');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userName = selectedResponsavel.EMAIL.includes('@') ? selectedResponsavel.EMAIL : `${selectedResponsavel.EMAIL}@epamig.br`;
      
      console.log('Enviando requisição:', {
        chamadoId: chamado.id,
        origem: chamado.origem,
        userName
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
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar responsável');
      }

      const data = await response.json();
      console.log('Resposta da API:', data);

      // Atualiza o estado local
      chamado.tecnico_responsavel = userName.split('@')[0];
      setEditingResponsavel(false);

      // Atualiza o estado global
      await fetchChamados();
    } catch (error) {
      console.error('Erro ao atribuir técnico responsável:', error);
      setError('Erro ao atualizar responsável. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveResponsavel = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
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
        throw new Error('Erro ao remover responsável');
      }

      const data = await response.json();
      console.log('Resposta da API:', data);

      // Atualiza o estado local
      chamado.tecnico_responsavel = null;
      setSelectedResponsavel(null);

      // Atualiza o estado global
      await fetchChamados();
    } catch (error) {
      console.error('Erro ao remover técnico responsável:', error);
      setError('Erro ao remover responsável. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (responsavelRef.current && !responsavelRef.current.contains(event.target as Node)) {
        setShowResponsavelSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
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
              </div>
              <h2 className="text-xl font-semibold">
                {chamado.origem === 'criacao_acessos' 
                  ? `Criação de Acessos - ${chamado.chapa_colaborador || ''}`
                  : chamado.categoria}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <Button 
                  type="button"
                  variant="ghost"
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
                className="h-7 px-2.5 text-gray-600 hover:text-gray-700 hover:bg-gray-50 border border-gray-200"
                onClick={() => onOpenChange(false)}
                title="Fechar"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs font-medium">Fechar</span>
              </Button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="space-y-6">
            {/* Informações principais */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="text-sm font-medium">{chamado.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Data solicitação</div>
                <div className="text-sm">{formatDateTime(chamado.data_solicitacao)}</div>
              </div>
              {chamado.data_conclusao && (
                <div>
                  <div className="text-sm text-gray-500">Data conclusão</div>
                  <div className="text-sm">{formatDateTime(chamado.data_conclusao)}</div>
                </div>
              )}
            </div>

            <Separator />

            {/* Detalhes do chamado */}
            <div className="space-y-4">
              {/* Informações adicionais */}
              {chamado.origem === 'criacao_acessos' ? (
                <>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Nome do Colaborador</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {chamado.nome_colaborador || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Observação</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {chamado.observacao || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Sistemas solicitados</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {chamado.sistemas_solicitados || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Seção</div>
                    <div className="text-sm">{chamado.secao_colaborador || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Chefia do Novo Colaborador</div>
                    <div className="text-sm">{chamado.nome_chefia_colaborador || '-'}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Descrição</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {chamado.descricao}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Responsável */}
            <div>
              <div className="text-sm text-gray-500 mb-2 flex items-center justify-between">
                <span>Responsável</span>
                {canEdit && !editingResponsavel && selectedResponsavel && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border border-yellow-200"
                      onClick={() => {
                        console.log('Clicou em editar responsável');
                        setEditingResponsavel(true);
                      }}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs font-medium">Editar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                      onClick={handleRemoveResponsavel}
                      disabled={isLoading}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs font-medium">Remover</span>
                    </Button>
                  </div>
                )}
                {canEdit && !editingResponsavel && !selectedResponsavel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border border-yellow-200"
                    onClick={() => {
                      console.log('Clicou em editar responsável');
                      setEditingResponsavel(true);
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs font-medium">Atribuir</span>
                  </Button>
                )}
              </div>
              
              {editingResponsavel ? (
                <div className="space-y-2" ref={responsavelRef}>
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
                    {showResponsavelSuggestions && (
                      <div className="absolute z-10 w-full mt-0.5 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {funcionariosSetor
                          .filter(r => {
                            const nameMatches = !responsavelInput || 
                              ((r.NOME || '').toLowerCase().includes(responsavelInput.toLowerCase()));
                            return nameMatches;
                          })
                          .map(responsavel => (
                            <div
                              key={responsavel.EMAIL}
                              className="px-4 py-1.5 cursor-pointer hover:bg-gray-50 border-b last:border-0"
                              onClick={() => {
                                setSelectedResponsavel(responsavel);
                                setResponsavelInput(responsavel.NOME);
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
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 justify-end mt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200"
                      onClick={handleSaveResponsavel}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      )}
                      <span className="text-xs font-medium">Salvar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                      onClick={() => {
                        setEditingResponsavel(false);
                        setError(null);
                        setResponsavelInput("");
                        // Restore original responsible
                        if (chamado.tecnico_responsavel) {
                          const responsavel = funcionariosSetor.find(f => f.EMAIL === chamado.tecnico_responsavel);
                          if (responsavel) {
                            setSelectedResponsavel(responsavel);
                          } else {
                            setSelectedResponsavel({
                              EMAIL: chamado.tecnico_responsavel,
                              NOME: getResponsavelName(chamado.tecnico_responsavel),
                              CHEFE: ''
                            });
                          }
                        } else {
                          setSelectedResponsavel(null);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs font-medium">Cancelar</span>
                    </Button>
                  </div>

                  {error && (
                    <div className="text-xs text-red-500 mt-1">{error}</div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {selectedResponsavel ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          email={selectedResponsavel.EMAIL}
                        />
                        <AvatarFallback>{selectedResponsavel.NOME[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{selectedResponsavel.NOME}</div>
                        <div className="text-xs text-gray-500">Técnico responsável</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">Não atribuído</div>
                        <div className="text-xs text-gray-500">Técnico responsável</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Solicitante e Chefia Imediata */}
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">Solicitante</div>
                <div className="text-sm">{chamado.nome_solicitante}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Chefia Imediata do Solicitante</div>
                <div className="text-sm">
                  {chefiaImediata || '-'}
                </div>
              </div>
            </div>

            {/* Resposta de Conclusão */}
            <div>
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
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 