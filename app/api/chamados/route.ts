import { NextResponse } from 'next/server';
import { dbAtendimento } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ChamadoAtendimento extends RowDataPacket {
  id: number;
  nome_solicitante: string;
  email_solicitante: string;
  secao: string;
  nome_chefia_solicitante: string;
  email_chefia_solicitante: string;
  categoria: string;
  subcategoria?: string;
  titulo?: string;
  prioridade: string;
  descricao: string;
  data_solicitacao: string;
  tecnico_responsavel: string;
  tecnicos_responsaveis?: string;
  data_conclusao: string | null;
  resposta_conclusao: string | null;
  anexo?: string;
}

interface CriacaoAcesso extends RowDataPacket {
  id: number;
  nome_solicitante: string;
  email_solicitante: string;
  secao_colaborador: string;
  nome_chefia_colaborador: string;
  email_chefia_colaborador: string;
  prioridade: string;
  sistemas_solicitados: string;
  observacao: string;
  data_solicitacao: string;
  tecnico_responsavel: string;
  tecnicos_responsaveis?: string;
  data_conclusao: string | null;
  resposta_conclusao: string | null;
  chapa_colaborador: string;
  nome_colaborador: string;
  anexo?: string;
}

interface KanbanPosition extends RowDataPacket {
  id: number;
  tipo_item: 'chamado' | 'acesso';
  id_referencia: number;
  status: string;
  posicao: number | null;
}

interface ChamadoNormalizado {
  id: number;
  nome_solicitante: string;
  email_solicitante: string;
  secao: string;
  nome_chefia_solicitante: string;
  email_chefia_solicitante: string;
  categoria: string;
  subcategoria?: string;
  titulo?: string;
  prioridade: string;
  descricao: string;
  data_solicitacao: string;
  status: string;
  tecnico_responsavel: string;
  tecnicos_responsaveis?: string;
  data_conclusao: string | null;
  resposta_conclusao: string | null;
  origem: string;
  position: number | null;
  secao_colaborador?: string;
  chapa_colaborador?: string;
  nome_colaborador?: string;
  nome_chefia_colaborador?: string;
  email_chefia_colaborador?: string;
  sistemas_solicitados?: string;
  modelo_TOTVS?: string;
  observacao?: string;
  anexo?: string;
}

