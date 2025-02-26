import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface Atividade {
  id: number;
  status_id: number;
  position: number;
  projeto_id?: number;
  projeto_nome?: string;
  titulo?: string;
  descricao?: string;
  ultima_atualizacao?: string;
  data_conclusao?: string;
  [key: string]: unknown;
}

interface Responsavel {
  atividade_id: number;
  responsavel_id: number;
  responsavel_email: string;
}

export async function PUT(request: NextRequest) {
  try {
    const { taskId, statusId, position, ultima_atualizacao, isStatusChange, oldStatusId } = await request.json();

    console.log('🔵 Reordenando tarefa...');
    
    // Primeiro, atualiza a posição da tarefa movida
    await executeQuery({
      query: `
        UPDATE u711845530_gestao.atividades 
        SET status_id = ?, 
            position = ?,
            ultima_atualizacao = ?
        WHERE id = ?
      `,
      values: [statusId, position, ultima_atualizacao, taskId],
    });
    
    // Depois, reordena todas as tarefas do mesmo status para garantir posições sequenciais
    await executeQuery({
      query: `
        WITH RankedActivities AS (
          SELECT id, 
                 ROW_NUMBER() OVER (
                   PARTITION BY status_id 
                   ORDER BY CASE 
                     WHEN id = ? THEN 0 
                     ELSE 1 
                   END,
                   position,
                   id
                 ) - 1 as new_position
          FROM u711845530_gestao.atividades
          WHERE status_id = ?
        )
        UPDATE u711845530_gestao.atividades a
        INNER JOIN RankedActivities r ON a.id = r.id
        SET a.position = r.new_position
        WHERE a.status_id = ?
      `,
      values: [taskId, statusId, statusId],
    });
    
    // Se houve mudança de status, também reordena as tarefas do status antigo
    if (isStatusChange && oldStatusId) {
      await executeQuery({
        query: `
          WITH RankedActivities AS (
            SELECT id, 
                   ROW_NUMBER() OVER (
                     PARTITION BY status_id 
                     ORDER BY position, id
                   ) - 1 as new_position
            FROM u711845530_gestao.atividades
            WHERE status_id = ?
          )
          UPDATE u711845530_gestao.atividades a
          INNER JOIN RankedActivities r ON a.id = r.id
          SET a.position = r.new_position
          WHERE a.status_id = ?
        `,
        values: [oldStatusId, oldStatusId],
      });
    }
    
    console.log('✅ Reordenação concluída');
    
    // Busca dados atualizados - simplificando a consulta para evitar erros
    const atividades = await executeQuery({
      query: `
        SELECT 
          a.*,
          p.nome as projeto_nome
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        ORDER BY a.status_id, a.position, a.id
      `,
    }) as Atividade[];
    
    // Agora vamos buscar os responsáveis em uma consulta separada
    const responsaveis = await executeQuery({
      query: `
        SELECT 
          ar.atividade_id,
          r.id as responsavel_id,
          r.email as responsavel_email
        FROM u711845530_gestao.atividades_responsaveis ar
        JOIN u711845530_gestao.responsaveis r ON ar.responsavel_id = r.id
      `,
    }) as Responsavel[];
    
    // Mapeamos os responsáveis para cada atividade
    const atividadesComResponsaveis = atividades.map((atividade: Atividade) => {
      const responsaveisDaAtividade = responsaveis.filter(
        (r: Responsavel) => r.atividade_id === atividade.id
      ).map((r: Responsavel) => ({
        id: r.responsavel_id,
        email: r.responsavel_email
      }));
      
      return {
        ...atividade,
        responsaveis: responsaveisDaAtividade
      };
    });
    
    return NextResponse.json(atividadesComResponsaveis);
  } catch (error) {
    console.error('❌ Erro ao reordenar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar tarefa' },
      { status: 500 }
    );
  }
} 