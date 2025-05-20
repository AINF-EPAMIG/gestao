"use client"

import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMemo, useCallback, useState, memo, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Loader2, Clock } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ChamadoDetailsModal } from "@/components/chamado-details-modal"
import { RespostaConclusaoDialog } from "@/components/resposta-conclusao-dialog"

export type Status = "Em fila" | "Em atendimento" | "Em aguardo" | "Concluído"

export interface Chamado {
  id: number
  titulo?: string
  categoria?: string
  descricao: string
  prioridade: string
  status: Status
  nome_solicitante: string
  tecnico_responsavel: string | null
  data_solicitacao: string
  data_conclusao: string | null
  resposta_conclusao: string | null
  status_id: number
  position: number
  origem: 'chamados_atendimento' | 'criacao_acessos'
  secao?: string
  // Campos específicos para criacao_acessos
  chapa_colaborador?: string
  nome_colaborador?: string
  secao_colaborador?: string
  nome_chefia_colaborador?: string
  sistemas_solicitados?: string
  // Campos específicos para chamados_atendimento
  nome_chefia_solicitante?: string
}

interface ChamadosBoardProps {
  chamados: Chamado[]
  onChamadoMove: (chamadoId: number, newStatusId: number, origem: string, position: number) => void
}

const columns = [
  { id: "Em fila" as Status, title: "Em fila" },
  { id: "Em atendimento" as Status, title: "Em atendimento" },
  { id: "Em aguardo" as Status, title: "Em aguardo" },
  { id: "Concluído" as Status, title: "Concluído" },
]

const statusMap = {
  "Em fila": 1,
  "Em atendimento": 2,
  "Em aguardo": 3,
  "Concluído": 4,
} as const

const statusColors = {
  "Em fila": "border-l-red-500",
  "Em atendimento": "border-l-blue-500",
  "Em aguardo": "border-l-yellow-400",
  "Concluído": "border-l-emerald-500",
} as const

// Componente MemoizedAvatar
const MemoizedAvatar = memo(function MemoizedAvatar({ email }: { email?: string | null }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset imageLoaded when email changes
  useEffect(() => {
    setImageLoaded(false);
  }, [email]);
  
  // Formatação do email para garantir que tenha o domínio
  const formattedEmail = useMemo(() => {
    if (!email) return undefined;
    return email.includes('@') ? email : `${email}@epamig.br`;
  }, [email]);
  
  return (
    <Avatar className="w-7 h-7 sm:w-6 sm:h-6 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9">
      <AvatarImage 
        key={formattedEmail} // Add key to force re-render when email changes
        email={formattedEmail} 
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.error(`Erro ao carregar avatar para ${formattedEmail}:`, e);
          setImageLoaded(false);
        }}
      />
      <AvatarFallback>
        {!imageLoaded && (email ? email[0].toUpperCase() : '?')}
      </AvatarFallback>
    </Avatar>
  )
}, (prevProps, nextProps) => prevProps.email === nextProps.email); // Only re-render if email changes

