import { create } from 'zustand'
import type { Chamado, Status } from '@/components/chamados-board'

interface OptimisticUpdate {
  statusId: number
  position: number
  timestamp: number
  sequence: number
}

interface ReorderRequestBody {
  chamadoId: number
  newStatus: string
  origem: string
  newPosition: number
  userName?: string
}

interface ChamadoAPI {
  id: number
  categoria: string
  subcategoria?: string
  titulo?: string
  descricao: string
  prioridade: string
  status: Status
  nome_solicitante: string
  tecnico_responsavel: string | null
  tecnicos_responsaveis?: string
  data_solicitacao: string
  data_conclusao: string | null
  resposta_conclusao: string | null
  position: number
  origem: 'chamados_atendimento' | 'criacao_acessos'
  secao?: string
  chapa_colaborador?: string
  nome_colaborador?: string
  secao_colaborador?: string
  nome_chefia_colaborador?: string
  sistemas_solicitados?: string
  nome_chefia_solicitante?: string
}

interface ChamadosStore {
  chamados: Chamado[]
  setChamados: (chamados: Chamado[]) => void
  updateChamadoPosition: (chamadoId: number, newStatusId: number, origem: string, newIndex: number, userName?: string) => void
  fetchChamados: () => Promise<void>
  isLoading: boolean
  optimisticUpdates: Map<string, OptimisticUpdate>
  lastSequence: number
}

const statusNameMap: Record<number, Status> = {
  1: "Em fila",
  2: "Em atendimento",
  3: "Em aguardo",
  4: "Concluído",
}