export async function GET() {
  try {
    // Buscar todos os chamados
    const [chamadosRows] = await dbAtendimento.query<ChamadoAtendimento[]>(
      'SELECT *, "chamados_atendimento" as origem FROM chamados_atendimento'
    );
    
    // Buscar todos os acessos
    const [acessosRows] = await dbAtendimento.query<CriacaoAcesso[]>(
      'SELECT *, "criacao_acessos" as origem FROM criacao_acessos'
    );

    // Buscar informações de posições de kanban
    const [kanbanPositionsRows] = await dbAtendimento.query<KanbanPosition[]>(
      'SELECT * FROM kanban_positions'
    );

    const chamados = Array.isArray(chamadosRows) ? chamadosRows : [];
    const acessos = Array.isArray(acessosRows) ? acessosRows : [];
    const kanbanPositions = Array.isArray(kanbanPositionsRows) ? kanbanPositionsRows : [];

    // NOVO: Verifica e corrige posições duplicadas no banco
    await verificarECorrigirPosicoesNoBanco(kanbanPositions);

    // Buscar novamente as posições após possíveis correções
    const [kanbanPositionsAtualizadas] = await dbAtendimento.query<KanbanPosition[]>(
      'SELECT * FROM kanban_positions'
    );
    const positionsAtualizadas = Array.isArray(kanbanPositionsAtualizadas) ? kanbanPositionsAtualizadas : [];

    // Criar mapa de posições para lookup rápido
    const positionsMap = new Map<string, { status: string; posicao: number | null }>();
    positionsAtualizadas.forEach(pos => {
      const key = `${pos.tipo_item === 'chamado' ? 'chamados_atendimento' : 'criacao_acessos'}-${pos.id_referencia}`;
      positionsMap.set(key, { status: pos.status, posicao: pos.posicao });
    });

    console.log(`Mapa de posições carregado: ${positionsMap.size} itens`);
    
    // Padronizar campos para ambos os tipos
    const normalize = (item: ChamadoAtendimento | CriacaoAcesso, origem: string): ChamadoNormalizado => {
      // Obter as informações de posição a partir do mapa
      const posKey = `${origem}-${item.id}`;
      const posInfo = positionsMap.get(posKey);
      
      console.log(`Normalizando item ${posKey}: status=${posInfo?.status}, posicao=${posInfo?.posicao}`);
      
      if (origem === 'chamados_atendimento') {
        const chamado = item as ChamadoAtendimento;
        return {
          id: chamado.id,
          nome_solicitante: chamado.nome_solicitante,
          email_solicitante: chamado.email_solicitante,
          secao: chamado.secao,
          nome_chefia_solicitante: chamado.nome_chefia_solicitante,
          email_chefia_solicitante: chamado.email_chefia_solicitante,
          categoria: chamado.categoria,
          subcategoria: chamado.subcategoria,
          titulo: chamado.titulo,
          prioridade: chamado.prioridade,
          descricao: chamado.descricao,
          data_solicitacao: chamado.data_solicitacao,
          status: posInfo?.status || 'Em fila', // Usar o status da tabela kanban_positions
          tecnico_responsavel: chamado.tecnico_responsavel,
          tecnicos_responsaveis: chamado.tecnicos_responsaveis,
          data_conclusao: chamado.data_conclusao,
          resposta_conclusao: chamado.resposta_conclusao,
          origem: 'chamados_atendimento',
          position: posInfo?.posicao !== undefined ? posInfo.posicao : 1, // Usar a posição da tabela kanban_positions, começando em 1
        };
      } else {
        const acesso = item as CriacaoAcesso;
        return {
          id: acesso.id,
          nome_solicitante: acesso.nome_solicitante,
          email_solicitante: acesso.email_solicitante,
          secao_colaborador: acesso.secao_colaborador,
          secao: acesso.secao_colaborador,
          nome_chefia_solicitante: acesso.nome_chefia_colaborador,
          email_chefia_solicitante: acesso.email_chefia_colaborador,
          categoria: 'Criação de Acesso',
          prioridade: acesso.prioridade || 'Média',
          descricao: acesso.observacao || '',
          data_solicitacao: acesso.data_solicitacao,
          status: posInfo?.status || 'Em fila',
          tecnico_responsavel: acesso.tecnico_responsavel,
          tecnicos_responsaveis: acesso.tecnicos_responsaveis,
          data_conclusao: acesso.data_conclusao,
          resposta_conclusao: acesso.resposta_conclusao,
          origem: 'criacao_acessos',
          position: posInfo?.posicao !== undefined ? posInfo.posicao : 1,
          chapa_colaborador: acesso.chapa_colaborador || '',
          nome_colaborador: acesso.nome_colaborador || '',
          nome_chefia_colaborador: acesso.nome_chefia_colaborador || '',
          sistemas_solicitados: acesso.sistemas_solicitados || '',
          observacao: acesso.observacao || ''
        };
      }
    };

    // Para chamados sem entrada na tabela kanban_positions, 
    // criar entradas padrão baseado no status atual
    for (const chamado of chamados) {
      const posKey = `chamados_atendimento-${chamado.id}`;
      if (!positionsMap.has(posKey)) {
        // Adicionar à tabela kanban_positions
        await dbAtendimento.execute(
          'INSERT INTO kanban_positions (tipo_item, id_referencia, status, posicao) VALUES (?, ?, ?, ?)',
          ['chamado', chamado.id, 'Em fila', 1]
        );
      }
    }

    for (const acesso of acessos) {
      const posKey = `criacao_acessos-${acesso.id}`;
      if (!positionsMap.has(posKey)) {
        // Adicionar à tabela kanban_positions
        await dbAtendimento.execute(
          'INSERT INTO kanban_positions (tipo_item, id_referencia, status, posicao) VALUES (?, ?, ?, ?)',
          ['acesso', acesso.id, 'Em fila', 1]
        );
      }
    }

    const chamadosPadronizados = [
      ...chamados.map((c) => normalize(c, 'chamados_atendimento')),
      ...acessos.map((a) => normalize(a, 'criacao_acessos')),
    ];

    return NextResponse.json(chamadosPadronizados);
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
    return NextResponse.json({ error: 'Erro ao buscar chamados', details: error }, { status: 500 });
  }
}

// NOVA FUNÇÃO: Verifica e corrige posições duplicadas no banco
async function verificarECorrigirPosicoesNoBanco(positions: KanbanPosition[]) {
  // Agrupa posições apenas por status (ignorando o tipo_item)
  const posicoesPorStatus = positions.reduce((acc, pos) => {
    if (!acc[pos.status]) {
      acc[pos.status] = [];
    }
    acc[pos.status].push(pos);
    return acc;
  }, {} as Record<string, KanbanPosition[]>);
  
  // Para cada status, verifica e corrige posições duplicadas
  for (const [status, posicoes] of Object.entries(posicoesPorStatus)) {
    // Ordena por posição e depois por id (para desempate)
    posicoes.sort((a, b) => {
      const posDiff = (a.posicao || 0) - (b.posicao || 0);
      return posDiff === 0 ? a.id - b.id : posDiff;
    });
    
    // Verifica se há posições duplicadas ou não sequenciais
    const temDuplicadasOuNaoSequenciais = posicoes.some((pos, idx) => {
      return pos.posicao !== idx + 1 || 
        (idx > 0 && pos.posicao === posicoes[idx-1].posicao);
    });
    
    if (temDuplicadasOuNaoSequenciais) {
      console.log(`Detectadas posições duplicadas ou não sequenciais para status ${status}. Corrigindo...`);
      
      // Atualiza posições para serem sequenciais
      for (let i = 0; i < posicoes.length; i++) {
        const novaPos = i + 1; // Começando em 1
        if (posicoes[i].posicao !== novaPos) {
          await dbAtendimento.execute(
            'UPDATE kanban_positions SET posicao = ? WHERE id = ?',
            [novaPos, posicoes[i].id]
          );
          console.log(`Normalizada posição: id=${posicoes[i].id}, tipo=${posicoes[i].tipo_item}, ref=${posicoes[i].id_referencia}, posicao=${novaPos}`);
        }
      }
    }
  }
} 