// Componente ChamadoCard memoizado
const ChamadoCard = memo(function ChamadoCard({ 
  chamado, 
  provided,
  snapshot 
}: { 
  chamado: Chamado
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const previousStatusRef = useRef<number>(chamado.status_id)
  
  // Função para testar o avatar
  const testAvatar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (chamado.tecnico_responsavel) {
      console.log('Testando avatar para técnico:', chamado.tecnico_responsavel);
      import('@/lib/utils').then(utils => {
        utils.testGetUserIcon(chamado.tecnico_responsavel!);
      });
    }
  }, [chamado.tecnico_responsavel]);

  // Efeito para detectar mudanças de status e mostrar o loader
  useEffect(() => {
    if (previousStatusRef.current !== chamado.status_id) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000)
      previousStatusRef.current = chamado.status_id
      return () => clearTimeout(timer)
    }
  }, [chamado.status_id])

  const formatDateTimeCompact = (dateString: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      const hora = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const hoje = new Date();
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      
      const ehHoje = date.getDate() === hoje.getDate() && 
                  date.getMonth() === hoje.getMonth() && 
                  date.getFullYear() === hoje.getFullYear();
                  
      const ehOntem = date.getDate() === ontem.getDate() && 
                   date.getMonth() === ontem.getMonth() && 
                   date.getFullYear() === ontem.getFullYear();
      
      if (ehHoje) {
        return `Hoje ${hora}`;
      }
      
      if (ehOntem) {
        return `Ontem ${hora}`;
      }
      
      const dataFormatada = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
      return `${dataFormatada} ${hora}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  }

  // Função para obter o primeiro nome
  const getFirstName = (email: string | null) => {
    if (!email) return 'Não atribuído';
    return email.split('@')[0].split('.')[0].charAt(0).toUpperCase() + 
           email.split('@')[0].split('.')[0].slice(1);
  }

  return (
    <>
      <Card
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={cn(
          "p-3 sm:p-2 xl:p-3 2xl:p-4 space-y-2 sm:space-y-1.5 xl:space-y-2 2xl:space-y-3 border-l-4 cursor-pointer",
          "max-w-full sm:max-w-full md:max-w-full lg:max-w-full xl:max-w-full 2xl:max-w-full w-full",
          snapshot.isDragging && "dragging-card",
          statusColors[chamado.status]
        )}
        onClick={() => setShowDetails(true)}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <Badge
            className={cn(
              chamado.prioridade === "Alta"
                ? "bg-red-50 text-red-600 border-red-100"
                : chamado.prioridade === "Média"
                ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                : "bg-green-50 text-green-600 border-green-100",
              "text-xs sm:text-[10px] xl:text-xs 2xl:text-sm px-1.5 py-0 sm:px-1 sm:py-0 xl:px-1.5 xl:py-0.5 2xl:px-2 2xl:py-0.5"
            )}
          >
            {chamado.prioridade}
          </Badge>
          <Badge variant="outline" 
            className="text-xs sm:text-[10px] xl:text-xs 2xl:text-sm px-1.5 py-0 sm:px-1 sm:py-0 xl:px-1.5 xl:py-0.5 2xl:px-2 2xl:py-0.5"
            title={chamado.origem === 'criacao_acessos' ? chamado.secao_colaborador : chamado.secao}
          >
            {chamado.origem === 'criacao_acessos' 
              ? (chamado.secao_colaborador && chamado.secao_colaborador.length > 15 
                ? chamado.secao_colaborador.substring(0, 15) + '...' 
                : chamado.secao_colaborador || 'Sem setor')
              : (chamado.secao && chamado.secao.length > 15 
                ? chamado.secao.substring(0, 15) + '...'
                : chamado.secao || 'Sem setor')}
          </Badge>
        </div>

        <h4 className="font-medium truncate text-sm sm:text-xs xl:text-sm 2xl:text-base">
          {chamado.origem === 'criacao_acessos' 
            ? `Criação de Acessos - ${chamado.chapa_colaborador || ''}`
            : chamado.categoria}
        </h4>
        
        <p className="text-sm sm:text-xs xl:text-sm 2xl:text-sm text-gray-500 line-clamp-2 sm:line-clamp-1 xl:line-clamp-2 2xl:line-clamp-3 w-full">
          {chamado.origem === 'criacao_acessos'
            ? chamado.nome_colaborador
            : chamado.descricao}
        </p>

        <Separator className="my-1.5 sm:my-1 xl:my-1.5 2xl:my-2" />

        <div className="flex items-center justify-between text-xs sm:text-[10px] xl:text-xs 2xl:text-sm text-gray-500">
          <div className="flex items-center gap-1 sm:gap-0.5 xl:gap-1 2xl:gap-2">
            <div className="flex -space-x-2 sm:-space-x-1 xl:-space-x-2 2xl:-space-x-3" onClick={testAvatar}>
              {chamado.tecnico_responsavel ? (
                <MemoizedAvatar email={chamado.tecnico_responsavel} />
              ) : (
                <MemoizedAvatar />
              )}
            </div>
            {chamado.tecnico_responsavel && (
              <span className="text-sm sm:text-xs xl:text-sm 2xl:text-sm font-medium truncate max-w-[80px] sm:max-w-[60px] md:max-w-[80px] lg:max-w-[80px] xl:max-w-[100px] 2xl:max-w-[120px] text-black">
                {getFirstName(chamado.tecnico_responsavel)}
              </span>
            )}
            {!chamado.tecnico_responsavel && (
              <span className="text-sm sm:text-xs xl:text-sm 2xl:text-sm text-gray-500">
                Não atribuído
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-2.5 sm:h-2.5 xl:w-3 xl:h-3 2xl:w-3.5 2xl:h-3.5" />
            <span>{formatDateTimeCompact(chamado.data_solicitacao)}</span>
          </div>
        </div>
      </Card>

      <ChamadoDetailsModal 
        chamado={chamado}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  )
})

// Componente Column memoizado
const Column = memo(function Column({
  column,
  chamados,
}: {
  column: { id: Status; title: string }
  chamados: Chamado[]
}) {
  return (
    <div key={column.id} className="flex flex-col gap-3 w-full">
      <div className={cn(
        "flex items-center justify-center w-full rounded-t-md",
        column.id === "Em fila" ? "bg-red-50" : 
        column.id === "Em atendimento" ? "bg-blue-50" : 
        column.id === "Em aguardo" ? "bg-yellow-50" : 
        "bg-emerald-50"
      )}>
        <h3 className={cn(
          "font-medium text-sm text-center w-full py-2",
          column.id === "Em fila" ? "text-red-700" : 
          column.id === "Em atendimento" ? "text-blue-700" : 
          column.id === "Em aguardo" ? "text-yellow-700" : 
          "text-emerald-700"
        )}>
          {column.title} ({chamados.length})
        </h3>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-2 min-h-[200px] w-full"
          >
            {chamados.map((chamado, index) => (
              <Draggable 
                key={`${chamado.origem}-${chamado.id}`}
                draggableId={`${chamado.origem}-${chamado.id}`}
                index={index}
              >
                {(provided, snapshot) => (
                  <ChamadoCard 
                    chamado={chamado} 
                    provided={provided}
                    snapshot={snapshot}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
})

export function ChamadosBoard({ chamados, onChamadoMove }: ChamadosBoardProps) {
  const [showRespostaDialog, setShowRespostaDialog] = useState(false)
  const [chamadoMovendo, setChamadoMovendo] = useState<{
    id: number;
    origem: string;
    newStatusId: number;
    position: number;
  } | null>(null)

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, draggableId } = result
    
    if (!destination) return

    // Extrair o ID e origem do draggableId (formato: "origem-id")
    const [origem, chamadoIdStr] = draggableId.split('-')
    const chamadoId = parseInt(chamadoIdStr)
    const newStatusId = statusMap[destination.droppableId as Status]
    
    // Encontra o chamado que está sendo movido
    const chamado = chamados.find(c => c.id === chamadoId && c.origem === origem)
    
    // Se estiver movendo para "Concluído" e não tiver resposta_conclusao, mostra o dialog
    if (newStatusId === 4 && chamado && !chamado.resposta_conclusao) {
      setChamadoMovendo({
        id: chamadoId,
        origem,
        newStatusId,
        position: destination.index + 1
      })
      setShowRespostaDialog(true)
      return
    }
    
    // Se não precisar de resposta, move normalmente
    onChamadoMove(chamadoId, newStatusId, origem, destination.index + 1)
  }, [chamados, onChamadoMove])

  const handleSaveResposta = async (resposta: string) => {
    if (!chamadoMovendo) return

    try {
      // Salva a resposta de conclusão
      const response = await fetch('/api/chamados/resposta-conclusao', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chamadoId: chamadoMovendo.id,
          origem: chamadoMovendo.origem,
          respostaConclusao: resposta,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar resposta de conclusão')
      }

      // Move o chamado para Concluído
      onChamadoMove(
        chamadoMovendo.id,
        chamadoMovendo.newStatusId,
        chamadoMovendo.origem,
        chamadoMovendo.position
      )
    } catch (error) {
      console.error('Erro ao salvar resposta de conclusão:', error)
      throw error
    }
  }

  const handleCancelResposta = () => {
    setChamadoMovendo(null)
    setShowRespostaDialog(false)
  }

  const columnChamados = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id] = chamados
        .filter(chamado => chamado.status === column.id)
        .sort((a, b) => (a.position || 1) - (b.position || 1))
      return acc
    }, {} as Record<Status, Chamado[]>)
  }, [chamados])

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[min-content] w-full">
          {columns.map((column) => (
            <Column 
              key={column.id}
              column={column}
              chamados={columnChamados[column.id]}
            />
          ))}
        </div>
      </DragDropContext>

      <RespostaConclusaoDialog
        open={showRespostaDialog}
        onOpenChange={setShowRespostaDialog}
        onSave={handleSaveResposta}
        onCancel={handleCancelResposta}
      />
    </>
  )
}
