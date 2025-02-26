import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { taskId, statusId, position, ultima_atualizacao } = await request.json();

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
    
    console.log('✅ Reordenação concluída');
    
    // Busca dados atualizados com join otimizado
    const atividades = await executeQuery({
      query: `
        WITH ResponsaveisAgrupados AS (
          SELECT 
            ar.atividade_id,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'email', r.email,
                'nome', r.nome
              )
            ) as responsaveis
          FROM u711845530_gestao.atividades_responsaveis ar
          JOIN u711845530_gestao.responsaveis r ON ar.responsavel_id = r.id
          GROUP BY ar.atividade_id
        )
        SELECT 
          a.*,
          p.nome as projeto_nome,
          ra.responsaveis
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        LEFT JOIN ResponsaveisAgrupados ra ON a.id = ra.atividade_id
        ORDER BY a.status_id, a.position, a.id
      `,
    });
    
    return NextResponse.json(atividades);
  } catch (error) {
    console.error('❌ Erro ao reordenar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar tarefa' },
      { status: 500 }
    );
  }
} 