export const useChamadosStore = create<ChamadosStore>()((set, get) => ({
  chamados: [],
  isLoading: true,
  optimisticUpdates: new Map(),
  lastSequence: 0,
  
  setChamados: (chamados) => {
    const { optimisticUpdates } = get();
    const now = Date.now();
    
    // Aplica atualizações otimistas pendentes
    const chamadosWithOptimistic = chamados.map(chamado => {
      const chamadoKey = `${chamado.origem}-${chamado.id}`;
      const optimisticUpdate = optimisticUpdates.get(chamadoKey);
      
      if (optimisticUpdate && now - optimisticUpdate.timestamp < 10000) {
        return {
          ...chamado,
          status_id: optimisticUpdate.statusId,
          status: statusNameMap[optimisticUpdate.statusId],
          position: optimisticUpdate.position
        };
      }
      return chamado;
    });

    // Garante que todos os chamados tenham posições válidas
    const chamadosWithPositions = chamadosWithOptimistic.map((chamado) => ({
      ...chamado,
      position: chamado.position ?? 1
    }));

    // Agrupa por status e ordena por posição
    const chamadosByStatus = chamadosWithPositions.reduce((acc, chamado) => {
      if (!acc[chamado.status_id]) {
        acc[chamado.status_id] = [];
      }
      acc[chamado.status_id].push(chamado);
      return acc;
    }, {} as Record<number, Chamado[]>);

    // Reordena as posições dentro de cada status garantindo exclusividade
    Object.values(chamadosByStatus).forEach(statusChamados => {
      // Primeiro ordenamos pelo campo original de posição e também pelo ID como desempate
      statusChamados.sort((a, b) => {
        const positionDiff = (a.position || 1) - (b.position || 1);
        if (positionDiff === 0) {
          // Usa ID como critério de desempate quando posições são iguais
          if (a.origem === b.origem) {
            return a.id - b.id;
          }
          // Se origens forem diferentes, prioriza chamados sobre acessos
          return a.origem === 'chamados_atendimento' ? -1 : 1;
        }
        return positionDiff;
      });
      
      // Agora atribuímos posições únicas e sequenciais
      statusChamados.forEach((chamado, index) => {
        chamado.position = index + 1; // Posições começam em 1
      });
    });

    // Flatten e set
    const normalizedChamados = Object.values(chamadosByStatus).flat();
    
    set({
      chamados: normalizedChamados,
      isLoading: false
    });
  },
  
  updateChamadoPosition: (chamadoId, newStatusId, origem, newIndex, userName) => {
    set((state) => {
      const nextSequence = state.lastSequence + 1;
      const chamados = [...state.chamados];
      const chamadoKey = `${origem}-${chamadoId}`;
      
      // Encontra o chamado a ser movido
      const chamadoToMove = chamados.find(c => c.id === chamadoId && c.origem === origem);
      if (!chamadoToMove) return state;
      
      const oldStatusId = chamadoToMove.status_id;
      const isStatusChange = oldStatusId !== newStatusId;
      
      // Valor de timestamp para identificação de mudanças recentes
      const timestamp = Date.now();
      
      // Atualiza o chamado movido com o novo status
      chamadoToMove.status_id = newStatusId;
      chamadoToMove.status = statusNameMap[newStatusId];
      
      // Abordagem similar ao kanban para garantir posições únicas
      if (isStatusChange) {
        // 1. Reordena os chamados no status de origem (removendo o item movido)
        const chamadosInOldStatus = chamados
          .filter(c => c.status_id === oldStatusId && !(c.id === chamadoId && c.origem === origem))
          .sort((a, b) => (a.position || 1) - (b.position || 1));
        
        // Recalcula as posições no status antigo
        chamadosInOldStatus.forEach((chamado, index) => {
          chamado.position = index + 1; // Posições começam em 1
        });
        
        // 2. Reordena os chamados no status de destino (sem incluir o item movido ainda)
        const chamadosInNewStatus = chamados
          .filter(c => c.status_id === newStatusId && !(c.id === chamadoId && c.origem === origem))
          .sort((a, b) => (a.position || 1) - (b.position || 1));
        
        // 3. Insere o chamado na posição específica
        if (newIndex <= chamadosInNewStatus.length + 1) {
          // Inserção dentro dos limites
          chamadosInNewStatus.splice(newIndex - 1, 0, chamadoToMove);
        } else {
          // Inserção no final se a posição for maior que o tamanho
          chamadosInNewStatus.push(chamadoToMove);
        }
        
        // 4. Recalcula todas as posições no status de destino
        chamadosInNewStatus.forEach((chamado, index) => {
          chamado.position = index + 1; // Posições começam em 1
        });
      } else {
        // Movendo dentro do mesmo status
        // 1. Obtém todos os chamados do status (incluindo o movido)
        const chamadosInSameStatus = chamados
          .filter(c => c.status_id === newStatusId)
          .sort((a, b) => (a.position || 1) - (b.position || 1));
        
        // 2. Remove o chamado da sua posição atual
        const currentIndex = chamadosInSameStatus.findIndex(c => c.id === chamadoId && c.origem === origem);
        if (currentIndex !== -1) {
          chamadosInSameStatus.splice(currentIndex, 1);
        }
        
        // 3. Insere o chamado na nova posição
        if (newIndex <= chamadosInSameStatus.length + 1) {
          chamadosInSameStatus.splice(newIndex - 1, 0, chamadoToMove);
        } else {
          chamadosInSameStatus.push(chamadoToMove);
        }
        
        // 4. Recalcula todas as posições
        chamadosInSameStatus.forEach((chamado, index) => {
          chamado.position = index + 1; // Posições começam em 1
        });
      }
      
      // Adiciona à lista de atualizações otimistas
      const newOptimisticUpdates = new Map(state.optimisticUpdates);
      newOptimisticUpdates.set(chamadoKey, {
        statusId: newStatusId,
        position: chamadoToMove.position, // Usa a posição recalculada
        timestamp,
        sequence: nextSequence
      });
      
      // Chama a API para atualizar no backend
      fetch('/api/chamados/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chamadoId,
          newStatus: newStatusId.toString(),
          origem,
          newPosition: chamadoToMove.position,
          userName
        } as ReorderRequestBody),
      }).catch(error => {
        console.error('Erro ao atualizar posição do chamado:', error);
      });
      
      return {
        chamados: chamados,
        optimisticUpdates: newOptimisticUpdates,
        lastSequence: nextSequence
      };
    });
  },
  
  fetchChamados: async () => {
    set({ isLoading: true });
    
    try {
      const res = await fetch('/api/chamados');
      const data = await res.json();
      
      // Mapeia os dados para o formato esperado
      const normalizedChamados = data.map((chamado: ChamadoAPI) => ({
        id: chamado.id,
        titulo: chamado.titulo || chamado.categoria, // Usar titulo se existir, senão usar categoria
        categoria: chamado.categoria,
        subcategoria: chamado.subcategoria,
        descricao: chamado.descricao,
        prioridade: chamado.prioridade,
        status: chamado.status,
        nome_solicitante: chamado.nome_solicitante,
        tecnico_responsavel: chamado.tecnico_responsavel,
        tecnicos_responsaveis: chamado.tecnicos_responsaveis,
        data_solicitacao: chamado.data_solicitacao,
        data_conclusao: chamado.data_conclusao,
        resposta_conclusao: chamado.resposta_conclusao,
        status_id: chamado.status === 'Em fila' ? 1 : 
                  chamado.status === 'Em atendimento' ? 2 : 
                  chamado.status === 'Em aguardo' ? 3 : 4,
        position: chamado.position || 1,
        origem: chamado.origem,
        // Campo específico para chamados_atendimento
        secao: chamado.secao,
        nome_chefia_solicitante: chamado.nome_chefia_solicitante,
        // Campos específicos para criacao_acessos
        chapa_colaborador: chamado.chapa_colaborador,
        nome_colaborador: chamado.nome_colaborador,
        secao_colaborador: chamado.secao_colaborador,
        nome_chefia_colaborador: chamado.nome_chefia_colaborador,
        sistemas_solicitados: chamado.sistemas_solicitados,
      }));
      
      get().setChamados(normalizedChamados);
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      set({ isLoading: false });
    }
  }
})); 