import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { taskId, statusId, position, ultima_atualizacao } = await request.json();

    console.log('🔵 Reordenando tarefa...');
    
    // Atualiza a posição e última atualização da tarefa movida
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
    
    // Reordena as outras tarefas do mesmo status se necessário
    await executeQuery({
      query: `
        SET @position = 0;
        UPDATE u711845530_gestao.atividades
        SET position = (@position := @position + 1)
        WHERE status_id = ?
        ORDER BY position;
      `,
      values: [statusId],
    });
    
    console.log('✅ Reordenação concluída');
    
    // Busca dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, s.nome as sistema_nome
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.sistemas s ON a.sistema_id = s.id
        ORDER BY a.status_id, a.position
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