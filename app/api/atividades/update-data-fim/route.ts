import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { taskId, data_fim } = await request.json();

    console.log('🔵 Atualizando data de fim da tarefa...');
    
    // Atualiza a data de fim da tarefa
    await executeQuery({
      query: `
        UPDATE u711845530_gestao.atividades 
        SET data_fim = ?,
            ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR)
        WHERE id = ?
      `,
      values: [data_fim, taskId],
    });
    
    console.log('✅ Data de fim atualizada com sucesso');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao atualizar data de fim da tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar data de fim da tarefa' },
      { status: 500 }
    );
  }
} 